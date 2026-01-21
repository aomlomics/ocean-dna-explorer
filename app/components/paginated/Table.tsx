"use client";

import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Prisma, Tag } from "@/app/generated/prisma/client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { getZodType } from "../../helpers/schema";
import LoadingTable from "./LoadingTable";
import PaginationControls from "./PaginationControls";
import { NetworkPacket } from "@/types/globals";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { capitalizeTable, depluralizeTable, fetcher, uncapitalizeTable } from "@/app/helpers/utils";
import AnalysisTag from "../tags/AnalysisTag";

const DEFAULT_ORDER_BY = { field: "id", order: "asc" } as { field: string; order: Prisma.SortOrder };

//TODO: make where arg support relational queries
//TODO: clamp table column width, add hover info to clamped columns
//TODO: support boolean values (check/x)
export default function Table({
	table,
	where,
	omit = [],
	hideFilters,
	hideEmptyAtStart,
	filterHeadersAtStart,
	defaultTake = 50,
	showUserDefined,
	ignoreParams,
	className
}: {
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, any>;
	omit?: string[];
	hideFilters?: boolean;
	hideEmptyAtStart?: boolean;
	filterHeadersAtStart?: boolean;
	defaultTake?: number;
	showUserDefined?: boolean;
	ignoreParams?: string[];
	className?: string;
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [take, setTake] = useState(defaultTake);
	const [page, setPage] = useState(1);

	const [headers, setHeaders] = useState([] as string[]);
	const [userDefinedHeaders, setUserDefinedHeaders] = useState([] as string[]);

	const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);

	const [whereFilter, setWhereFilter] = useState({} as Record<string, number | string>);
	const [hideEmpty, setHideEmpty] = useState(hideEmptyAtStart || false);
	const [emptyFilter, setEmptyFilter] = useState({} as Record<string, true>);
	const [headersFilter, setHeadersFilter] = useState({} as Record<string, true>);
	const [pendingFilters, setPendingFilters] = useState(0);
	const [columnsFilter, setColumnsFilter] = useState("");

	const combinedOmit = [...omit, ...GlobalOmit];
	const title = TableMetadata[table].titleField;

	const manyRelations = [] as string[];
	const oneRelations = [] as string[];
	const oneRelationsArrayTitle = {} as Record<Prisma.ModelName, string[]>;
	for (const rel of TableMetadata[table].relations) {
		if (rel.type.endsWith("many")) {
			manyRelations.push(rel.field);
		} else if (rel.type.endsWith("one")) {
			const relTable = rel.field as Prisma.ModelName;
			if (typeof TableMetadata[relTable].titleField === "string") {
				oneRelations.push(TableMetadata[relTable].titleField);
			} else {
				oneRelationsArrayTitle[relTable] = TableMetadata[relTable].titleField;
			}
		}
	}

	//api call
	let query = new URLSearchParams({
		take: take.toString(),
		page: page.toString(),
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

		//get rest of queries
		whereQuery = { ...whereQuery, ...Object.fromEntries(tempParms) };
		if (ignoreParams) {
			for (const param of ignoreParams) {
				delete whereQuery[param];
			}
		}
	}

	if (Object.keys(whereQuery).length) {
		query.set("where", JSON.stringify(whereQuery));
	}

	if (manyRelations.length) {
		if (manyRelations.includes("Tags")) {
			query.set("relCounts", manyRelations.filter((r) => r !== "Tags").join(","));
			query.set("relations", "Tags");
			query.set("relationsAllFields", "true");
		} else {
			query.set("relCounts", manyRelations.join(","));
		}
	}

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/${table}/pagination?${query.toString()}`,
		fetcher
	);

	// Reset to first page whenever the table or URL search params change
	useEffect(() => {
		setPage(1);
	}, [table, searchParams]);

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			if (hideEmpty) {
				const emptyFields = {} as Record<string, true>;
				const exemptFields = {} as Record<string, true>;

				for (let row of data.result) {
					for (let [field, value] of Object.entries(row)) {
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

				setEmptyFilter(emptyFields);
			} else {
				setEmptyFilter({});
			}
		}
	}, [hideEmpty, data]);

	useEffect(() => {
		if (!headers.length && data && data.statusMessage === "success") {
			let tempHeadersSet = new Set() as Set<string>;
			//move tags to the front
			const manyRelationsNoTags = manyRelations.filter((r) => r !== "Tags");
			if (manyRelations.length !== manyRelationsNoTags.length) {
				tempHeadersSet.add("Tags");
			}
			if (oneRelations.length) {
				//maintain field order for relation fields
				if (TableMetadata[table].fieldOrder) {
					for (const f of TableMetadata[table].fieldOrder) {
						if (oneRelations.includes(f)) {
							tempHeadersSet.add(f);
						}
					}
				}

				oneRelations.forEach(tempHeadersSet.add, tempHeadersSet);
			}
			Object.keys(oneRelationsArrayTitle).forEach(tempHeadersSet.add, tempHeadersSet);
			manyRelationsNoTags.forEach(tempHeadersSet.add, tempHeadersSet);
			if (TableMetadata[table].fieldOrder) {
				TableMetadata[table].fieldOrder.forEach(tempHeadersSet.add, tempHeadersSet);
			}
			TableMetadata[table].enumSchema.options
				.reduce((acc: string[], head) => {
					//remove database field
					//displaying title header differently, so removing it
					if (head === "id" || head === title) {
						return acc;
					}

					//remove all headers where the value is assumed to be the same
					if (where && Object.keys(where).includes(head)) {
						return acc;
					}

					//remove headers that have been omitted
					if (combinedOmit.includes(head)) {
						return acc;
					}

					if (head !== "userDefined") {
						acc.push(head);
					}

					return acc;
				}, [])
				.forEach(tempHeadersSet.add, tempHeadersSet);

			//apply default filters
			let tempHeadersFilter = {} as Record<string, true>;
			if (filterHeadersAtStart && TableMetadata[table].subFields) {
				const temp = {} as Record<string, true>;
				for (const head of tempHeadersSet) {
					if (
						!TableMetadata[table].subFields.includes(head) &&
						!manyRelations.includes(head) &&
						//every title field is included in subFields
						!(
							head in oneRelationsArrayTitle &&
							oneRelationsArrayTitle[head as Prisma.ModelName].every((f) => TableMetadata[table].subFields!.includes(f))
						)
					) {
						temp[head] = true;
					}
				}
				tempHeadersFilter = temp;
			}

			if (showUserDefined) {
				const tempUserDefinedHeadersSet = new Set() as Set<string>;
				for (const r of data.result) {
					for (const h in r.userDefined) {
						tempUserDefinedHeadersSet.add(h);
					}
				}

				tempHeadersSet = new Set([...tempHeadersSet, ...tempUserDefinedHeadersSet]);
				const tempUserDefinedHeaders = Array.from(tempUserDefinedHeadersSet);
				setUserDefinedHeaders(tempUserDefinedHeaders);

				if (filterHeadersAtStart) {
					tempHeadersFilter = {
						...tempHeadersFilter,
						...tempUserDefinedHeaders.reduce((acc, head) => ({ ...acc, [head]: true }), {} as Record<string, true>)
					};
				}
			}

			setHeaders(Array.from(tempHeadersSet));

			if (Object.keys(tempHeadersFilter).length) {
				setHeadersFilter(tempHeadersFilter);
			}
		}
	}, [data]);

	if (isLoading) return <LoadingTable take={take} page={page} />;
	if (error) return <div>failed to load: {error}</div>;
	if (data.statusMessage === "error") return <div>failed to load: {data.error}</div>;

	function handlePageHover(dir = 1) {
		let query = new URLSearchParams({
			take: take.toString(),
			page: (page + dir).toString()
		});
		if (where) {
			if (Object.keys(whereFilter).length) {
				query.set("where", JSON.stringify({ ...where, ...whereFilter }));
			} else {
				query.set("where", JSON.stringify(where));
			}
		}

		preload(`/api/${table}/pagination?${query.toString()}`, fetcher);
	}

	//filters in the column header
	function applyFilters(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		let take = parseInt(formData.get("take") as string);
		formData.delete("take");

		const temp = {} as typeof whereFilter;
		for (const [field, value] of formData.entries()) {
			if (typeof value === "string" && value.trim()) {
				const type = getZodType(TableMetadata[table].schema.shape[field]).type;

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
		setTake(take);
		setWhereFilter(temp);
	}

	function resetForm() {
		//@ts-ignore
		document.forms[`${table}TableForm`].reset();
		setWhereFilter({});
		setPendingFilters(0);

		const params = new URLSearchParams(searchParams.toString());
		params.delete("search");
		router.push(`${pathname}?${params.toString()}`);
	}

	function handleFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		let count = 0;
		formData.delete("take");
		for (const [_, value] of formData.entries()) {
			if (typeof value === "string" && value.trim()) {
				count++;
			}
		}
		setPendingFilters(count);
	}

	const baseWrapperClasses = "bg-base-100 border-base-300 rounded-box h-full w-full";
	const wrapperClasses = className ? `${baseWrapperClasses} ${className}` : `${baseWrapperClasses} p-6`;

	return (
		<div className={wrapperClasses}>
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
									<button
										type="submit"
										className={`btn btn-sm ${
											pendingFilters > 0 ? "btn-primary" : "bg-base-100 border border-base-300"
										}`}
									>
										Apply Filters {pendingFilters > 0 && `(${pendingFilters})`}
									</button>
								</>
							)}
							<label className="input input-sm input-bordered">
								Per Page:
								<input name="take" defaultValue={take} type="number" />
							</label>
						</div>
					</div>
					{/* Pagination Controls */}
					<div className="flex-1">
						<PaginationControls
							page={page}
							take={take}
							count={data.count}
							handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
							handlePageHover={handlePageHover}
						/>
					</div>
					{/* Column Selection Button */}
					<div className="grid grid-cols-2 w-full gap-5 flex-1">
						<div className="dropdown dropdown-end justify-self-end">
							<div tabIndex={0} role="button" className="btn btn-sm">
								{headers.length - Object.keys(headersFilter).length}/{headers.length} Columns
							</div>
							{/* Dropdown */}
							<div tabIndex={0} className="dropdown-content z-50 w-64 shadow-lg overflow-x-hidden">
								<div className="bg-base-100 border border-base-300 rounded-box overflow-hidden">
									{/* Header: All toggle + search */}
									<div className="sticky top-0 bg-base-200 border-b border-base-300 p-2">
										<div className="form-control flex-row items-center w-full gap-2 min-w-0">
											<label className="label cursor-pointer justify-start gap-2 m-0 p-0">
												<input
													type="checkbox"
													onChange={(e) => {
														if (e.target.checked) {
															setHeadersFilter({});
														} else {
															setHeadersFilter(
																headers.reduce((acc: Record<string, true>, head) => {
																	if (!headersFilter[head]) {
																		return { ...acc, [head]: true };
																	} else {
																		return { ...acc };
																	}
																}, {})
															);
														}
													}}
													checked={!Object.values(headersFilter).some((bool) => bool)}
													className="checkbox checkbox-xs"
												/>
												<span className="label-text text-sm">All</span>
											</label>
											<input
												type="text"
												onChange={(e) => setColumnsFilter(e.target.value)}
												placeholder="Filter columns"
												className="input input-bordered input-xs w-full flex-1 min-w-0"
											/>
										</div>
									</div>

									{/* Body: column list */}
									<ul className="bg-base-100 max-h-64 overflow-y-auto overflow-x-hidden p-2 pt-1 w-full flex flex-col gap-1">
										{headers.reduce((acc: ReactNode[], head, i) => {
											//only render the header name if it is selected in the header name filter
											if (head.toLowerCase().includes(columnsFilter.toLowerCase())) {
												acc.push(
													<li key={head + "_dropdown" + i}>
														<label className="flex items-center cursor-pointer p-2 hover:bg-base-200 rounded w-full gap-2 min-w-0">
															<input
																type="checkbox"
																checked={!headersFilter[head]}
																onChange={() => {
																	const temp = { ...headersFilter };
																	if (headersFilter[head]) {
																		delete temp[head];
																	} else {
																		temp[head] = true;
																	}
																	setHeadersFilter(temp);
																}}
																className="checkbox checkbox-xs"
															/>
															<span className="text-sm pl-2 truncate max-w-full">{head}</span>
														</label>
													</li>
												);
											}

											return acc;
										}, [])}
									</ul>
								</div>
							</div>
						</div>

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
				<div className="overflow-x-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100 h-full">
					<table className="table table-sm table-pin-rows table-pin-cols">
						{/* Headers */}
						<thead>
							<tr>
								{/* Title Header Cell */}
								{typeof title === "string" ? (
									<th className="px-3 py-2 z-40 bg-base-100">
										<div
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
											{orderBy.field === title ? (
												orderBy.order === "asc" ? (
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
												) : (
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
												)
											) : (
												<></>
											)}
										</div>

										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 16 16"
														fill="currentColor"
														className="h-4 w-4 opacity-70"
													>
														<path
															fillRule="evenodd"
															d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
															clipRule="evenodd"
														/>
													</svg>
													<input
														name={title}
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
									<th className="p-0 pr-2 z-40 bg-base-100">
										<div className="select-none mb-1">
											<span>{title.join(" / ")}</span>
										</div>
										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-sm flex items-center gap-2 w-full">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 16 16"
														fill="currentColor"
														className="h-4 w-4 opacity-70"
													>
														<path
															fillRule="evenodd"
															d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
															clipRule="evenodd"
														/>
													</svg>
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
										if (manyRelations.includes(head) || head in oneRelationsArrayTitle) {
											acc.push(
												<td key={head + i} className="bg-base-100">
													<div className="flex justify-between select-none mb-1">
														{head}
														{head in oneRelationsArrayTitle
															? " (" + oneRelationsArrayTitle[head as Prisma.ModelName].join(" / ") + ")"
															: ""}
													</div>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 16 16"
																	fill="currentColor"
																	className="h-4 w-4 opacity-70"
																>
																	<path
																		fillRule="evenodd"
																		d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
																		clipRule="evenodd"
																	/>
																</svg>
																<input type="text" className="grow" disabled />
															</label>
														)}
													</label>
												</td>
											);
										} else {
											acc.push(
												<td key={head + i} className="bg-base-100">
													<div
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
														{userDefinedHeaders.includes(head) && <sup>UD</sup>}
														{orderBy.field === head ? (
															orderBy.order === "asc" ? (
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
															) : (
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
															)
														) : (
															<></>
														)}
													</div>
													<label className="form-control w-full max-w-xs text-lg">
														{/* Value Filter */}
														{!hideFilters && (
															<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 16 16"
																	fill="currentColor"
																	className="h-4 w-4 opacity-70"
																>
																	<path
																		fillRule="evenodd"
																		d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
																		clipRule="evenodd"
																	/>
																</svg>
																<input
																	name={head}
																	defaultValue={whereFilter[head] || ""}
																	type="text"
																	className="grow"
																	disabled={userDefinedHeaders.includes(head)}
																	placeholder={userDefinedHeaders.includes(head) ? "" : "Press Enter to search"}
																/>
															</label>
														)}
													</label>
												</td>
											);
										}
									}

									return acc;
								}, [])}
								<th></th>
							</tr>
						</thead>
						<tbody>
							{/* Value Row */}
							{data.result &&
								data.result.map((row: Record<string, any>, i: number) => (
									<tr key={i} className="min-h-12 h-12 align-middle">
										{typeof title === "string" ? (
											<th
												className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2${
													i ? " border-t-2" : ""
												}`}
											>
												<Link href={`/explore/${table}/${row[title]}`} className="link link-primary link-hover">
													{row[title]}
												</Link>
											</th>
										) : (
											<th
												className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2${
													i ? " border-t-2" : ""
												}`}
											>
												<Link
													href={`/explore/${table}/${title.map((f) => row[f]).join("/")}`}
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
																className={`whitespace-nowrap text-sm border-base-300 border-l-2${
																	i ? " border-t-2" : ""
																}${row.Tags.length === 0 ? " bg-base-200" : ""}`}
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
																className={`whitespace-nowrap text-sm border-base-300 border-l-2${
																	i ? " border-t-2" : ""
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
																		</svg>{" "}
																		{row._count[head]}{" "}
																		{row._count[head] === 1
																			? capitalizeTable(depluralizeTable(head as Prisma.ModelName))
																			: head}
																	</Link>
																</div>
															</td>
														);
													}
												} else if (userDefinedHeaders.includes(head)) {
													acc.push(
														<td
															className={`whitespace-nowrap text-sm border-base-300 border-l-2${
																i ? " border-t-2" : ""
															}${row.userDefined[head] === null ? " bg-base-200" : ""}`}
															key={row.userDefined[head] + "child" + j}
														>
															{row.userDefined[head]}
														</td>
													);
												} else {
													let element;
													if (oneRelations.includes(head as Prisma.ModelName)) {
														element = (
															<Link
																href={`/explore/${
																	Object.entries(TableMetadata).find(([_, meta]) => meta.titleField === head)![0]
																}/${row[head]}`}
																className="link link-primary link-hover font-bold"
															>
																{row[head]}
															</Link>
														);
													} else if (head in oneRelationsArrayTitle) {
														const typedHead = head as Prisma.ModelName;
														element = (
															<Link
																href={`/explore/${uncapitalizeTable(typedHead)}/${oneRelationsArrayTitle[typedHead]
																	.map((f) => row[f])
																	.join("/")}`}
																className="link link-primary link-hover font-bold"
															>
																{oneRelationsArrayTitle[typedHead]
																	.map((f) => (row[f].length > 15 ? row[f].slice(0, 10) + "..." : row[f]))
																	.join(" / ")}
															</Link>
														);
													} else if (row[head] in DeadValueEnum && typeof row[head] === "number") {
														element = DeadValueEnum[row[head]];
													} else if (URL.canParse(row[head]) && row[head].startsWith("https://")) {
														element = (
															<Link href={row[head]} className="link link-primary link-hover">
																{row[head]}
															</Link>
														);
													} else {
														element = row[head];
													}

													acc.push(
														<td
															className={`whitespace-nowrap text-sm border-base-300 border-l-2${
																i ? " border-t-2" : ""
															}${row[head] === null ? " bg-base-200" : ""}`}
															key={row[head] + "child" + j}
														>
															{element}
														</td>
													);
												}
											}

											return acc;
										}, [])}
										<th className={`border-base-300 border-l-2${i ? " border-t-2" : ""}`}>
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
						handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
						handlePageHover={handlePageHover}
					/>
				</div>
			</form>
		</div>
	);
}
