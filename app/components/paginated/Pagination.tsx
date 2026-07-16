"use client";

import { Prisma } from "@/app/generated/prisma/client";
import useSWR, { preload } from "swr";
import Link from "next/link";
import { fetcher } from "@/app/helpers/utils";
import PaginationControls from "./PaginationControls";
import { useState } from "react";
import LoadingPagination from "./LoadingPagination";
import { useSearchParams } from "next/navigation";
import { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { buildWhereParams } from "@/app/helpers/queries";

export default function Pagination({
	table,
	where,
	relCounts,
	take = 10,
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
		let query = new URLSearchParams({
			take: (25).toString(),
			page: (dir ? page + dir : page).toString()
		});

		let whereQuery = {} as Record<string, string>;
		if (where) {
			whereQuery = { ...where };
		}

		if (searchParams && searchParams.size) {
			buildWhereParams(searchParams, query, whereQuery);
		}

		query.set("where", JSON.stringify(whereQuery));

		return query;
	}

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/${table}/pagination?${getQuery().toString()}`,
		fetcher,
		{
			keepPreviousData: true
		}
	);
	if (isLoading) return <LoadingPagination />;
	if (error) return <div>failed to load: {error.toString()}</div>;
	if (data.statusMessage === "error") return <div>failed to load: {data.error}</div>;

	return (
		<div className="space-y-6 p-6">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={take}
				count={data.count}
				setPage={setPage}
				handlePageHover={(dir = 1 as 1 | -1) =>
					preload(`/api/${table}/pagination?${getQuery(dir).toString()}`, fetcher)
				}
			/>

			{/* Project Cards */}
			<div className={`flex flex-col gap-4 ${table === "sample" ? "items-start" : "items-center"}`}>
				{data.result.map((d: any, i: number) => (
					<Link
						href={`/explore/${table}/${
							typeof TableMetadata[table].titleField === "string"
								? encodeURIComponent(d[TableMetadata[table].titleField])
								: TableMetadata[table].titleField.map((field) => encodeURIComponent(d[field])).join("/")
						}`}
						key={i}
						className="card bg-base-200 hover:bg-base-300 transition-all duration-200 w-full max-w-lg"
					>
						<div className="card-body p-5">
							<div className="flex flex-col gap-2">
								{/* Title with hover animation */}
								{typeof TableMetadata[table].titleField === "string" ? (
									<h3 className="text-lg text-primary break-all">{d[TableMetadata[table].titleField]}</h3>
								) : (
									<div
										className="grid gap-x-4"
										style={{
											gridTemplateColumns: `repeat(${TableMetadata[table].titleField.length}, minmax(0, 1fr))`
										}}
									>
										{TableMetadata[table].titleField.map((t) => (
											<h3 key={`${t}1`} className="text-lg font-medium text-primary">
												{t}:
											</h3>
										))}
										{TableMetadata[table].titleField.map((t) => (
											<h3 key={`${t}2`} className="font-medium text-primary wrap-break-word">
												{d[t]}
											</h3>
										))}
									</div>
								)}

								{/* Info section with clean layout */}
								{TableMetadata[table].subFields && (
									<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-base-content/70">
										{TableMetadata[table].subFields.map((field) => (
											<div key={field} className="flex items-center gap-2">
												<span className="font-medium">{field}:</span>
												<span className="break-all text-base-content">{d[field]}</span>
											</div>
										))}
									</div>
								)}

								{/* Stats with subtle separator */}
								{relCounts && (
									<div className="flex flex-wrap gap-6 pt-1">
										{relCounts.map((rel) => (
											<div key={rel} className="flex items-center gap-2">
												<span className="text-lg font-medium">{d._count[rel]}</span>
												<span className="text-sm text-base-content/70">{rel}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</Link>
				))}
			</div>

			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={take}
				count={data.count}
				setPage={setPage}
				handlePageHover={(dir = 1 as 1 | -1) =>
					preload(`/api/${table}/pagination?${getQuery(dir).toString()}`, fetcher)
				}
			/>
		</div>
	);
}
