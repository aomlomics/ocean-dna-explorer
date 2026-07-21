"use client";

import { Analysis, Assay } from "@/app/generated/prisma/client";
import { MAX_UNCOMPRESSED_LENGTH, compressURIComponent } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent, useEffect, useState } from "react";

export const BLAST_QUERY_LIMIT = 1;

//TODO: expand options, style
//TODO: add clear query button
export default function BlastSearch() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const { sessionClaims } = useAuth();
	const role = sessionClaims?.metadata?.role;

	const [assayNames, setAssayNames] = useState(undefined as Assay["assay_name"][] | undefined);

	const [error, setError] = useState("");

	const [blastDatabase, setBlastDatabase] = useState("");
	const defaultQueries = [] as string[];
	const paramQueries = searchParams.getAll("blastQuery");
	if (paramQueries.length === 1 && paramQueries[0].split(",").length === 1) {
		defaultQueries.push(paramQueries[0]);
	} else {
		for (const query of paramQueries) {
			const split = query.split(",");
			//ignore improperly formatted queries
			if (split.length >= 2) {
				defaultQueries.push(`>${split[0]}\n${split[1]}`);
			}
		}
	}
	const [blastQuery, setBlastQuery] = useState(defaultQueries.join("\n"));

	useEffect(() => {
		async function doFetch() {
			const res = await fetch(`/api/assay?fields=assay_name&relations=analysis`);
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success") {
					const names = response.result.reduce(
						(
							acc: Assay["assay_name"][],
							a: { assay_name: Assay["assay_name"]; Analyses: { id: Analysis["id"] }[] }
						) => {
							if (a.Analyses.length) {
								acc.push(a.assay_name);
							}

							return acc;
						},
						[]
					) as Assay["assay_name"][];
					setAssayNames(names);
					const blastDbParam = names?.find((a) => a === searchParams.get("blastDatabase"));
					if (blastDbParam) {
						setBlastDatabase(blastDbParam);
					}
				} else if (response.statusMessage === "error") {
					setError(response.error);
					return;
				}
			} else {
				setError(res.statusText);
				return;
			}
		}

		doFetch();
	}, []);

	useEffect(() => {
		if (blastQuery && parseBlast(blastQuery)) {
			setError("");
		}
	}, [blastQuery]);

	useEffect(() => {
		setBlastDatabase(assayNames?.find((a) => a === searchParams.get("blastDatabase")) || "");
		setBlastQuery(searchParams.get("blastQuery") || "");
	}, [searchParams]);

	function parseBlast(text: string) {
		//commas ruin the searchParam format
		if (text.includes(",")) {
			setError("Commas are not allowed in .fasta format.");
			return;
		}

		const names = new Set() as Set<string>;
		const sequences = new Set() as Set<string>;
		const queries = [] as ([string] | [string, string])[];

		function isBadQuery(query: [string, string]) {
			if (queries.length > BLAST_QUERY_LIMIT) {
				setError(`Only ${BLAST_QUERY_LIMIT} BLAST query is allowed.`);
				return true;
			}

			if (!query[0].substring(1)) {
				setError("Empty query found.");
				return true;
			}

			if (names.has(query[0])) {
				setError("Duplicate query: " + query[0]);
				return true;
			}

			if (query[1] === "") {
				setError("Empty sequence for query: " + query[0]);
				return true;
			}

			if (sequences.has(query[1])) {
				setError("Duplicate sequence: " + query[1]);
				return true;
			}

			names.add(query[0]);
			sequences.add(query[1]);
		}

		//split on \r\n, \n, and \r
		const split = text.split(/\r?\n|\r/);

		if (text.startsWith(">")) {
			//.fasta format (https://www.ncbi.nlm.nih.gov/genbank/fastaformat/)
			let curr = [split.shift()!.trim().substring(1), ""] as [string, string];
			for (const line of split) {
				const trimmed = line.trim();
				//new named query
				if (trimmed.startsWith(">")) {
					//save previous query
					if (curr.length) {
						if (isBadQuery(curr)) {
							return;
						}
						queries.push(curr);
					}
					//start new query
					curr = [trimmed.substring(1), ""];
				} else if (trimmed) {
					//ignore empty lines
					curr[1] += trimmed;
				}
			}
			//catch last query
			queries.push(curr);
			if (isBadQuery(curr)) {
				return;
			}
		} else {
			//singular sequence, potentially with newlines
			queries.push([split.map((s) => s.trim()).join("")]);

			if (!queries[0].length) {
				return;
			}
		}

		return queries;
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const newParams = new URLSearchParams(searchParams);

		const saveBlast = event.currentTarget.saveBlast.checked;
		if (saveBlast) {
			newParams.set("saveBlast", saveBlast);
		}

		if (blastDatabase) {
			newParams.set("blastDatabase", blastDatabase);
		}

		const queries = parseBlast(blastQuery);
		if (queries) {
			setError("");

			//replace old blast queries with new ones
			if (queries.toString().length > MAX_UNCOMPRESSED_LENGTH) {
				newParams.set("blastQuery", compressURIComponent(JSON.stringify(queries)));
			} else {
				newParams.delete("blastQuery");
				for (const q of queries) {
					newParams.append("blastQuery", q.join(","));
				}
			}

			router.push(`${pathname}?${newParams.toString()}`);
		}
	}

	return (
		<form onSubmit={handleSubmit} inert={!assayNames}>
			{error}
			<fieldset className="fieldset" key={assayNames?.toString()}>
				<legend className="fieldset-legend">Database</legend>
				<select value={blastDatabase} onChange={(e) => setBlastDatabase(e.currentTarget.value)} className="select">
					<option value="">All</option>
					{assayNames?.map((assay_name) => (
						<option key={assay_name}>{assay_name}</option>
					))}
				</select>
			</fieldset>

			<textarea className="textarea" value={blastQuery} onChange={(e) => setBlastQuery(e.currentTarget.value)} />

			<label htmlFor="blastFile" className="btn btn-primary">
				Browse...
			</label>
			<input
				id="blastFile"
				type="file"
				className="hidden"
				accept=".fasta"
				onChange={async (e) => {
					if (e.currentTarget.files) {
						const file = e.currentTarget.files[0];
						e.currentTarget.value = "";
						if (file.name.endsWith(".fasta")) {
							setBlastQuery(await file.text());
						} else {
							setError("File must be of type .fasta.");
						}
					}
				}}
			/>

			{role && RolePermissions[role].includes("contribute") ? (
				<fieldset className="fieldset">
					<label className="label select-none">
						<input name="saveBlast" type="checkbox" className="checkbox" />
						Save BLAST
					</label>
				</fieldset>
			) : (
				<></>
			)}

			<button className="btn btn-success" disabled={!blastQuery}>
				BLAST
			</button>
		</form>
	);
}
