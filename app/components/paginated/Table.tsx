"use client";

import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata, { DataTableNames, NonDataTableNames } from "@/types/tableMetadata";
import { BlastQuery, BlastQueryResult, Prisma, Sample, Tag } from "@/app/generated/prisma/client";
import { SubmitEvent, ReactNode, useEffect, useRef, useState } from "react";
import useSWR, { preload } from "swr";
import { getRelationPath, getZodType } from "../../helpers/schema";
import LoadingTable from "./LoadingTable";
import PaginationControls from "./PaginationControls";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { capitalizeTable, depluralizeTable, fetcher, uncapitalizeTable } from "@/app/helpers/utils";
import AnalysisTag from "../tags/AnalysisTag";
import Checklist from "../Checklist";
import InfoButton from "../InfoButton";
import { buildWhereParams } from "@/app/helpers/queries";
import TableStatusState from "./TableStatusState";

type ExtraResults = {
	blastResult: BlastQueryResult[] | undefined;
	existingBlastDate: BlastQuery["dateCalculated"] | undefined;
	samples: Sample[] | undefined;
};

const DEFAULT_ORDER_BY = { field: "id", order: "desc" } as { field: string; order: Prisma.SortOrder };
const EXCLUDE_TABLES = NonDataTableNames.filter((t) => t !== "tag") as Uncapitalize<Prisma.ModelName>[];

//TODO: make where arg support relational queries
//TODO: clamp table column width, add hover info to clamped columns
export default function Table({
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
}: {
	table: Uncapitalize<Prisma.ModelName>;
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
}) {
	//TODO: for compound fkeys, make the fields of the fkey immediately follow the fkey
	const title = TableMetadata[table].titleField;

	const combinedOmit = [...omit, ...GlobalOmit, "id"];

	const defaultHeadersSet = new Set() as Set<string>;

	//title field array
	if (Array.isArray(title)) {
		title.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}

	//assemble relational data for table
	const manyRelations = [] as string[];
	const oneRelations = [] as string[];
	const oneRelationsWithArrayTitle = {} as Record<Prisma.ModelName, readonly string[]>;
	for (const rel of TableMetadata[table].relations) {
		if (!EXCLUDE_TABLES.includes(uncapitalizeTable(rel.table)))
			if (rel.type.endsWith("many")) {
				manyRelations.push(rel.field);
			} else if (rel.type.endsWith("one")) {
				const meta = TableMetadata[rel.table];
				if (typeof meta.titleField === "string") {
					oneRelations.push(meta.titleField);
				} else {
					oneRelationsWithArrayTitle[rel.table] = meta.titleField;
				}
			}
	}

	//move tags to the front
	const manyRelationsNoTags = manyRelations.filter((r) => r !== "Tags");
	if (manyRelations.length !== manyRelationsNoTags.length) {
		defaultHeadersSet.add("Tags");
	}
	//relation fields with one, array title
	for (const [field, titleFields] of Object.entries(oneRelationsWithArrayTitle)) {
		defaultHeadersSet.add(field);
		titleFields.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}
	//relation fields with one
	if (oneRelations.length) {
		//maintain field order for relation fields
		if (TableMetadata[table].fieldOrder) {
			for (const f of TableMetadata[table].fieldOrder) {
				if (oneRelations.includes(f)) {
					defaultHeadersSet.add(f);
				}
			}
		}

		oneRelations.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}
	//relation fields with many
	manyRelationsNoTags.forEach(defaultHeadersSet.add, defaultHeadersSet);
	//field order
	if (TableMetadata[table].fieldOrder) {
		TableMetadata[table].fieldOrder.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}
	//rest of fields
	TableMetadata[table].enumSchema.options
		.reduce((acc: string[], head) => {
			if (
				//displaying title header differently, so removing it
				head !== title &&
				//displaying userDefined differently, so removing it
				head !== "userDefined" &&
				//remove all headers where the value is assumed to be the same
				!(where && Object.keys(where).includes(head)) &&
				//remove headers that have been omitted
				!combinedOmit.includes(head)
			) {
				acc.push(head);
			}

			return acc;
		}, [])
		.forEach(defaultHeadersSet.add, defaultHeadersSet);

	//apply default filters
	const defaultHeadersFilter = {} as Record<string, boolean>;
	if (filterHeadersAtStart && TableMetadata[table].subFields) {
		for (const head of defaultHeadersSet) {
			if (
				!TableMetadata[table].subFields.includes(head) &&
				!manyRelations.includes(head) &&
				!(Array.isArray(title) && title.includes(head)) &&
				!(
					head in oneRelationsWithArrayTitle &&
					oneRelationsWithArrayTitle[head as Prisma.ModelName].every((f) => TableMetadata[table].subFields!.includes(f))
				)
			) {
				defaultHeadersFilter[head] = true;
			}
		}
	}

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [take, setTake] = useState(defaultTake);
	const takeRef = useRef<HTMLInputElement>(null);
	const [page, setPage] = useState(1);

	const [headers, setHeaders] = useState(Array.from(defaultHeadersSet));
	const [userDefinedHeaders, setUserDefinedHeaders] = useState([] as string[]);

	const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY as { field: string; order: "asc" | "desc" });

	const [whereFilter, setWhereFilter] = useState({} as Record<string, number | string>);
	const [hideEmpty, setHideEmpty] = useState(hideEmptyAtStart || false);
	const [emptyFilter, setEmptyFilter] = useState({} as Record<string, true>);

	const deepRelations = DataTableNames.reduce(
		(acc, name) => {
			if (name !== table && TableMetadata[table].relations.every((rel) => uncapitalizeTable(rel.table) !== name)) {
				const path = getRelationPath(table, name);
				if (path) {
					if (path.some((p) => p.type.endsWith("many"))) {
						acc.push({ label: TableMetadata[name].plural, table: name, type: "many" });
					} else {
						if (typeof TableMetadata[name].titleField === "string") {
							acc.push({ label: TableMetadata[name].titleField, table: name, type: "field" });
						} else {
							acc.push({ label: capitalizeTable(name), table: name, type: "table" });
						}
					}
				}
			}

			return acc;
		},
		[] as { label: string; table: Uncapitalize<Prisma.ModelName>; type: "field" | "table" | "many" }[]
	);
	const [deepRelationsFilter, setDeepRelationsFilter] = useState(
		deepRelations.reduce((acc, rel) => ({ ...acc, [rel.label]: true }), {}) as Record<string, boolean>
	);
	const [headersFilter, setHeadersFilter] = useState(defaultHeadersFilter);
	const [pendingFilters, setPendingFilters] = useState(0);

	function getQuery(dir?: 1 | -1) {
		const query = new URLSearchParams({
			take: take.toString(),
			page: (dir ? page + dir : page).toString(),
			orderBy: orderBy.field + "," + orderBy.order
		});

		let whereQuery = {} as Record<string, string | number>;
		if (where) {
			whereQuery = { ...where };
		}
		if (Object.keys(whereFilter).length) {
			whereQuery = { ...whereQuery, ...whereFilter };
		}
		if (searchParams && searchParams.size) {
			buildWhereParams(searchParams, query, whereQuery, ignoreParams);
		}

		if (Object.keys(whereQuery).length) {
			query.set("where", JSON.stringify(whereQuery));
		}

		Object.entries(extraParams || {}).forEach(([k, v]) => query.set(k, v));

		if (manyRelations.length) {
			if (manyRelations.includes("Tags")) {
				query.set("relCounts", manyRelations.filter((r) => r !== "Tags").join(","));
				query.set("relations", "Tags");
				query.set("relationsAllFields", "true");
			} else {
				query.set("relCounts", manyRelations.join(","));
			}
		}

		if (deepRelations.length !== Object.keys(deepRelationsFilter).length) {
			if (Object.keys(deepRelationsFilter).length === 0) {
				query.set("deepRelations", "true");
			} else {
				query.set(
					"deepRelations",
					deepRelations
						.reduce((acc, rel) => {
							if (!deepRelationsFilter[rel.label]) {
								acc.push(rel.table);
							}

							return acc;
						}, [] as string[])
						.join(",")
				);
			}
		}

		return query;
	}

	const { data, error, isLoading } = useSWR(`/api/${table}/pagination?${getQuery().toString()}`, fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: false
	});

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			if (hideEmpty) {
				const emptyFields = {} as Record<string, true>;
				const exemptFields = {} as Record<string, true>;

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

				// eslint-disable-next-line react-hooks/set-state-in-effect
				setEmptyFilter(emptyFields);
			} else if (Object.keys(emptyFilter).length) {
				setEmptyFilter({});
			}
		}
	}, [hideEmpty, data]);

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			//pass up extra results from query
			if (setExtraResults) {
				setExtraResults({
					samples: data.samples,
					blastResult: data.BlastQueryResults,
					existingBlastDate: data.existingBlastDate
				} as ExtraResults);
			}

			//set to last page if page is too large
			if ((page - 1) * take > data.count) {
				// eslint-disable-next-line react-hooks/set-state-in-effect
				setPage(Math.floor(data.count / take) + 1);
			}

			//create new userDefinedHeaders
			const tempUserDefinedHeadersSet = new Set() as Set<string>;
			for (const r of data.result) {
				for (const h in r.userDefined) {
					tempUserDefinedHeadersSet.add(h);
				}
			}

			if (tempUserDefinedHeadersSet.size) {
				const tempUserDefinedHeaders = Array.from(tempUserDefinedHeadersSet);
				//TODO: inject deep relations headers after close relation headers
				setHeaders([...headers.filter((head) => !userDefinedHeaders.includes(head)), ...tempUserDefinedHeadersSet]);
				setUserDefinedHeaders(tempUserDefinedHeaders);

				if (!userDefinedHeaders.length && filterHeadersAtStart) {
					const tempHeadersFilter = {
						...defaultHeadersFilter,
						...tempUserDefinedHeaders.reduce((acc, head) => ({ ...acc, [head]: true }), {} as Record<string, boolean>)
					} as Record<string, true>;

					if (Object.keys(tempHeadersFilter).length) {
						setHeadersFilter(tempHeadersFilter);
					}
				}
			}
		}
	}, [data]);

	if (error) {
		return (
			<TableStatusState
				kind="error"
				title="Could not load results"
				detail={error instanceof Error ? error.message : String(error)}
			/>
		);
	}
	if (isLoading || !data) return <LoadingTable take={take} page={page} />;
	if (data.statusMessage === "error") {
		return (
			<TableStatusState kind="error" title="Could not load results" detail={String(data.error ?? "Unknown error")} />
		);
	}

	//filters in the column header
	function applyFilters(e: SubmitEvent<HTMLFormElement>) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		const formTake = parseInt(formData.get("take") as string);
		formData.delete("take");

		const temp = {} as typeof whereFilter;
		for (const [field, value] of formData.entries()) {
			if (typeof value === "string" && value.trim()) {
				const type = getZodType(table, field).type;

				if (type === "string") {
					temp[field] = value;
				} else if (type === "integer") {
					temp[field] = parseInt(value);
				} else if (type === "float") {
					temp[field] = parseFloat(value);
				} else {
					temp[field] = value;
				}
			}
		}
		if (!formTake || isNaN(formTake)) {
			takeRef.current!.value = defaultTake.toString();
			if (take !== defaultTake) {
				setTake(defaultTake);
			}
		} else {
			setTake(formTake);
		}
		setWhereFilter(temp);
	}

	function resetForm() {
		//@ts-expect-error indexing collection by string
		document.forms[`${table}TableForm`].reset();
		setWhereFilter({});
		setPendingFilters(0);

		const newParams = new URLSearchParams(searchParams.toString());
		newParams.delete("search");
		router.push(`${pathname}?${newParams.toString()}`);
	}

	function handleFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		let count = 0;
		formData.delete("take");
		for (const value of formData.values()) {
			if (typeof value === "string" && value.trim()) {
				count++;
			}
		}
		setPendingFilters(count);
	}

	return (
		<div className={`bg-base-100 border-base-300 rounded-box h-full w-full p-6 ${className ?? ""}`}>
			<form
				id={`${table}TableForm`}
				onSubmit={applyFilters}
				onChange={(e) => handleFormChange(e.currentTarget)}
				className="w-full h-full flex flex-col"
			>
				<div className="flex justify-between items-center mb-4">
					{/* Left side: Filters */}
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
					{/* Pagination Controls */}
					<PaginationControls
						page={page}
						take={take}
						count={data.count}
						setPage={setPage}
						handlePageHover={(dir = 1 as 1 | -1) => preload(`/api/${table}/pagination?${getQuery(dir)}`, fetcher)}
					/>
					{/* Column Selection Button */}
					<div className="grid grid-cols-3 w-full gap-5 flex-1">
						<div className="flex gap-2">
							<InfoButton
								text="If many rows are displayed per page, selecting these options can cause long load times."
								type="warning"
								dir="tooltip-left"
								className="z-60"
							/>

							<Checklist
								label="Deep Relations"
								list={deepRelations.map((rel) => rel.label)}
								listFilter={deepRelationsFilter}
								setListFilter={setDeepRelationsFilter}
								className="justify-self-end"
								buttonClassName="btn-sm"
							/>
						</div>

						<Checklist
							label="Columns"
							list={headers}
							listFilter={headersFilter}
							setListFilter={setHeadersFilter}
							extraLists={[{ list: userDefinedHeaders, label: "UD" }]}
							className="justify-self-end"
							buttonClassName="btn-sm"
						/>

						<fieldset className="fieldset bg-base-100 border-base-300">
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
						{/* Headers */}
						<thead>
							<tr>
								{/* Title Header Cell */}
								{typeof title === "string" ? (
									<th
										scope="col"
										aria-sort={
											orderBy.field === title ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"
										}
										className="px-3 py-2 z-40 bg-base-100"
									>
										<button
											className="cursor-pointer select-none flex justify-between mb-1"
											onClick={() =>
												orderBy.field === title
													? orderBy.order === "asc"
														? setOrderBy({ field: title, order: "desc" })
														: setOrderBy(DEFAULT_ORDER_BY)
													: setOrderBy({ field: title, order: "asc" })
											}
										>
											<span>{title}</span>
											{orderBy.field === title ? orderBy.order === "asc" ? <UpArrow /> : <DownArrow /> : <></>}
										</button>

										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
													<SearchIcon />
													<input
														name={title}
														aria-label={title}
														defaultValue={whereFilter[title] || ""}
														type="text"
														className="grow"
														placeholder="Press Enter to search"
													/>
												</label>
											)}
										</label>
									</th>
								) : (
									<th className="px-3 py-2 z-40 bg-base-100 cursor-not-allowed">
										<div className="select-none mb-1">
											<div className="flex select-none mb-1">
												{capitalizeTable(table)}
												{" (" + title.join(" / ") + ")"}
											</div>
										</div>
										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-sm flex items-center gap-2 w-full">
													<SearchIcon />
													<input disabled type="text" className="grow" />
												</label>
											)}
										</label>
									</th>
								)}

								{headers.reduce((acc: ReactNode[], head, i) => {
									//only render the header if it is selected in the header filter
									if (!headersFilter[head] && !emptyFilter[head]) {
										//Header
										if (head in oneRelationsWithArrayTitle) {
											acc.push(
												<th key={head + i} className="bg-base-100 cursor-not-allowed">
													<div className="flex select-none mb-1">
														{head}
														{" (" + oneRelationsWithArrayTitle[head as Prisma.ModelName].join(" / ") + ")"}
													</div>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
																<SearchIcon />
																<input type="text" className="grow" disabled />
															</label>
														)}
													</label>
												</th>
											);
										} else if (manyRelations.includes(head)) {
											acc.push(
												<th
													key={head + i}
													scope="col"
													aria-sort={
														orderBy.field === head ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"
													}
													className="bg-base-100"
												>
													<button
														className="flex justify-between select-none mb-1 cursor-pointer"
														onClick={() =>
															orderBy.field === head
																? orderBy.order === "asc"
																	? setOrderBy({ field: head, order: "desc" })
																	: setOrderBy(DEFAULT_ORDER_BY)
																: setOrderBy({ field: head, order: "asc" })
														}
													>
														{head}
														{orderBy.field === head ? orderBy.order === "asc" ? <UpArrow /> : <DownArrow /> : <></>}
													</button>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
																<SearchIcon />
																<input type="text" className="grow" disabled />
															</label>
														)}
													</label>
												</th>
											);
										} else if (userDefinedHeaders.includes(head)) {
											acc.push(
												<th key={head + i} className="bg-base-100 cursor-not-allowed">
													<div className="flex gap-1 select-none mb-1">
														{head}
														<sup className="text-xs">UD</sup>
													</div>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
																<SearchIcon />
																<input
																	name={head}
																	aria-label={head}
																	defaultValue={whereFilter[head] || ""}
																	type="text"
																	className="grow min-w-10"
																	disabled
																/>
															</label>
														)}
													</label>
												</th>
											);
										} else {
											acc.push(
												<th
													key={head + i}
													scope="col"
													aria-sort={
														orderBy.field === head ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"
													}
													className="bg-base-100"
												>
													<button
														className="flex justify-between select-none mb-1 cursor-pointer"
														onClick={() =>
															orderBy.field === head
																? orderBy.order === "asc"
																	? setOrderBy({ field: head, order: "desc" })
																	: setOrderBy(DEFAULT_ORDER_BY)
																: setOrderBy({ field: head, order: "asc" })
														}
													>
														{head}
														{orderBy.field === head ? orderBy.order === "asc" ? <UpArrow /> : <DownArrow /> : <></>}
													</button>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
																<SearchIcon />
																<input
																	name={head}
																	aria-label={head}
																	defaultValue={whereFilter[head] || ""}
																	type="text"
																	className="grow min-w-10"
																	placeholder="Press Enter to search"
																/>
															</label>
														)}
													</label>
												</th>
											);
										}
									}

									return acc;
								}, [])}

								{deepRelations.reduce((acc, rel, i) => {
									if (!deepRelationsFilter[rel.label]) {
										acc.push(
											<th key={rel.label + i} className="bg-base-100 cursor-not-allowed">
												<div className="flex select-none mb-1">
													{rel.label}
													{rel.type === "table"
														? " (" +
															(TableMetadata[rel.table as Prisma.ModelName].titleField as string[]).join(" / ") +
															")"
														: ""}
												</div>
												<label className="form-control w-full max-w-xs text-lg">
													{/* Value Filter */}
													{!hideFilters && (
														<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
															<SearchIcon />
															<input type="text" className="grow" disabled />
														</label>
													)}
												</label>
											</th>
										);
									}

									return acc;
								}, [] as ReactNode[])}

								<th></th>
							</tr>
						</thead>
						<tbody>
							{/* Value Row */}
							{data.result &&
								data.result.map((row: Record<string, any>, i: number) => (
									<tr key={"row" + i} className="h-12 align-middle">
										{typeof title === "string" ? (
											<th
												className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2 ${
													i ? "border-t-2" : ""
												}`}
											>
												<Link
													href={`/explore/${table}/${encodeURIComponent(row[title])}`}
													className="link link-primary link-hover"
												>
													{row[title]}
												</Link>
											</th>
										) : (
											<th
												className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2 ${
													i ? "border-t-2" : ""
												}`}
											>
												<Link
													href={`/explore/${table}/${title.map((f) => encodeURIComponent(row[f])).join("/")}`}
													className="link link-primary link-hover"
												>
													{title.map((f) => (row[f].length > 15 ? row[f].slice(0, 10) + "..." : row[f])).join(" / ")}
												</Link>
											</th>
										)}

										{headers.reduce((acc: ReactNode[], head, j) => {
											if (!headersFilter[head] && !emptyFilter[head]) {
												//cell
												if (manyRelations.includes(head)) {
													if (head === "Tags") {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																	i ? "border-t-2" : ""
																} ${row.Tags.length === 0 ? "bg-base-200" : ""}`}
																key={head + "child" + j}
															>
																<div className="flex gap-3">
																	{row.Tags.map((t: Tag) => (
																		<AnalysisTag key={t.tagName} tag={t} hideDescription />
																	))}
																</div>
															</td>
														);
													} else {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																	i ? "border-t-2" : ""
																}`}
																key={head + "child" + j}
															>
																<div className="flex justify-center">
																	<Link
																		className="btn text-nowrap"
																		href={`/search?table=${depluralizeTable(head as Prisma.ModelName)}&advanced=[${
																			typeof title === "string"
																				? `["${table}", "${title}", "equals", "${row[title]}"]`
																				: title.map((t) => `["${table}", "${t}", "equals", "${row[t]}"]`).join(",")
																		}]`}
																	>
																		<LinkIcon /> {row._count[head]}{" "}
																		{row._count[head] === 1
																			? capitalizeTable(depluralizeTable(head as Prisma.ModelName))
																			: head}
																	</Link>
																</div>
															</td>
														);
													}
												} else if (userDefinedHeaders.includes(head)) {
													if (row.userDefined && row.userDefined[head]) {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																	i ? "border-t-2" : ""
																}`}
																key={row.userDefined[head] + "child" + j}
															>
																{row.userDefined[head]}
															</td>
														);
													} else {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 bg-base-200 ${
																	i ? "border-t-2" : ""
																}`}
																key={"nullchild" + j}
															></td>
														);
													}
												} else {
													let element;
													if (oneRelations.includes(head as Prisma.ModelName)) {
														element = (
															<Link
																href={`/explore/${Object.keys(TableMetadata).find(
																	(table) => TableMetadata[table as Prisma.ModelName].titleField === head
																)}/${encodeURIComponent(row[head])}`}
																className="link link-primary link-hover font-bold"
															>
																{row[head]}
															</Link>
														);
													} else if (head in oneRelationsWithArrayTitle) {
														const typedHead = head as Prisma.ModelName;
														element = (
															<Link
																href={`/explore/${uncapitalizeTable(typedHead)}/${oneRelationsWithArrayTitle[typedHead]
																	.map((f) => encodeURIComponent(row[f]))
																	.join("/")}`}
																className="link link-primary link-hover font-bold"
															>
																{oneRelationsWithArrayTitle[typedHead]
																	.map((f) => (row[f].length > 15 ? row[f].slice(0, 10) + "..." : row[f]))
																	.join(" / ")}
															</Link>
														);
													} else if (row[head] in DeadValueEnum && typeof row[head] === "number") {
														element = DeadValueEnum[row[head]];
													} else if (URL.canParse(row[head]) && row[head].startsWith("https://")) {
														element = (
															<a href={row[head]} className="link link-primary link-hover">
																{row[head]}
															</a>
														);
													} else if (typeof row[head] === "boolean") {
														if (row[head]) {
															element = (
																<svg
																	width="30px"
																	height="30px"
																	viewBox="0 0 1920 1920"
																	xmlns="http://www.w3.org/2000/svg"
																	className="text-success w-full"
																	stroke="currentColor"
																	fill="currentColor"
																>
																	<path d="M1827.701 303.065 698.835 1431.801 92.299 825.266 0 917.564 698.835 1616.4 1919.869 395.234z" />
																</svg>
															);
														} else {
															element = (
																<svg
																	width="45px"
																	height="45px"
																	viewBox="0 0 24 24"
																	className="text-error w-full"
																	stroke="currentColor"
																	fill="currentColor"
																	xmlns="http://www.w3.org/2000/svg"
																>
																	<path d="M6 6L18 18M18 6L6 18" />
																</svg>
															);
														}
													} else {
														element = row[head];
													}

													acc.push(
														<td
															className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																i ? "border-t-2" : ""
															} ${row[head] === null || row[head] in DeadValueEnum ? "bg-base-200" : ""}`}
															key={row[head] + "child" + j}
														>
															{element}
														</td>
													);
												}
											}

											return acc;
										}, [])}

										{deepRelations.reduce((acc, rel, j) => {
											if (!deepRelationsFilter[rel.label]) {
												if (rel.type === "many") {
													acc.push(
														<td
															className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																i ? "border-t-2" : ""
															}`}
															key={rel.label + "child" + j}
														>
															<div className="flex justify-center">
																<Link
																	className="btn text-nowrap"
																	href={`/search?table=${rel.table}&advanced=[${
																		typeof title === "string"
																			? `["${table}", "${title}", "equals", "${row[title]}"]`
																			: title.map((t) => `["${table}", "${t}", "equals", "${row[t]}"]`).join(",")
																	}]`}
																>
																	<LinkIcon /> {row._count[rel.label]}{" "}
																	{row._count[rel.label] === 1 ? capitalizeTable(rel.table) : rel.label}
																</Link>
															</div>
														</td>
													);
												} else {
													const path = getRelationPath(table, rel.table)!;
													const titleFieldObj = path.reduce((obj, curr) => obj[curr.field], row[path.shift()!.field]);

													if (rel.type === "table") {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																	i ? "border-t-2" : ""
																} ${"test" === null ? "bg-base-200" : ""}`}
																key={rel.label + "child" + j}
															>
																<Link
																	href={`/explore/${rel.table}/${(TableMetadata[rel.table].titleField as string[]).map((f) => encodeURIComponent(titleFieldObj[f])).join("/")}`}
																	className="link link-primary link-hover font-bold"
																>
																	{(TableMetadata[rel.table].titleField as string[])
																		.map((f) =>
																			titleFieldObj[f].length > 15
																				? titleFieldObj[f].slice(0, 10) + "..."
																				: titleFieldObj[f]
																		)
																		.join(" / ")}
																</Link>
															</td>
														);
													} else if (rel.type === "field") {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${
																	i ? "border-t-2" : ""
																} ${"test" === null ? "bg-base-200" : ""}`}
																key={rel.label + "child" + j}
															>
																<Link
																	href={`/explore/${rel.table}/${encodeURIComponent(titleFieldObj[rel.label])}`}
																	className="link link-primary link-hover font-bold"
																>
																	{titleFieldObj[rel.label]}
																</Link>
															</td>
														);
													}
												}
											}

											return acc;
										}, [] as ReactNode[])}

										<th className={`border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}>
											{i + 1 + (page - 1) * take}
										</th>
									</tr>
								))}
						</tbody>
					</table>
				</div>

				{/* Bottom Pagination Controls */}
				<div className="flex justify-center mt-4">
					<PaginationControls
						page={page}
						take={take}
						count={data.count}
						setPage={setPage}
						handlePageHover={(dir = 1 as 1 | -1) => preload(`/api/${table}/pagination?${getQuery(dir)}`, fetcher)}
					/>
				</div>
			</form>
		</div>
	);
}

function UpArrow() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="20"
			className="text-primary mr-2"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<path d="m12 6.586-8.707 8.707 1.414 1.414L12 9.414l7.293 7.293 1.414-1.414L12 6.586z" />
		</svg>
	);
}

function DownArrow() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="20"
			className="text-primary mr-2"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<path d="M12 17.414 3.293 8.707l1.414-1.414L12 14.586l7.293-7.293 1.414 1.414L12 17.414z" />
		</svg>
	);
}

function SearchIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
			<path
				fillRule="evenodd"
				d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

function LinkIcon() {
	return (
		<svg
			width="20px"
			height="20px"
			viewBox="0 0 32 32"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			className="text-primary"
			stroke="currentColor"
			fill="currentColor"
		>
			<path d="M15.694 13.541l2.666 2.665 5.016-5.017 2.59 2.59 0.004-7.734-7.785-0.046 2.526 2.525-5.017 5.017zM25.926 16.945l-1.92-1.947 0.035 9.007-16.015 0.009 0.016-15.973 8.958-0.040-2-2h-7c-1.104 0-2 0.896-2 2v16c0 1.104 0.896 2 2 2h16c1.104 0 2-0.896 2-2l-0.074-7.056z"></path>
		</svg>
	);
}
