import { BlastRequest, NetworkPacket, Role } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { BlastQuery, BlastQueryResult } from "../generated/prisma/client";
import { COMPRESSION_FORMAT, decompressURIComponent } from "./utils";

export function parseBlastRequest(searchParams: URLSearchParams, options?: { safe?: true; noPrefix?: true }) {
	const tempQueries = searchParams.getAll(options?.noPrefix ? "query" : "blastQuery");
	let queries = tempQueries.reduce(
		(acc, q) => {
			const split = q.split(",");
			//ignore queries with too many args
			if (split.length > 2) {
				if (!options?.safe)
					throw new Error("Format is either <sequence> or <query>,<sequence>. More than 2 values were provided.");
			} else {
				//ignore queries with too few args when more than one query is provided
				if (tempQueries.length > 1 && split.length === 1) {
					if (!options?.safe)
						throw new Error("If more than one sequence is provided, all sequences must have query names.");
				} else {
					acc.push(q.startsWith(COMPRESSION_FORMAT) || split.length === 1 ? q : [split[0]!, split[1]!]);
				}
			}

			return acc;
		},
		[] as BlastRequest["queries"]
	);
	//uncompress if necessary
	if (queries.length === 1 && typeof queries[0] === "string" && queries[0].startsWith(COMPRESSION_FORMAT)) {
		queries = JSON.parse(decompressURIComponent(queries[0]));
		if (
			!Array.isArray(queries) ||
			!queries.every((e) => typeof e === "string" || (Array.isArray(e) && e.every((ee) => typeof ee === "string")))
		) {
			throw new Error(
				`Compressed queries must be an array of strings or string arrays in ${COMPRESSION_FORMAT} format.`
			);
		}
	}

	searchParams.delete(options?.noPrefix ? "query" : "blastQuery");
	const database = searchParams.get(options?.noPrefix ? "database" : "blastDatabase");
	searchParams.delete(options?.noPrefix ? "database" : "blastDatabase");
	const save = searchParams.get(options?.noPrefix ? "save" : "blastSave");
	searchParams.delete(options?.noPrefix ? "save" : "blastSave");

	//options
	const task = searchParams.get("task");
	searchParams.delete("task");
	const max_target_seqs = searchParams.get("max_target_seqs");
	searchParams.delete("max_target_seqs");
	const evalue = searchParams.get("evalue");
	searchParams.delete("evalue");
	const perc_identity = searchParams.get("perc_identity");
	searchParams.delete("perc_identity");
	const qcov_hsp_perc = searchParams.get("qcov_hsp_perc");
	searchParams.delete("qcov_hsp_perc");

	try {
		if (!queries.length) {
			if (database != null) {
				throw new Error("Must provide a blast query with blastDatabase option.");
			}
			if (task != null) {
				throw new Error("Must provide a blast query with task option.");
			}
			if (max_target_seqs != null) {
				throw new Error("Must provide a blast query with max_target_seqs option.");
			}
			if (evalue != null) {
				throw new Error("Must provide a blast query with evalue option.");
			}
			if (perc_identity != null) {
				throw new Error("Must provide a blast query with perc_identity option.");
			}
			if (qcov_hsp_perc != null) {
				throw new Error("Must provide a blast query with qcov_hsp_perc option.");
			}
			if (save != null) {
				throw new Error("Must provide a blast query with blastSave option.");
			}
		}

		if (queries.length) {
			const blast = {
				queries,
				assay_name: database
			} as BlastRequest;

			if (save) {
				if (save.toLowerCase() === "true") {
					blast.save = true;
				} else if (save.toLowerCase() === "false") {
					blast.save = false;
				} else {
					throw new Error('The blastSave option must be "true" or "false"');
				}
			}

			const blastOptions = {} as NonNullable<BlastRequest["options"]>;

			if (task && task !== "blastn") {
				blastOptions.task = task;
			}
			if (max_target_seqs) {
				const parsed = parseInt(max_target_seqs);
				if (isNaN(parsed)) {
					throw new Error("The max_target_seqs must be an integer.");
				}
				blastOptions.max_target_seqs = parsed;
			}
			if (evalue) {
				const parsed = parseFloat(evalue);
				if (isNaN(parsed)) {
					throw new Error("The evalue must be a float.");
				}
				blastOptions.evalue = parsed;
			}
			if (perc_identity) {
				const parsed = parseFloat(perc_identity);
				if (isNaN(parsed)) {
					throw new Error("The perc_identity must be a float.");
				}
				blastOptions.perc_identity = parsed;
			}
			if (qcov_hsp_perc) {
				const parsed = parseFloat(qcov_hsp_perc);
				if (isNaN(parsed)) {
					throw new Error("The qcov_hsp_perc must be a float.");
				}
				blastOptions.qcov_hsp_perc = parsed;
			}

			if (Object.keys(blastOptions).length) {
				blast.options = blastOptions;
			}

			return blast;
		}
	} catch (err) {
		if (!options?.safe) {
			throw err;
		}
	}
}

export function insertBlastIntoQuery(blast: BlastRequest | undefined, query: URLSearchParams) {
	if (blast) {
		blast.queries.forEach((q) => query.append("blastQuery", q.toString()));
		if (blast.assay_name) query.set("blastDatabase", blast.assay_name);
		if (blast.save) query.set("blastSave", blast.save.toString());
		if (blast.options) Object.entries(blast.options).forEach(([k, v]) => query.set(k, v.toString()));
	}
}

export function blastCookieHasBlast(blast: BlastRequest | undefined, cookie: string | undefined) {
	if (blast && cookie) {
		let bad = false;
		const parsedCookie = decodeURIComponent(cookie)
			.split(";")
			.reduce((acc, c) => {
				const trimmed = c.trim();
				if (trimmed) {
					const parsed = parseBlastRequest(new URLSearchParams(trimmed), { noPrefix: true, safe: true });
					if (parsed) {
						acc.push(parsed);
					} else {
						bad = true;
					}
				}

				return acc;
			}, [] as BlastRequest[]);

		if (bad) {
			return false;
		}

		if (
			parsedCookie.some(
				(pc) =>
					blast.assay_name === pc.assay_name &&
					blast.queries.every((q) =>
						typeof q === "string"
							? pc.queries.includes(q)
							: pc.queries.find((pcq) => Array.isArray(pcq) && pcq[0] === q[0] && pcq[1] === q[1])
					) &&
					((!blast.options && !pc.options) ||
						(blast.options &&
							pc.options &&
							Object.keys(blast.options).length === Object.keys(pc.options).length &&
							Object.entries(blast.options).every(([k, v]) => v === pc.options![k as keyof typeof pc.options])))
			)
		) {
			return true;
		}
	}

	return false;
}

function blastRequestToString(blast: BlastRequest) {
	return (
		blast.queries.map((q) => `query=${q}`).join("&") +
		(blast.assay_name ? `&assay_name=${blast.assay_name}` : "") +
		(blast.options
			? "&" +
				Object.entries(blast.options)
					.map(([k, v]) => k + "=" + v)
					.join("&")
			: "")
	);
}

export async function fetchBlast(
	blast: BlastRequest,
	auth?: { role: Role | undefined; token: string | null },
	cookieStore?: ReadonlyRequestCookies
) {
	if (blast.save && (!auth?.role || !RolePermissions[auth.role].includes("contribute"))) {
		throw new Error("You must be signed in with the contribute permission to save BLAST queries.");
	}

	let shouldblastSave = false;
	const savedBlasts = cookieStore?.get("savedBlasts")?.value || "";
	if (blast.save && auth?.token && !blastCookieHasBlast(blast, savedBlasts)) {
		shouldblastSave = true;
	}

	let res;
	const blastRequestString = blastRequestToString(blast);
	try {
		res = await fetch(
			`${process.env.NEXT_PUBLIC_SERVER_URL}/blast?${blastRequestString}`,
			shouldblastSave
				? {
						method: "POST",
						headers: {
							Authorization: "Bearer " + auth!.token
						}
					}
				: undefined
		);
	} catch {
		throw new Error("Could not reach BLAST server.");
	}
	if (res.ok) {
		const response = (await res.json()) as NetworkPacket;
		if (response.statusMessage === "success") {
			if (shouldblastSave && !response.dateCalculated) {
				cookieStore?.set("savedBlasts", savedBlasts + blastRequestString + ";", { maxAge: 8 * 60 * 60 });
			}

			return {
				BlastQueryResults: response.result as BlastQueryResult[],
				existingBlastDate: response.dateCalculated as BlastQuery["dateCalculated"]
			};
		} else if (response.statusMessage === "error") {
			throw new Error("Response from BLAST server: " + response.error);
		} else {
			throw new Error("Could not reach BLAST server.");
		}
	} else {
		throw new Error("Could not reach BLAST server.");
	}
}
