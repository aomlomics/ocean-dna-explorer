"use client";

import type { BlastQueryModel, BlastQueryResultModel } from "@/app/generated/prisma/models";
import { blastCookieHasBlast, parseBlastRequest } from "@/app/helpers/blast";
import { getClientSideCookie } from "@/app/helpers/utils";
import TableMetadata, { exploreUrl } from "@/types/tableMetadata";
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
	blastResult: BlastQueryResultModel[] | undefined;
	existingBlastDate: BlastQueryModel["dateCalculated"] | undefined;
	className?: string;
}) {
	const searchParams = useSearchParams();

	const [page, setPage] = useState(0);
	const loading = !!searchParams.get("blastQuery") && !blastResult;

	if (loading) {
		return (
			<div className="flex min-w-0 flex-col">
				<div className="text-warning">Loading BLAST results...</div>
				<div className="flex w-full grow items-center justify-center self-center p-12 md:p-24">
					<span className="loading loading-spinner loading-xl" />
				</div>
			</div>
		);
	}

	if (!blastResult) {
		return <></>;
	}

	const grouped = {} as Record<BlastQueryResultModel["sequence"], BlastQueryResultModel[]>;
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
			<div className="grid h-full w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center">
				<button
					className="btn btn-secondary rounded-full"
					aria-label="Previous sequence"
					onClick={() => setPage(page ? page - 1 : resultsBySequence.length - 1)}
					disabled={resultsBySequence.length < 2}
				>
					❮
				</button>

				<div className="relative flex h-full min-h-0 min-w-0 w-full flex-col p-2 md:p-5">
					<h1 className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 border-b border-primary pb-2">
						{resultsBySequence[page]![0]!.query ? (
							<>
								<div>Query:</div>
								<div>{resultsBySequence[page]![0]!.query}</div>
							</>
						) : (
							<></>
						)}
						<div>Sequence:</div>
						<div>{resultsBySequence[page]![0]!.sequence}</div>
					</h1>

					<div className="overflow-y-auto py-2 pr-1 md:pr-3">
						{resultsBySequence[page]!.map((r, i) => (
							<div key={i} className="flex flex-col">
								<h2 className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
									<div>Target featureid:</div>
									<Link
										className="link link-primary link-hover"
										href={exploreUrl({ table: "feature", featureid: r.featureid })}
									>
										{r.featureid}
									</Link>
								</h2>

								<div className="grid w-full grid-cols-[auto_auto_minmax(0,1fr)] gap-x-2 px-0 md:grid-cols-[auto_auto_1fr_auto_auto_auto] md:px-15">
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
					aria-label="Next sequence"
					onClick={() => setPage(page === resultsBySequence.length - 1 ? 0 : page + 1)}
					disabled={resultsBySequence.length < 2}
				>
					❯
				</button>
			</div>
		</div>
	);
}
