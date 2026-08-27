"use client";

import type { Prisma } from "@/app/generated/prisma/browser";
import { fetcher } from "@/app/helpers/utils";
import { useSearchParams } from "next/navigation";
import { type FunctionComponent, useRef, useState } from "react";
import useSWR, { preload } from "swr";
import PaginationControls from "../PaginationControls";
import LoadingPaginationControls from "../LoadingPaginationControls";
import { buildWhereParams } from "@/app/helpers/api";
import LoadingTaxaGrid from "./LoadingTaxaGrid";
import { RanksBySpecificity } from "@/types/objects";
import TableStatusState from "../table/TableStatusState";
import type { ModelName } from "@/types/tableMetadata";
import { useTrusted } from "@/app/hooks/TrustedProvider";

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
	table: Uncapitalize<ModelName>;
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
	const { trusted } = useTrusted();
	const [page, setPage] = useState(1);
	const topPaginationRef = useRef<HTMLDivElement>(null);

	function getQuery(dir?: 1 | -1) {
		const query = new URLSearchParams({
			take: take.toString(),
			page: (dir ? page + dir : page).toString()
		});

		if (trusted) {
			query.set("trusted", "true");
		}

		let whereQuery = {} as Record<string, any>;
		if (where) {
			whereQuery = { ...where };
		}

		if (searchParams && searchParams.size) {
			buildWhereParams(searchParams, query, whereQuery, ignoreParams);

			if (table === "taxonomy") {
				const assignmentLevel = searchParams.get("assignmentLevel");
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
		if (table === "taxonomy") {
			return <LoadingTaxaGrid cols={5} />;
		}

		return (
			<div className="flex flex-col gap-6 p-6">
				<LoadingPaginationControls />
				<div className={itemsGridClassName}>
					{Array.from({ length: 6 }, (_, i) => (
						<div key={i} className="overflow-hidden rounded-xl bg-base-200">
							<div className="aspect-16/10 bg-base-content/10" />
							<div className="space-y-2 p-3">
								<div className="h-4 w-1/2 rounded bg-base-content/10" />
								<div className="h-3 w-3/4 rounded bg-base-content/10" />
								<div className="h-3 w-1/3 rounded bg-base-content/10" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}
	if (data.statusMessage === "error" || !data.result || !Array.isArray(data.result)) {
		return (
			<TableStatusState kind="error" title="Could not load results" detail={String(data.error ?? "Unknown error")} />
		);
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
		preload(`/api/internal/${table}/pagination?${getQuery(dir)}`, fetcher);
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
