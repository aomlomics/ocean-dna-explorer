"use client";

import { Analysis, Assay } from "@/app/generated/prisma/client";
import { MAX_UNCOMPRESSED_LENGTH, compressURIComponent } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { SubmitEvent, useEffect, useState } from "react";
import InfoButton from "../InfoButton";
import { BlastQueryWithRelations } from "@/prisma/generated/zod";
import Link from "next/link";
import { parseBlastRequest } from "@/app/helpers/blast";

const DEFAULT_NUM_RESULTS = 10;
const DEFAULT_EVALUE = 1e-10;
const DEFAULT_PERCENT_IDENTITY = 95;
const DEFAULT_QCOV_HSP = 80;

//TODO: add clear query button
//TODO: add list of existing queries for current user
//TODO: use the useRouter hook instead of updating window.location.href directly (previously was unreliably failing to navigate on prod)
export default function BlastSearch() {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const { userId, sessionClaims } = useAuth();
	const role = sessionClaims?.metadata?.role;

	const [prevQueries, setPrevQueries] = useState(undefined as BlastQueryWithRelations[] | undefined);
	const [assayNames, setAssayNames] = useState(undefined as Assay["assay_name"][] | undefined);

	const [error, setError] = useState("");

	const [blastDatabase, setBlastDatabase] = useState("");
	const [blastQuery, setBlastQuery] = useState("");
	const [task, setTask] = useState("blastn" as "blastn" | "megablast");
	const [max_target_seqs, set_max_target_seqs] = useState(NaN);
	const [evalue, set_evalue] = useState("");
	const [perc_identity, set_perc_identity] = useState(NaN);
	const [qcov_hsp_perc, set_qcov_hsp_perc] = useState(NaN);

	useEffect(() => {
		async function doFetch() {
			const res = await fetch("/api/assay?fields=assay_name&relations=analysis");
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
		if (!blastQuery || parseBlast(blastQuery)) {
			setError("");
		}
	}, [blastQuery]);

	useEffect(() => {
		const defaults = {
			database: "" as typeof blastDatabase,
			query: "" as typeof blastQuery,
			task: "blastn" as typeof task,
			max_target_seqs: NaN as typeof max_target_seqs,
			evalue: "" as typeof evalue,
			perc_identity: NaN as typeof perc_identity,
			qcov_hsp_perc: NaN as typeof qcov_hsp_perc
		};

		const blast = parseBlastRequest(new URLSearchParams(searchParams), { safe: true });
		if (blast) {
			defaults.database = assayNames?.find((a) => a === blast.assay_name) || "";
			defaults.query = blast.queries.map((q) => (typeof q === "string" ? q : `>${q[0]}\n${q[1]}`)).join("\n");

			if (blast.options) {
				if (blast.options.task === "megablast") defaults.task = "megablast";
				if (blast.options.max_target_seqs != null) defaults.max_target_seqs = blast.options.max_target_seqs;
				if (blast.options.evalue != null) defaults.evalue = blast.options.evalue.toString();
				if (blast.options.perc_identity != null) defaults.perc_identity = blast.options.perc_identity;
				if (blast.options.qcov_hsp_perc != null) defaults.qcov_hsp_perc = blast.options.qcov_hsp_perc;
			}
		}

		setBlastDatabase(defaults.database);
		setBlastQuery(defaults.query);
		setTask(defaults.task);
		set_max_target_seqs(defaults.max_target_seqs);
		set_evalue(defaults.evalue);
		set_perc_identity(defaults.perc_identity);
		set_qcov_hsp_perc(defaults.qcov_hsp_perc);
	}, [searchParams.toString()]);

	function parseBlast(text: string) {
		const names = new Set() as Set<string>;
		const sequences = new Set() as Set<string>;
		const queries = [] as ([string] | [string, string])[];

		function isBadQuery(query: [string, string]) {
			if (!query[0]) {
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

		//URL encode commas, split on \r\n, \n, and \r
		const split = text.replace(",", "%2C").split(/\r?\n|\r/);

		if (text.startsWith(">")) {
			//.fasta format
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

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const newParams = new URLSearchParams(searchParams);

		newParams.delete("blastDatabase");
		if (blastDatabase) newParams.set("blastDatabase", blastDatabase);
		newParams.set("task", task);
		newParams.delete("max_target_seqs");
		if (!isNaN(max_target_seqs)) newParams.set("max_target_seqs", max_target_seqs.toString());
		newParams.delete("evalue");
		if (evalue) newParams.set("evalue", evalue);
		newParams.delete("perc_identity");
		if (!isNaN(perc_identity)) newParams.set("perc_identity", perc_identity.toString());
		newParams.delete("qcov_hsp_perc");
		if (!isNaN(qcov_hsp_perc)) newParams.set("qcov_hsp_perc", qcov_hsp_perc.toString());

		const blastSave = event.currentTarget.blastSave?.checked;
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

			newParams.delete("blastSave");
			if (blastSave) newParams.set("blastSave", blastSave);

			// router.push(`${pathname}?${newParams}`);
			window.location.href = `${pathname}?${newParams.toString()}`;
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col items-start" aria-disabled={!assayNames}>
			<fieldset className="fieldset w-full" key={assayNames?.toString()}>
				<legend className="fieldset-legend">Database</legend>
				<select value={blastDatabase} onChange={(e) => setBlastDatabase(e.currentTarget.value)} className="select">
					<option value="">All</option>
					{assayNames?.map((assay_name) => (
						<option key={assay_name}>{assay_name}</option>
					))}
				</select>
			</fieldset>

			<fieldset className="fieldset w-full">
				<legend className="fieldset-legend w-full">
					<div className="w-full">
						<div>Query</div>
						<div className="flex justify-between">
							<div>
								Enter sequence(s) in{" "}
								<Link className="link link-primary link-hover" href="https://www.ncbi.nlm.nih.gov/genbank/fastaformat/">
									FASTA format
								</Link>
							</div>
							<div className="text-warning">{error}</div>
						</div>
					</div>
				</legend>
				<textarea
					className="textarea w-full aspect-4/1"
					value={blastQuery}
					onChange={(e) => setBlastQuery(e.currentTarget.value)}
				/>
			</fieldset>

			<fieldset className="fieldset justify-items-start">
				<legend className="fieldset-legend">Or submit a .fasta file</legend>
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
			</fieldset>

			{role && RolePermissions[role].includes("contribute") ? (
				<fieldset className="fieldset mt-2">
					<label className="label select-none">
						<input name="blastSave" type="checkbox" className="checkbox" />
						Save BLAST
					</label>
				</fieldset>
			) : (
				<></>
			)}

			<h1 className="text-primary text-2xl py-2 border-b border-primary w-full text-center">BLAST Options</h1>

			<div className="flex flex-col items-center w-full">
				<fieldset className="fieldset border-base-300 rounded-box border px-4 pt-2 pb-4">
					<legend className="fieldset-legend">blastn or megablast</legend>
					<label className="label select-none">
						<input
							type="checkbox"
							className="toggle"
							checked={task === "megablast"}
							onChange={(e) => (e.target.checked ? setTask("megablast") : setTask("blastn"))}
						/>
						{task}
					</label>
				</fieldset>

				<div className="grid grid-cols-2 gap-x-5">
					<fieldset className="fieldset">
						<div className="flex flex-between">
							<legend className="fieldset-legend">Number of Results</legend>
							<InfoButton>
								<div className="text-primary font-bold">
									max_target_seqs <span className="text-base-content/50">(1 - 100)</span>
								</div>
								<span>The maximum number of aligned sequences to keep per query.</span>
							</InfoButton>
						</div>
						<input
							type="number"
							min="1"
							max="100"
							className="input"
							placeholder={`${DEFAULT_NUM_RESULTS}`}
							value={max_target_seqs.toString()}
							onChange={(e) => set_max_target_seqs(parseInt(e.currentTarget.value))}
						/>
					</fieldset>

					<fieldset className="fieldset">
						<div className="flex flex-between">
							<legend className="fieldset-legend">Maximum eValue</legend>
							<InfoButton>
								<div className="text-primary font-bold">
									evalue <span className="text-base-content/50">(0 - 1e6)</span>
								</div>
								<span>Maximum Expectation value threshold. Drops hits above this probability threshold.</span>
							</InfoButton>
						</div>
						<input
							className="input"
							placeholder={`${DEFAULT_EVALUE}`}
							value={evalue.toString()}
							onChange={(e) => set_evalue(e.currentTarget.value)}
						/>
					</fieldset>

					<fieldset className="fieldset">
						<div className="flex flex-between">
							<legend className="fieldset-legend">Minimum Percent Identity</legend>
							<InfoButton>
								<div className="text-primary font-bold">
									perc_identity <span className="text-base-content/50">(0 - 100)</span>
								</div>
								<span>Minimum percent identity of the alignment.</span>
							</InfoButton>
						</div>
						<input
							type="number"
							min="0"
							max="100"
							className="input"
							placeholder={`${DEFAULT_PERCENT_IDENTITY}`}
							value={perc_identity.toString()}
							onChange={(e) => set_perc_identity(parseFloat(e.currentTarget.value))}
						/>
					</fieldset>

					<fieldset className="fieldset">
						<div className="flex flex-between gap-5">
							<legend className="fieldset-legend">Minimum Percent Query Coverage</legend>
							<InfoButton>
								<div className="text-primary font-bold">
									qcov_hsp_perc <span className="text-base-content/50">(0 - 100)</span>
								</div>
								<span>Minimum percent query coverage per HSP (High Scoring Pair).</span>
							</InfoButton>
						</div>
						<input
							type="number"
							min="0"
							max="100"
							className="input"
							placeholder={`${DEFAULT_QCOV_HSP}`}
							value={qcov_hsp_perc.toString()}
							onChange={(e) => set_qcov_hsp_perc(parseFloat(e.currentTarget.value))}
						/>
					</fieldset>
				</div>
			</div>

			<button className="btn btn-success self-stretch mt-4 mx-30" disabled={!blastQuery}>
				BLAST
			</button>
		</form>
	);
}
