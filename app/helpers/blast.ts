import type { BlastRequest, NetworkPacket, Role } from "@/types/globals";
import { AppError, RolePermissions } from "@/types/objects";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { BlastQueryModel, BlastQueryResultModel } from "@/app/generated/prisma/models";
import { COMPRESSION_FORMAT, decompressURIComponent } from "./utils";

export function parseBlastRequest(
	searchParams: URLSearchParams,
	options?: { safe?: true; noPrefix?: true; noDelete?: true }
) {
	const tempQueries = searchParams.getAll(options?.noPrefix ? "query" : "blastQuery");
	let queries = tempQueries.reduce(
		(acc, q) => {
			const split = q.split(",");
			//ignore queries with too many args
			if (split.length > 2) {
				if (!options?.safe)
					throw new AppError("Format is either <sequence> or <query>,<sequence>. More than 2 values were provided.");
			} else {
				//ignore queries with too few args when more than one query is provided
				if (tempQueries.length > 1 && split.length === 1) {
					if (!options?.safe)
						throw new AppError("If more than one sequence is provided, all sequences must have query names.");
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
			throw new AppError(
				`Compressed queries must be an array of strings or string arrays in ${COMPRESSION_FORMAT} format.`
			);
		}
	}

	const database = searchParams.get(options?.noPrefix ? "database" : "blastDatabase");
	const save = searchParams.get(options?.noPrefix ? "save" : "blastSave");

	//options
	const task = searchParams.get("task");
	const max_target_seqs = searchParams.get("max_target_seqs");
	const evalue = searchParams.get("evalue");
	const perc_identity = searchParams.get("perc_identity");
	const qcov_hsp_perc = searchParams.get("qcov_hsp_perc");

	if (!options?.noDelete) {
		searchParams.delete(options?.noPrefix ? "query" : "blastQuery");
		searchParams.delete(options?.noPrefix ? "database" : "blastDatabase");
		searchParams.delete(options?.noPrefix ? "save" : "blastSave");

		searchParams.delete("task");
		searchParams.delete("max_target_seqs");
		searchParams.delete("evalue");
		searchParams.delete("perc_identity");
		searchParams.delete("qcov_hsp_perc");
	}

	try {
		if (!queries.length) {
			if (database != null) {
				throw new AppError("Must provide a blast query with blastDatabase option.");
			}
			if (task != null) {
				throw new AppError("Must provide a blast query with task option.");
			}
			if (max_target_seqs != null) {
				throw new AppError("Must provide a blast query with max_target_seqs option.");
			}
			if (evalue != null) {
				throw new AppError("Must provide a blast query with evalue option.");
			}
			if (perc_identity != null) {
				throw new AppError("Must provide a blast query with perc_identity option.");
			}
			if (qcov_hsp_perc != null) {
				throw new AppError("Must provide a blast query with qcov_hsp_perc option.");
			}
			if (save != null) {
				throw new AppError("Must provide a blast query with blastSave option.");
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
					throw new AppError('The blastSave option must be "true" or "false"');
				}
			}

			const blastOptions = {} as NonNullable<BlastRequest["options"]>;

			if (task && task !== "blastn") {
				blastOptions.task = task;
			}
			if (max_target_seqs) {
				const parsed = Number(max_target_seqs);
				if (!Number.isInteger(parsed)) {
					throw new AppError("The max_target_seqs must be an integer.");
				}
				blastOptions.max_target_seqs = parsed;
			}
			if (evalue) {
				const parsed = Number(evalue);
				if (!Number.isFinite(parsed)) {
					throw new AppError("The evalue must be a float.");
				}
				blastOptions.evalue = parsed;
			}
			if (perc_identity) {
				const parsed = Number(perc_identity);
				if (!Number.isFinite(parsed)) {
					throw new AppError("The perc_identity must be a float.");
				}
				blastOptions.perc_identity = parsed;
			}
			if (qcov_hsp_perc) {
				const parsed = Number(qcov_hsp_perc);
				if (!Number.isFinite(parsed)) {
					throw new AppError("The qcov_hsp_perc must be a float.");
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

export async function fetchBlast(blast: BlastRequest, auth?: { role: Role | undefined; token: string | null }) {
	if (blast.save && (!auth?.role || !RolePermissions[auth.role].includes("contribute"))) {
		if (!auth) {
			throw new AppError("You must be signed in to save BLAST queries.", 401);
		}

		if (!auth.role || !RolePermissions[auth.role].includes("contribute")) {
			throw new AppError("You must be signed in with the contribute permission to save BLAST queries.", 403);
		}
	}

	let res;
	const blastRequestString = blastRequestToString(blast);

	try {
		res = await fetch(
			`${process.env.NEXT_PUBLIC_SERVER_URL}/blast?${blastRequestString}`,
			blast.save
				? {
						method: "POST",
						headers: {
							Authorization: "Bearer " + auth!.token
						}
					}
				: undefined
		);
	} catch {
		throw new AppError("Could not reach BLAST server.", 503);
	}

	if (res.ok) {
		const response = (await res.json()) as NetworkPacket;

		if (response.statusMessage === "error") {
			throw new AppError("Response from BLAST server: " + response.error, 500);
		}

		return {
			BlastQueryResults: response.result as BlastQueryResultModel[],
			existingBlastDate: response.dateCalculated as BlastQueryModel["dateCalculated"]
		};
	} else {
		throw new AppError(`BLAST server returned HTTP ${res.status}.`, res.status);
	}
}
