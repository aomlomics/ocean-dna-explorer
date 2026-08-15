"use client";

import { BlastQuery, BlastQueryResult } from "@/app/generated/prisma/client";
import { blastCookieHasBlast, parseBlastRequest } from "@/app/helpers/blast";
import { exploreFeatureUrl, getClientSideCookie } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";

const resultsFields = [] as string[];
const omit = ["id", "queryId", "query", "sequence", "featureid", "queryEnd", "subjectEnd"];
TableMetadata.blastQueryResult.fieldOrder?.forEach((f) => !omit.includes(f) && resultsFields.push(f));
TableMetadata.blastQueryResult.enumSchema.options.forEach(
	(f) => !omit.includes(f) && !resultsFields.includes(f) && resultsFields.push(f)
);

const fieldLabels = {
	percentIdentity: "Percent Identity",
	alignmentLength: "Alignment Length",
	bitScore: "Bit Score",
	mismatches: "Mismatches",
	queryStart: "Query Range",
	gapOpens: "Gap Opens",
	subjectStart: "Subject Range"
} as Record<string, string>;

export default function BlastSearchResult({
	blastResult,
	existingBlastDate,
	className
}: {
	blastResult: BlastQueryResult[] | undefined;
	existingBlastDate: BlastQuery["dateCalculated"] | undefined;
	className?: string;
}) {
	const searchParams = useSearchParams();

	const [page, setPage] = useState(0);
	const loading = !!searchParams.get("blastQuery") && !blastResult;

	if (loading) {
		return (
			<div className="flex flex-col">
				<div className="text-warning">Loading BLAST results...</div>
				<div className="w-full p-75 grow self-center">
					<span className="loading loading-spinner loading-xl w-full" />
				</div>
			</div>
		);
	}

	if (!blastResult) {
		return <></>;
	}

	const grouped = {} as Record<BlastQueryResult["sequence"], BlastQueryResult[]>;
	for (const r of blastResult) {
		(grouped[r.sequence] ??= []).push(r);
	}
	const resultsBySequence = Object.values(grouped);

	if (!resultsBySequence.length) {
		return (
			<div className="text-warning">
				No BLAST results found. If you were expecting results, try broadening your search parameters.
			</div>
		);
	}

	return (
		<div className={`break-all flex flex-col items-center ${className}`}>
			{existingBlastDate &&
			!blastCookieHasBlast(
				parseBlastRequest(new URLSearchParams(searchParams), { safe: true }),
				getClientSideCookie("savedBlasts")
			) ? (
				<>
					<div className="text-warning">Using existing blast query ran on {existingBlastDate.toString()}</div>
					{searchParams.get("blastSave") === "true" ? (
						<div className="text-warning">Blast query was not saved</div>
					) : (
						<></>
					)}
				</>
			) : (
				<></>
			)}
			<div className="w-full h-full grid grid-cols-[auto_1fr_auto] justify-items-center items-center">
				<button
					className="btn btn-secondary rounded-full"
					onClick={() => setPage(page ? page - 1 : resultsBySequence.length - 1)}
					disabled={resultsBySequence.length < 2}
				>
					❮
				</button>

				<div className="relative w-full h-full p-5 flex flex-col min-h-0">
					<div className="grid grid-cols-[auto_1fr] gap-x-2 border-b border-primary pb-2">
						{resultsBySequence[page]![0]!.query ? (
							<>
								<h1>Query:</h1>
								<h1>{resultsBySequence[page]![0]!.query}</h1>
							</>
						) : (
							<></>
						)}
						<h1>Sequence:</h1>
						<h1>{resultsBySequence[page]![0]!.sequence}</h1>
					</div>

					<div className="overflow-y-auto pr-3 py-2">
						{resultsBySequence[page]!.map((r, i) => (
							<div key={i} className="flex flex-col">
								<div className="grid grid-cols-[auto_1fr] gap-x-2">
									<h1>Target featureid:</h1>
									<Link className="link link-primary link-hover" href={exploreFeatureUrl(r.featureid)}>
										{r.featureid}
									</Link>
								</div>

								<div className="w-full grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-x-2 px-15">
									{resultsFields.map((f) => {
										const key = fieldLabels[f] || f;

										let val;
										if (f === "queryStart") {
											val = `${r.queryStart} - ${r.queryEnd}`;
										} else if (f === "subjectStart") {
											val = `${r.subjectStart} - ${r.subjectEnd}`;
										} else {
											val = r[f as keyof typeof r] + (f.toLowerCase().includes("percent") ? "%" : "");
										}

										return (
											<Fragment key={f + i}>
												<div className="text-primary-content/60">{key}</div>
												<div>:</div>
												<div>{val}</div>
											</Fragment>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>

				<button
					className="btn btn-secondary rounded-full"
					onClick={() => setPage(page === resultsBySequence.length - 1 ? 0 : page + 1)}
					disabled={resultsBySequence.length < 2}
				>
					❯
				</button>
			</div>
		</div>
	);
}
