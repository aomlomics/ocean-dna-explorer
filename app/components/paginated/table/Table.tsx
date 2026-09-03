"use client";

import { GlobalOmit } from "@/types/objects";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import type { BlastQueryModel, BlastQueryResultModel, SampleModel } from "@/app/generated/prisma/models";
import type { Prisma } from "@/app/generated/prisma/browser";
import { useEffect, useRef, useState, useMemo } from "react";
import { preload } from "swr";
import LoadingTable from "./LoadingTable";
import PaginationControls from "../PaginationControls";
import { fetcher } from "@/app/helpers/utils";
import TableStatusState from "./TableStatusState";
import useTableColumns from "./hooks/useTableColumns";
import useTableQuery from "./hooks/useTableQuery";
import TableHeaderRow from "./parts/TableHeaderRow";
import TableRow from "./parts/TableRow";
import Checklist from "../../Checklist";
import { useSearchParams } from "next/navigation";
import { useTrusted } from "@/app/hooks/TrustedProvider";

export type ExtraResults = {
	blastResult: BlastQueryResultModel[] | undefined;
	existingBlastDate: BlastQueryModel["dateCalculated"] | undefined;
	samples: SampleModel[] | undefined;
};

type Props = {
	table: Uncapitalize<ModelName>;
	where?: Record<string, any>;
	omit?: string[];
	hideFilters?: boolean;
	hideEmptyAtStart?: boolean;
	filterHeadersAtStart?: boolean;
	defaultTake?: number;
	ignoreParams?: string[];
	extraParams?: Record<string, string>;
	setExtraResults?: (args: ExtraResults) => void;
	className?: string;
};

export const DEFAULT_ORDER_BY = { field: "id", order: "desc" } as { field: string; order: Prisma.SortOrder };

//TODO: make where arg support relational queries
//TODO: clamp table column width, add hover info to clamped columns
function ActualTable({
	table,
	where,
	omit = [],
	hideFilters,
	hideEmptyAtStart,
	filterHeadersAtStart,
	defaultTake = 50,
	ignoreParams,
	extraParams,
	setExtraResults,
	className
}: Props) {
	const combinedOmit = [...omit, ...GlobalOmit, "id"];
	const {
		title,
		defaultHeaders,
		relationsFields,
		manyRelations,
		oneRelations,
		oneRelationsWithArrayTitle,
		deepRelations,
		defaultHeadersFilter
	} = useTableColumns({
		table,
		where,
		combinedOmit,
		filterHeadersAtStart
	});

	const takeRef = useRef<HTMLInputElement>(null);
	const {
		data,
		error,
		isLoading,
		countData,
		countError,
		countIsLoading,
		page,
		setPage,
		take,
		orderBy,
		setOrderBy,
		whereFilter,
		deepRelationsFilter,
		setDeepRelationsFilter,
		pendingFilters,
		resetForm,
		handleFormChange,
		applyFilters,
		getQuery
	} = useTableQuery({
		table,
		where,
		hideFilters,
		defaultTake,
		ignoreParams,
		extraParams,
		setExtraResults,
		takeRef,
		manyRelations,
		deepRelations
	});

	const [hideEmpty, setHideEmpty] = useState(hideEmptyAtStart || false);
	//TODO: include user defined fields in empty filter
	const emptyFilter = useMemo(() => {
		if (data && data.statusMessage === "success" && hideEmpty) {
			const emptyFields: Record<string, true> = {};
			const exemptFields: Record<string, true> = {};

			for (const row of data.result) {
				for (const [field, value] of Object.entries(row)) {
					if (!combinedOmit.includes(field)) {
						if (value === null && !exemptFields[field]) {
							emptyFields[field] = true;
						} else {
							delete emptyFields[field];
							exemptFields[field] = true;
						}
					}
				}
			}

			return emptyFields;
		} else {
			return {};
		}
	}, [data, hideEmpty]);

	const userDefinedHeaders = useMemo(() => {
		if (data && data.statusMessage === "success") {
			const userDefinedHeadersSet = new Set() as Set<string>;

			for (const row of data.result) {
				if (row.userDefined) {
					for (const head in row.userDefined) {
						userDefinedHeadersSet.add(head);
					}
				}
			}

			return Array.from(userDefinedHeadersSet);
		} else {
			return [];
		}
	}, [data]);

	const headers = useMemo(() => {
		const baseHeaders = defaultHeaders.filter((head) => !userDefinedHeaders.includes(head));

		return [...baseHeaders, ...userDefinedHeaders];
	}, [defaultHeaders, userDefinedHeaders]);

	const [headersFilter, setHeadersFilter] = useState(defaultHeadersFilter);
	useEffect(() => {
		if (filterHeadersAtStart && userDefinedHeaders.length) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setHeadersFilter((current) => {
				if (userDefinedHeaders.every((head) => head in current)) {
					return current;
				} else {
					return {
						...current,
						...userDefinedHeaders.reduce(
							(acc, head) => {
								acc[head] = true;
								return acc;
							},
							{} as Record<string, boolean>
						)
					};
				}
			});
		} else {
			return;
		}
	}, [filterHeadersAtStart, userDefinedHeaders]);

	function handlePageHover(dir = 1 as 1 | -1) {
		preload(`/api/internal/${table}/pagination?${getQuery(dir).toString()}`, fetcher);
	}

	if (error) {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={error instanceof Error ? error.message : String(error)}
			/>
		);
	}
	if (countError) {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={countError instanceof Error ? countError.message : String(countError)}
			/>
		);
	}

	if (isLoading || !data || countIsLoading || !countData)
		return <LoadingTable take={take} page={page} hideFilters={hideFilters} />;
	if (data.statusMessage === "error") {
		return (
			<TableStatusState kind="error" title="Could not load results" detail={String(data.error ?? "Unknown error")} />
		);
	}
	if (countData.statusMessage === "error") {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={String(countData.error ?? "Unknown error")}
			/>
		);
	}

	const relsSet = new Set([...relationsFields, ...deepRelations.map((rel) => rel.label)]);

	return (
		<div className={`bg-base-100 border-base-300 rounded-box h-full w-full p-6 ${className ?? ""}`}>
			<form
				id={`${table}TableForm`}
				onSubmit={applyFilters}
				onChange={(e) => handleFormChange(e.currentTarget)}
				className="w-full h-full flex flex-col"
			>
				<div className="flex justify-between items-center mb-4">
					<div className="flex-1 flex">
						<div className="flex items-center gap-2">
							{!hideFilters && (
								<>
									<button
										onClick={resetForm}
										className="btn btn-sm bg-base-200 text-base-content border-base-300 hover:bg-base-300/80"
										type="button"
									>
										Clear Filters
									</button>
									<button type="submit" className="btn btn-sm btn-primary">
										Apply Filters {pendingFilters > 0 && `(${pendingFilters})`}
									</button>
								</>
							)}
							<label className="input input-sm input-bordered">
								Per Page:
								<input ref={takeRef} name="take" defaultValue={take} type="number" />
							</label>
						</div>
					</div>

					<PaginationControls
						page={page}
						take={take}
						count={countData.result}
						setPage={setPage}
						handlePageHover={handlePageHover}
					/>

					<div className="grid grid-cols-4 w-full gap-2 flex-1">
						<Checklist
							label="Relations"
							list={relationsFields}
							listFilter={headersFilter}
							setListFilter={setHeadersFilter}
							className="justify-self-end"
							buttonClassName="btn-sm"
						/>

						<Checklist
							label="Deep Relations"
							list={deepRelations.map((rel) => rel.label)}
							listFilter={deepRelationsFilter}
							setListFilter={setDeepRelationsFilter}
							className="justify-self-start"
							buttonClassName="btn-sm"
						/>

						<Checklist
							label="Columns"
							list={headers.filter((head) => !relsSet.has(head) || TableMetadata[table].titleField.includes(head))}
							listFilter={headersFilter}
							setListFilter={setHeadersFilter}
							extraLists={[{ list: userDefinedHeaders, label: "UD" }]}
							className="justify-self-end"
							buttonClassName="btn-sm"
						/>

						<fieldset className="fieldset bg-base-100 border-base-300 justify-self-start">
							<label className="label select-none">
								<input
									type="checkbox"
									className="checkbox"
									checked={hideEmpty}
									onChange={(e) => setHideEmpty(e.currentTarget.checked)}
								/>
								Hide empty columns
								{Object.keys(emptyFilter).length ? ` (${Object.keys(emptyFilter).length})` : ""}
							</label>
						</fieldset>
					</div>
				</div>

				<div tabIndex={0} className="overflow-x-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100 h-full">
					<table className="table table-sm table-pin-rows table-pin-cols w-max min-w-full">
						<caption className="sr-only">{TableMetadata[table].plural} table</caption>

						<thead>
							<TableHeaderRow
								title={title}
								table={table}
								headers={headers}
								headersFilter={headersFilter}
								emptyFilter={emptyFilter}
								hideFilters={hideFilters}
								userDefinedHeaders={userDefinedHeaders}
								manyRelations={manyRelations}
								oneRelationsWithArrayTitle={oneRelationsWithArrayTitle}
								deepRelations={deepRelations}
								deepRelationsFilter={deepRelationsFilter}
								orderBy={orderBy}
								setOrderBy={setOrderBy}
								whereFilter={whereFilter}
							/>
						</thead>

						<tbody>
							{data.result &&
								data.result.map((row: Record<string, any>, i: number) => (
									<TableRow
										key={i}
										row={row}
										i={i}
										table={table}
										title={title}
										headers={headers}
										headersFilter={headersFilter}
										emptyFilter={emptyFilter}
										manyRelations={manyRelations}
										userDefinedHeaders={userDefinedHeaders}
										oneRelations={oneRelations}
										oneRelationsWithArrayTitle={oneRelationsWithArrayTitle}
										deepRelations={deepRelations}
										deepRelationsFilter={deepRelationsFilter}
										page={page}
										take={take}
									/>
								))}
						</tbody>
					</table>
				</div>

				<div className="flex justify-center mt-4">
					<PaginationControls
						page={page}
						take={take}
						count={countData.result}
						setPage={setPage}
						handlePageHover={handlePageHover}
					/>
				</div>
			</form>
		</div>
	);
}

export default function Table(props: Props) {
	const searchParams = useSearchParams();
	const { trusted } = useTrusted();

	return <ActualTable key={`${searchParams.toString()}|${trusted}`} {...props} />;
}
