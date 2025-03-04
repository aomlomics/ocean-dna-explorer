"use client";

import { Prisma } from "@prisma/client";
import useSWR, { preload } from "swr";
import Link from "next/link";
import { fetcher } from "@/app/helpers/utils";
import PaginationControls from "./PaginationControls";
import { useState } from "react";
import LoadingPagination from "./LoadingPagination";
import { useSearchParams } from "next/navigation";

export default function Pagination({
	table,
	id = "id",
	where,
	title,
	fields,
	relCounts,
	take = 10
}: {
	table: Uncapitalize<Prisma.ModelName>;
	id?: string;
	where?: Record<string, string>;
	title: string | string[];
	fields?: string[];
	relCounts?: string[];
	take?: number;
}) {
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);

	let query = new URLSearchParams({
		take: take.toString(),
		page: page.toString()
	});
	let whereQuery = {} as Record<string, string>;
	if (where) {
		whereQuery = { ...where };
	}
	if (searchParams.size) {
		whereQuery = { ...whereQuery, ...Object.fromEntries(searchParams) };
	}
	query.set("where", JSON.stringify(whereQuery));
	if (relCounts) {
		query.set("relCounts", relCounts.toString());
	}
	const { data, error, isLoading } = useSWR(`/api/pagination/${table}?${query.toString()}`, fetcher, {
		keepPreviousData: true
	});
	if (isLoading) return <LoadingPagination />;
	if (error || data.error) return <div>failed to load: {error || data.error}</div>;

	function handlePageHover(dir = 1) {
		let query = new URLSearchParams({
			take: take.toString(),
			page: page.toString()
		});
		if (where) {
			query.set("where", JSON.stringify(where));
		}
		if (relCounts) {
			query.set("relCounts", relCounts.toString());
		}

		preload(`/api/pagination/${table}?${query.toString()}`, fetcher);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={take}
				count={data.count}
				handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
				handlePageHover={handlePageHover}
			/>

			{/* Project Cards */}
			<div className="grid gap-4">
				{data.result.map((d: any, i: number) => (
					<Link
						href={`/explore/${table}/${encodeURIComponent(d[id])}`}
						key={i}
						className="card bg-base-200 hover:bg-base-300 transition-all duration-200"
					>
						<div className="card-body p-5">
							<div className="flex flex-col gap-2">
								{/* Title with hover animation */}
								{typeof title === "string" ? (
									<h3 className="text-lg text-primary">{d[title]}</h3>
								) : (
									<div
										className="grid gap-x-4"
										style={{ gridTemplateColumns: `repeat(${title.length}, minmax(0, 1fr))` }}
									>
										{title.map((t) => (
											<h3 key={`${t}1`} className="text-lg font-medium text-primary">
												{t}:
											</h3>
										))}
										{title.map((t) => (
											<h3 key={`${t}2`} className="font-medium text-primary break-words">
												{d[t]}
											</h3>
										))}
									</div>
								)}

								{/* Info section with clean layout */}
								{fields && (
									<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-base-content/70">
										{fields.map((field) => (
											<div key={field} className="flex items-center gap-2">
												<span className="font-medium">{field}:</span>
												<span className="break-all">{d[field]}</span>
											</div>
										))}
									</div>
								)}

								{/* Stats with subtle separator */}
								{relCounts && (
									<div className="flex gap-6 pt-1">
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
				handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
				handlePageHover={handlePageHover}
			/>
		</div>
	);
}
