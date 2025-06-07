import { Occurrence } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const analysis_run_name = searchParams.get("analysis_run_name");
	if (!analysis_run_name) {
		return NextResponse.json({ statusMessage: "error", error: "No analysis_run_name provided" });
	}

	try {
		const result = await prisma.occurrence.findMany({
			where: {
				analysis_run_name
			}
		});
		if (!result.length) {
			return NextResponse.json({ statusMessage: "error", error: "No results found" });
		}

		const occurrences = {} as Record<string, Record<string, number>>;
		const featAbundances = {} as Record<string, number>;
		const headers = new Set() as Set<string>;
		for (const occ of result as Occurrence[]) {
			if (occ.featureid in occurrences) {
				occurrences[occ.featureid][occ.samp_name] = occ.organismQuantity;
				featAbundances[occ.featureid] += occ.organismQuantity;
			} else {
				occurrences[occ.featureid] = { [occ.samp_name]: occ.organismQuantity };
				featAbundances[occ.featureid] = occ.organismQuantity;
			}
			headers.add(occ.samp_name);
		}
		const samp_names = Array.from(headers);
		samp_names.sort((a, b) => a.localeCompare(b));

		const sortedFeats = Object.entries(featAbundances).sort((a, b) => b[1] - a[1]);

		let tsv = "\t" + samp_names.join("\t") + "\n";
		for (const [featureid] of sortedFeats) {
			tsv +=
				featureid +
				"\t" +
				samp_names.map((samp) => (occurrences[featureid][samp] ? occurrences[featureid][samp] : 0)).join("\t") +
				"\n";
		}

		const response = new NextResponse(new Blob([tsv], { type: "text/tsv;charset=utf-8;" }));
		response.headers.set("content-type", "text/tab-separated-values");
		return response;
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
