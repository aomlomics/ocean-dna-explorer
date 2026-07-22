"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { fetcher } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { useSearchParams } from "next/navigation";
import { FunctionComponent, useRef, useState } from "react";
import useSWR, { preload } from "swr";
import PaginationControls from "../PaginationControls";
import LoadingTaxaGrid from "../LoadingTaxaGrid";
import { RanksBySpecificity } from "@/types/objects";
import TableStatusState from "../TableStatusState";

const defaultItemsGridClass = "grid grid-cols-2 lg:grid-cols-5 gap-4";

export default function Grid({
	Child,
	table,
	where,
	orderBy,
	ignoreParams,
	extraQueryParams,
	childProps,
	itemsGridClassName = defaultItemsGridClass,
	fillViewport = true,
	take = 25
}: {
	Child: FunctionComponent<{ item: any; [key: string]: any }>;
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, any>;
	orderBy?: { field: string; order: Prisma.SortOrder };
	ignoreParams?: string[];
	extraQueryParams?: Record<string, string>;
	childProps?: Record<string, any>;
	itemsGridClassName?: string;
	/** When false, grid grows with the page (document scroll) instead of a fixed viewport + inner scroll. */
	fillViewport?: boolean;
	take?: number;
}) {
	const searchParams = useSearchParams();
	const [page, setPage] = useState(1);
	const topPaginationRef = useRef<HTMLDivElement>(null);

	function getQuery(dir?: 1 | -1) {
		let query = new URLSearchParams({
			take: take.toString(),
			page: (dir ? page + dir : page).toString()
		});

		let whereQuery = {} as Record<string, any>;
		if (where) {
			whereQuery = { ...where };
		}

		if (searchParams && searchParams.size) {
			const tempParms = new URLSearchParams(searchParams);
			//specifically pull out shapes from searchParams

			const polygons = tempParms.getAll("polygon");
			if (polygons.length) {
				tempParms.delete("polygon");
				for (const p of polygons) {
					query.set("polygon", p);
				}
			}
			const circles = tempParms.getAll("circle");
			if (circles.length) {
				tempParms.delete("circle");
				for (const c of circles) {
					query.set("circle", c);
				}
			}

			whereQuery = { ...whereQuery, ...Object.fromEntries(tempParms) };
			if (table === "taxonomy") {
				const assignmentLevel = tempParms.get("assignmentLevel");
				if (assignmentLevel && RanksBySpecificity.includes(assignmentLevel as (typeof RanksBySpecificity)[number])) {
					const advanced: any[] = [[assignmentLevel, "notNull"]];
					for (const finerRank of RanksBySpecificity) {
						if (finerRank === assignmentLevel) break;
						advanced.push([finerRank, "null"]);
					}
					whereQuery.advanced = advanced;
				}
			}
			if (ignoreParams) {
				for (const param of ignoreParams) {
					delete whereQuery[param];
				}
			}
			delete whereQuery.assignmentLevel;
		}

		query.set("where", JSON.stringify(whereQuery));

		if (orderBy) {
			query.set("orderBy", `${orderBy.field},${orderBy.order}`);
		}
		if (extraQueryParams) {
			for (const [key, value] of Object.entries(extraQueryParams)) {
				query.set(key, value);
			}
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
	if (isLoading || !data) {
		return table === "taxonomy" ? (
			<div className="space-y-4">
				<TableStatusState kind="loading" title="Loading results..." detail="Applying filters and fetching taxonomy rows." />
				<LoadingTaxaGrid cols={5} />
			</div>
		) : (
			<TableStatusState kind="loading" title="Loading results..." detail="Applying filters and fetching table rows." />
		);
	}
	if (error) {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={error.toString() instanceof Error ? error.message : String(error)}
			/>
		);
	}
	if (data.statusMessage === "error" || !data.result || !Array.isArray(data.result)) {
		return <TableStatusState kind="error" title="Could not load results" detail={String(data.error ?? "Unknown error")} />;
	}
	if (!data.result.length || data.count === 0) {
		return (
			<TableStatusState
				kind="empty"
				title="No results found"
				detail="Try broadening your search or removing one or more filters."
			/>
		);
	}

	function handlePageHover(dir = 1 as 1 | -1) {
		preload(`/api/${table}/pagination?${getQuery(dir).toString()}`, fetcher);
	}

	function scrollTopPaginationIntoView() {
		topPaginationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	const paginationControlsTop = (
		<PaginationControls
			page={page}
			take={take}
			count={data.count}
			setPage={setPage}
			handlePageHover={handlePageHover}
		/>
	);

	const paginationControlsBottom = (
		<PaginationControls
			page={page}
			take={take}
			count={data.count}
			setPage={setPage}
			handlePageHover={handlePageHover}
			sideEffect={scrollTopPaginationIntoView}
		/>
	);

	if (!fillViewport) {
		return (
			<div className="flex flex-col gap-6 p-6">
				<div className="shrink-0" ref={topPaginationRef}>
					{paginationControlsTop}
				</div>

				<div className={itemsGridClassName}>
					{data.result.map((item: any, i: number) => (
						<Child key={i} item={item} {...childProps} />
					))}
				</div>

				<div className="flex shrink-0 justify-center">{paginationControlsBottom}</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
			<div className="shrink-0" ref={topPaginationRef}>
				{paginationControlsTop}
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className={itemsGridClassName}>
					{data.result.map((item: any, i: number) => (
						<Child key={i} item={item} {...childProps} />
					))}
				</div>
			</div>

			<div className="flex shrink-0 justify-center">{paginationControlsBottom}</div>
		</div>
	);
}
