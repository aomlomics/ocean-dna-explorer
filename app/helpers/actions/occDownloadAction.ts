"use server";

import { Occurrence, Prisma } from "@/app/generated/prisma/client";
import { prisma } from "../prisma";

export default async function occDownloadAction(where: Prisma.OccurrenceWhereInput) {
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

	return { message: "Success", file: new Blob([tsv], { type: "text/tsv;charset=utf-8;" }) };
}
