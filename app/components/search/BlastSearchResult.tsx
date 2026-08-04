"use client";

import { BlastQuery, BlastQueryResult } from "@/app/generated/prisma/client";
import { blastCookieHasBlast, parseBlastRequest } from "@/app/helpers/blast";
import { getClientSideCookie } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

const resultsFields = [] as string[];
const omit = ["id", "queryId", "query", "sequence", "featureid"];
TableMetadata.blastQueryResult.fieldOrder?.forEach((f) => !omit.includes(f) && resultsFields.push(f));
TableMetadata.blastQueryResult.enumSchema.options.forEach(
	(f) => !omit.includes(f) && !resultsFields.includes(f) && resultsFields.push(f)
);

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
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (searchParams.get("blastQuery")) {
			setLoading(true);
		}
	}, [searchParams]);

	useEffect(() => {
		if (blastResult) {
			setLoading(false);
		}
	}, [blastResult]);

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

	const resultsBySequence = Object.values(
		blastResult.reduce(
			(acc, r) => {
				if (acc[r.sequence]) {
					acc[r.sequence].push(r);
				} else {
					acc[r.sequence] = [r];
				}

				return acc;
			},
			{} as Record<BlastQueryResult["sequence"], BlastQueryResult[]>
		) || {}
	);

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
					{resultsBySequence[page][0].query ? (
						<h1>
							<span className="text-primary">query</span>: {resultsBySequence[page][0].query}
						</h1>
					) : (
						<></>
					)}
					<h1 className="pb-4">
						<span className="text-primary">sequence</span>: {resultsBySequence[page][0].sequence}
					</h1>

					<div className="overflow-y-scroll">
						{resultsBySequence[page].map((r, i) => (
							<div key={i} className="py-2 border-t border-primary flex flex-col items-center">
								<div className="flex flex-col text-xl items-center">
									<h1>featureid</h1>
									<Link className="link link-primary link-hover" href={`/explore/feature/${r.featureid}`}>
										{r.featureid}
									</Link>
								</div>
								<div className="w-full grid grid-cols-4 gap-x-2">
									{resultsFields.map((f) => {
										const val = r[f as keyof typeof r];
										return (
											<Fragment key={f + i}>
												<div className="justify-self-end">{f}:</div>
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
