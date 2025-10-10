"use client";

import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import useSWR, { preload } from "swr";
import { useDebouncedCallback } from "use-debounce";
import { getZodType } from "../../helpers/schema";
import LoadingTable from "./LoadingTable";
import PaginationControls from "./PaginationControls";
import { NetworkPacket } from "@/types/globals";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetcher } from "@/app/helpers/utils";

//TODO: clamp table column width, add hover info to clamped columns
export default function Table({
	table,
	where,
	omit = [],
	hideFilters,
	hideEmptyAtStart,
	filterHeadersAtStart,
	defaultTake = 50,
	showUserDefined,
	ignoreParams
}: {
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, string | number>;
	omit?: string[];
	hideFilters?: boolean;
	hideEmptyAtStart?: boolean;
	filterHeadersAtStart?: boolean;
	defaultTake?: number;
	showUserDefined?: boolean;
	ignoreParams?: string[];
}) {
	const searchParams = useSearchParams();

	const [take, setTake] = useState(defaultTake);
	const [page, setPage] = useState(1);

	const [headers, setHeaders] = useState([] as string[]);
	const [userDefinedHeaders, setUserDefinedHeaders] = useState([] as string[]);

	const [whereFilter, setWhereFilter] = useState({} as Record<string, number | string>);
	const [hideEmpty, setHideEmpty] = useState(hideEmptyAtStart || false);
	const [emptyFilter, setEmptyFilter] = useState({} as Record<string, true>);
	const [headersFilter, setHeadersFilter] = useState({} as Record<string, true>);

	const [columnsFilter, setColumnsFilter] = useState("");
	const handleColFilter = useDebouncedCallback((f) => {
		setColumnsFilter(f);
	}, 300);

	const title = TableMetadata[table].titleField;

	//api call
	let query = new URLSearchParams({
		take: take.toString(),
		page: page.toString()
	});

	let whereQuery = {} as Record<string, string | number>;
	if (where) {
		whereQuery = { ...where };
	}
	if (Object.keys(whereFilter).length) {
		whereQuery = { ...whereQuery, ...whereFilter };
	}
	if (searchParams.size) {
		whereQuery = { ...whereQuery, ...Object.fromEntries(searchParams) };
		if (ignoreParams) {
			for (const param of ignoreParams) {
				delete whereQuery[param];
			}
		}
	}

	if (Object.keys(whereQuery).length) {
		query.set("where", JSON.stringify(whereQuery));
	}

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/pagination/${table}?${query.toString()}`,
		fetcher
	);

	useEffect(() => {
		if (data && data.statusMessage === "success") {
			if (hideEmpty) {
				const emptyFields = {} as Record<string, true>;
				const exemptFields = {} as Record<string, true>;

				for (let row of data.result) {
					for (let [field, value] of Object.entries(row)) {
						if (value === null && !exemptFields[field]) {
							emptyFields[field] = true;
						} else if (emptyFields[field]) {
							delete emptyFields[field];
							exemptFields[field] = true;
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
		if (!Object.keys(headersFilter).length) {
			let tempHeaders = [];
			if (TableMetadata[table].fieldOrder) {
				tempHeaders.push(...TableMetadata[table].fieldOrder);
			}
			tempHeaders.push(
				...TableMetadata[table].enumSchema.options.reduce((acc: string[], head) => {
					//remove fields that have already been added
					if (TableMetadata[table].fieldOrder?.includes(head)) {
						return acc;
					}

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
					if (omit.includes(head)) {
						return acc;
					}

					if (head !== "userDefined") {
						acc.push(head);
					}

					return acc;
				}, [])
			);

			let tempHeadersFilter = {} as Record<string, true>;
			if (filterHeadersAtStart && TableMetadata[table].subFields) {
				const temp = {} as Record<string, true>;
				for (const head of tempHeaders) {
					if (!TableMetadata[table].subFields.includes(head)) {
						temp[head] = true;
					}
				}
				tempHeadersFilter = temp;
			}

			if (showUserDefined && data && data.statusMessage === "success" && !userDefinedHeaders.length) {
				const tempUserDefinedHeadersSet = new Set() as Set<string>;
				for (const r of data.result) {
					for (const h in r.userDefined) {
						tempUserDefinedHeadersSet.add(h);
					}
				}
				const tempUserDefinedHeaders = Array.from(tempUserDefinedHeadersSet);

				tempHeaders = [...tempHeaders, ...tempUserDefinedHeaders];
				setUserDefinedHeaders(Array.from(tempUserDefinedHeaders));

				if (filterHeadersAtStart) {
					tempHeadersFilter = {
						...tempHeadersFilter,
						...tempUserDefinedHeaders.reduce((acc, head) => ({ ...acc, [head]: true }), {} as Record<string, true>)
					};
				}
			}

			setHeaders(tempHeaders);

			if (Object.keys(tempHeadersFilter).length) {
				setHeadersFilter(tempHeadersFilter);
			}
		}
	}, [data]);

	if (isLoading) return <LoadingTable take={take} page={page} />;
	if (error) return <div>failed to load: {error}</div>;
	if (data.statusMessage === "error") return <div>failed to load: {data.error}</div>;

	omit = [...omit, ...GlobalOmit];

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

		preload(`/api/pagination/${table}?${query.toString()}`, fetcher);
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
	}

	return (
		<div className="bg-base-100 border-base-300 rounded-box p-6 h-full w-full">
			<form id={`${table}TableForm`} onSubmit={applyFilters} className="w-full h-full flex flex-col">
				<div className="grid grid-cols-3 justify-items-center">
					{/* Filters Buttons */}
					<div className="flex items-center gap-5">
						{!hideFilters && (
							<>
								<button onClick={resetForm} className="btn btn-sm btn-error" type="button">
									Clear Filters
								</button>
								<button type="submit" className="btn btn-sm btn-primary">
									Apply Filters
								</button>
							</>
						)}
						<label className="input input-sm input-bordered flex items-center gap-2">
							Per Page:
							<input name="take" defaultValue={take} type="number" className="grow max-w-12" />
						</label>
					</div>
					{/* Pagination Controls */}
					<PaginationControls
						page={page}
						take={take}
						count={data.count}
						handlePage={(dir?: number) => setPage(dir ? page + dir : page + 1)}
						handlePageHover={handlePageHover}
					/>
					{/* Column Selection Button */}
					<div className="grid grid-cols-2 w-full gap-5">
						<div className="dropdown dropdown-end justify-self-end">
							<div tabIndex={0} role="button" className="btn btn-sm">
								{headers.length - Object.keys(headersFilter).length}/{headers.length} Columns
							</div>
							{/* Dropdown */}
							<div
								tabIndex={0}
								className="dropdown-content menu bg-base-300 rounded-box z-50 w-52 shadow p-0 text-xs min-w-min"
							>
								{/* Header Name Filter Section */}
								<div className="form-control flex-row items-center w-full border-b-2 p-2 pb-0">
									<label className="label cursor-pointer justify-start">
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
										<span className="label-text pl-2">All</span>
									</label>
									<input
										type="text"
										onChange={(e) => handleColFilter(e.target.value)}
										placeholder="Filter"
										className="input input-bordered input-xs w-full max-w-xs ml-2 mb-1"
									/>
								</div>
								{/* Header Names Section */}
								<ul className="p-2 pt-0 w-full max-h-[200px] overflow-y-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-300">
									{headers.reduce((acc: ReactNode[], head, i) => {
										//only render the header name if it is selected in the header name filter
										if (head.toLowerCase().includes(columnsFilter.toLowerCase())) {
											//Header Name
											acc.push(
												<li key={head + "_dropdown" + i} className="form-control">
													<label className="label cursor-pointer justify-start p-1">
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
														<span className="label-text pl-2">{head}</span>
													</label>
												</li>
											);
										}

										return acc;
									}, [])}
								</ul>
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
								Hide empty columns {Object.keys(emptyFilter).length ? "(" + Object.keys(emptyFilter).length + ")" : ""}
							</label>
						</fieldset>
					</div>
				</div>
				<div className="overflow-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100 h-full">
					<table className="table table-xs table-pin-rows table-pin-cols">
						{/* Headers */}
						<thead>
							<tr>
								{/* Title Header Cell */}
								{typeof title === "string" ? (
									<th className="p-0 pr-2 z-40">
										<label className="form-control w-full max-w-xs text-lg">
											<div>
												<span>{title}</span>
											</div>
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-xs flex items-center gap-2 w-full">
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
													<input name={title} defaultValue={whereFilter[title] || ""} type="text" className="grow" />
												</label>
											)}
										</label>
									</th>
								) : (
									<th className="p-0 pr-2 z-40">
										<label className="form-control w-full max-w-xs text-lg">
											<div>
												<span>{title.join(" / ")}</span>
											</div>
											{/* Value Filter */}
											{!hideFilters && (
												<label className="input input-bordered input-xs flex items-center gap-2 w-full">
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
										acc.push(
											<td key={head + i}>
												<label className="form-control w-full max-w-xs text-lg">
													<div className="flex justify-between">
														<div>{head}</div>
														{userDefinedHeaders.includes(head) && (
															<>
																<div className="px-1">🠢</div>
																<div>User Defined</div>
															</>
														)}
													</div>
													{/* Value Filter */}
													{!hideFilters && (
														<label className="input input-bordered input-xs flex items-center gap-2 w-full">
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
															/>
														</label>
													)}
												</label>
											</td>
										);
									}

									return acc;
								}, [])}
								<th></th>
							</tr>
						</thead>
						<tbody>
							{/* Value Row */}
							{data.result &&
								data.result.reduce((acc: ReactNode[], row: Record<string, any>, i: number) => {
									//row
									acc.push(
										<tr key={i} className="border-base-100 border-b-2">
											{typeof title === "string" ? (
												<th className="whitespace-nowrap text-sm">
													<Link href={`/explore/${table}/${row[title]}`} className="link link-primary link-hover">
														{row[title]}
													</Link>
												</th>
											) : (
												<th className="whitespace-nowrap text-sm">
													<Link
														href={`/explore/${table}/${title.map((f) => row[f]).join("/")}`}
														className="link link-primary link-hover"
													>
														{title.map((f) => row[f]).join(" / ")}
													</Link>
												</th>
											)}

											{headers.reduce((acc: ReactNode[], head, j) => {
												if (!headersFilter[head] && !emptyFilter[head]) {
													//cell
													if (userDefinedHeaders.includes(head)) {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm ${j ? "border-base-100 border-l-2" : ""} ${
																	row.userDefined[head] !== null ? "" : "bg-base-300"
																}`}
																key={row.userDefined[head] + "child" + j}
															>
																{row.userDefined[head]}
															</td>
														);
													} else {
														acc.push(
															<td
																className={`whitespace-nowrap text-sm ${j ? "border-base-100 border-l-2" : ""} ${
																	row[head] !== null ? "" : "bg-base-300"
																}`}
																key={row[head] + "child" + j}
															>
																{row[head] in DeadValueEnum && typeof row[head] === "number" ? (
																	DeadValueEnum[row[head]]
																) : head in TableMetadata[table].relationFields ? (
																	<Link
																		href={`/explore/${TableMetadata[table].relationFields[head]}/${row[head]}`}
																		className="link link-primary link-hover"
																	>
																		{row[head]}
																	</Link>
																) : (
																	row[head]
																)}
															</td>
														);
													}
												}

												return acc;
											}, [])}
											<th>{i + 1 + (page - 1) * take}</th>
										</tr>
									);

									return acc;
								}, [])}
						</tbody>
					</table>
				</div>
			</form>
		</div>
	);
}
