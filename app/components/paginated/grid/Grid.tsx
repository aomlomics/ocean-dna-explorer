"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { fetcher } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { useSearchParams } from "next/navigation";
import { FunctionComponent, useState } from "react";
import useSWR, { preload } from "swr";
import PaginationControls from "../PaginationControls";
import { buildWhereParams } from "@/app/helpers/queries";

export default function Grid({
	Child,
	table,
	where,
	orderBy,
	ignoreParams
}: {
	Child: FunctionComponent<{ item: any }>;
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, any>;
	orderBy?: { field: string; order: Prisma.SortOrder };
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
			buildWhereParams(searchParams, query, whereQuery, ignoreParams);
		}

		query.set("where", JSON.stringify(whereQuery));

		if (orderBy) {
			query.set("orderBy", `${orderBy.field},${orderBy.order}`);
		}

		return query;
	}

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/${table}/pagination?${getQuery().toString()}`,
		fetcher,
		{
			keepPreviousData: true
		}
	);
	if (isLoading || !data) return <>Loading...</>;
	if (error) return <div>failed to load: {error.toString()}</div>;
	if (data.statusMessage === "error" || !data.result || !Array.isArray(data.result) || !data.count) {
		return <div>failed to load: {data.error || "no result found"}</div>;
	}

	return (
		<div className="space-y-6 p-6">
			{/* Pagination Controls */}
			<PaginationControls
				page={page}
				take={25}
				count={data.count}
				setPage={setPage}
				handlePageHover={(dir = 1 as 1 | -1) =>
					preload(`/api/${table}/pagination?${getQuery(dir).toString()}`, fetcher)
				}
			/>

			<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
				{data.result.map((item: any, i: number) => (
					<Child key={i} item={item} />
				))}
			</div>
		</div>
	);
}
