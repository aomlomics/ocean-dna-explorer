"use server";

import { Occurrence, Prisma } from "@/app/generated/prisma/client";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../helpers/prisma";

export default async function occDownloadAction(where: Prisma.OccurrenceWhereInput): Promise<NetworkPacket> {
	console.log("occurrence download");

	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (typeof where !== "object") {
		return { statusMessage: "error", error: "Argument must be object" };
	}

	try {
		const result = await prisma.occurrence.findMany({ where });

		const occurrences = {} as Record<string, Record<string, number>>;
		const featAbundances = {} as Record<string, number>;
		// const sampAbundances = {} as Record<string, number>;
		const headers = new Set() as Set<string>;
		for (const occ of result as Occurrence[]) {
			if (occ.featureid in occurrences) {
				occurrences[occ.featureid][occ.samp_name] = occ.organismQuantity;
				featAbundances[occ.featureid] += occ.organismQuantity;
				// sampAbundances[occ.samp_name] += occ.organismQuantity;
			} else {
				occurrences[occ.featureid] = { [occ.samp_name]: occ.organismQuantity };
				featAbundances[occ.featureid] = occ.organismQuantity;
				// sampAbundances[occ.samp_name] = occ.organismQuantity;
			}
			headers.add(occ.samp_name);
		}
		const samp_names = Array.from(headers);
		samp_names.sort((a, b) => a.localeCompare(b));

		const sortedFeats = Object.entries(featAbundances).sort((a, b) => b[1] - a[1]);
		// const sortedSamps = Object.entries(sampAbundances).sort((a, b) => b[1] - a[1]);

		let tsv = "\t" + samp_names.join("\t") + "\n";
		for (const [featureid] of sortedFeats) {
			tsv +=
				featureid +
				"\t" +
				samp_names.map((samp) => (occurrences[featureid][samp] ? occurrences[featureid][samp] : 0)).join("\t") +
				"\n";
		}

		return { statusMessage: "success", result: new Blob([tsv], { type: "text/tsv;charset=utf-8;" }) };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
