"use client";

import { Prisma } from "@/app/generated/prisma/client";
import useSWR, { preload } from "swr";
import Link from "next/link";
import { fetcher } from "@/app/helpers/utils";
import PaginationControls from "../PaginationControls";
import { useState } from "react";
import LoadingPagination from "./LoadingPagination";
import { useSearchParams } from "next/navigation";
import TableMetadata from "@/types/tableMetadata";
import { buildWhereParams } from "@/app/helpers/api";
import TableStatusState from "../table/TableStatusState";
import { useTrusted } from "@/app/hooks/TrustedProvider";

export default function Pagination({
	table,
	where,
	relCounts,
	take = 25,
	ignoreParams
}: {
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, string>;
	relCounts?: string[];
	take?: number;
	ignoreParams?: string[];
}) {
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);

	function getQuery(dir?: 1 | -1) {
		const query = new URLSearchParams({
			take: take.toString(),
			page: (dir ? page + dir : page).toString()
		});

		let whereQuery = {} as Record<string, string>;
		if (where) {
			whereQuery = { ...where };
		}

		if (searchParams && searchParams.size) {
			buildWhereParams(searchParams, query, whereQuery, ignoreParams);
		}

		query.set("where", JSON.stringify(whereQuery));

		return query;
	}

	const { data, error, isLoading } = useSWR(`/api/internal/${table}/pagination?${getQuery().toString()}`, fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: false
	});
	if (error) {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={error.toString() instanceof Error ? error.message : String(error)}
			/>
		);
	}
	if (isLoading || !data) {
		return <LoadingPagination />;
	}
	if (data.statusMessage === "error") {
		return (
			<TableStatusState kind="error" title="Could not load results" detail={String(data.error ?? "Unknown error")} />
		);
	}
	if (!Array.isArray(data.result) || data.result.length === 0 || data.count === 0) {
		return (
			<TableStatusState
				kind="empty"
				title="No results found"
				detail="Try broadening your search or removing one or more filters."
			/>
		);
	}

	function handlePageHover(dir = 1 as 1 | -1) {
		preload(`/api/internal/${table}/pagination?${getQuery(dir)}`, fetcher);
	}

	return (
		<div className="space-y-4">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={take}
				count={data.count}
				setPage={setPage}
				handlePageHover={handlePageHover}
			/>

			<div className="flex flex-col gap-2">
				{data.result.map((d: any, i: number) => {
					const titleField = TableMetadata[table].titleField;
					const titleKeys = typeof titleField === "string" ? [titleField] : [...titleField];
					const title = d[titleKeys.at(-1)!];
					const subtitle = titleKeys
						.slice(0, -1)
						.map((key) => d[key])
						.filter(Boolean)
						.join(" · ");
					const details = (TableMetadata[table].subFields ?? []).filter(
						(field) => !titleKeys.includes(field) && d[field] != null && d[field] !== ""
					);

					return (
						<Link
							key={i}
							href={`/explore/${table}/${titleKeys.map((key) => encodeURIComponent(d[key])).join("/")}`}
							className="block w-full rounded-xl bg-base-200 px-4 py-3 transition-colors duration-200 hover:bg-base-300"
						>
							<h3 className="text-base font-medium text-primary wrap-break-word">{title}</h3>
							{subtitle ? <p className="mt-0.5 text-sm text-base-content/55 wrap-break-word">{subtitle}</p> : null}

							{details.length > 0 ? (
								<div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
									{details.map((field) => (
										<div key={field} className="contents">
											<span className="text-base-content/50">{field.replaceAll("_", " ")}</span>
											<span className="wrap-break-word">{String(d[field])}</span>
										</div>
									))}
								</div>
							) : null}

							{relCounts ? (
								<div className="mt-2 flex flex-wrap gap-x-4 text-sm">
									{relCounts.map((rel) => (
										<p key={rel}>
											<span className="font-medium">{d._count[rel]}</span>{" "}
											<span className="text-base-content/50">{rel}</span>
										</p>
									))}
								</div>
							) : null}
						</Link>
					);
				})}
			</div>

			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={take}
				count={data.count}
				setPage={setPage}
				handlePageHover={handlePageHover}
			/>
		</div>
	);
}
