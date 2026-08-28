"use client";

import type { TableColumns } from "../hooks/useTableColumns";
import type { TableQuery } from "../hooks/useTableQuery";
import { DEFAULT_ORDER_BY } from "../Table";
import type { ReactNode } from "react";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import { capitalizeTable } from "@/app/helpers/utils";
import { ArrowIcon, SearchIcon } from "@/app/components/icons";

export default function TableHeader({
	table,
	headers,
	emptyFilter,
	hideFilters,
	userDefinedHeaders,
	title,
	headersFilter,
	manyRelations,
	oneRelationsWithArrayTitle,
	deepRelations,
	deepRelationsFilter,
	orderBy,
	whereFilter,
	setOrderBy
}: {
	table: Uncapitalize<ModelName>;
	headers: string[];
	emptyFilter: Record<string, true>;
	hideFilters?: boolean;
	userDefinedHeaders: string[];
	title: TableColumns["title"];
	headersFilter: TableColumns["defaultHeadersFilter"];
	manyRelations: TableColumns["manyRelations"];
	oneRelationsWithArrayTitle: TableColumns["oneRelationsWithArrayTitle"];
	deepRelations: TableColumns["deepRelations"];
	deepRelationsFilter: TableQuery["deepRelationsFilter"];
	orderBy: TableQuery["orderBy"];
	whereFilter: TableQuery["whereFilter"];
	setOrderBy: TableQuery["setOrderBy"];
}) {
	return (
		<tr>
			{typeof title === "string" ? (
				<th
					scope="col"
					aria-sort={orderBy.field === title ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"}
					className="px-3 py-2 z-40 bg-base-100"
				>
					<button
						className="cursor-pointer select-none flex justify-between mb-1 w-full"
						onClick={() =>
							orderBy.field === title
								? orderBy.order === "asc"
									? setOrderBy({ field: title, order: "desc" })
									: setOrderBy(DEFAULT_ORDER_BY)
								: setOrderBy({ field: title, order: "asc" })
						}
					>
						<span>{title}</span>
						{orderBy.field === title ? <ArrowIcon order={orderBy.order} /> : <></>}
					</button>

					<div className="form-control w-full max-w-xs text-lg">
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
					</div>
				</th>
			) : (
				<th className="px-3 py-2 z-40 bg-base-100 cursor-not-allowed">
					<div className="select-none mb-1">
						<div className="flex select-none mb-1">
							{capitalizeTable(table)}
							{" (" + title.join(" / ") + ")"}
						</div>
					</div>
					<div className="form-control w-full max-w-xs text-lg">
						{!hideFilters && (
							<label className="input input-bordered input-sm flex items-center gap-2 w-full">
								<SearchIcon />
								<input disabled type="text" className="grow" />
							</label>
						)}
					</div>
				</th>
			)}

			{headers.reduce((acc: ReactNode[], head, i) => {
				const deepRel = deepRelations.find((rel) => head === rel.label);

				//only render the header if it is selected in the header filter
				if (!headersFilter[head] && !emptyFilter[head]) {
					if (head in oneRelationsWithArrayTitle) {
						acc.push(
							<th key={head + i} className="bg-base-100 cursor-not-allowed">
								<div className="flex select-none mb-1">
									{head}
									{" (" + oneRelationsWithArrayTitle[head as ModelName].join(" / ") + ")"}
								</div>
								<div className="form-control w-full max-w-xs text-lg">
									{/* Value Filter */}
									{!hideFilters && (
										<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
											<SearchIcon />
											<input type="text" className="grow" disabled />
										</label>
									)}
								</div>
							</th>
						);
					} else if (manyRelations.includes(head)) {
						acc.push(
							<th
								key={head + i}
								scope="col"
								aria-sort={orderBy.field === head ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"}
								className="bg-base-100"
							>
								<button
									className="flex justify-between select-none mb-1 cursor-pointer w-full"
									onClick={() =>
										orderBy.field === head
											? orderBy.order === "asc"
												? setOrderBy({ field: head, order: "desc" })
												: setOrderBy(DEFAULT_ORDER_BY)
											: setOrderBy({ field: head, order: "asc" })
									}
								>
									{head}
									{orderBy.field === head ? <ArrowIcon order={orderBy.order} /> : <></>}
								</button>
								<div className="form-control w-full max-w-xs text-lg">
									{/* Value Filter */}
									{!hideFilters && (
										<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
											<SearchIcon />
											<input type="text" className="grow" disabled />
										</label>
									)}
								</div>
							</th>
						);
					} else if (deepRel) {
						if (!deepRelationsFilter[deepRel.label]) {
							acc.push(
								<th key={deepRel.label + i} className="bg-base-100 cursor-not-allowed">
									<div className="flex select-none mb-1">
										{deepRel.label}
										{deepRel.type === "table"
											? " (" + (TableMetadata[deepRel.table as ModelName].titleField as string[]).join(" / ") + ")"
											: ""}
									</div>
									<div className="form-control w-full max-w-xs text-lg">
										{/* Value Filter */}
										{!hideFilters && (
											<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
												<SearchIcon />
												<input type="text" className="grow" disabled />
											</label>
										)}
									</div>
								</th>
							);
						}
					} else if (userDefinedHeaders.includes(head)) {
						acc.push(
							<th key={head + i} className="bg-base-100 cursor-not-allowed">
								<div className="flex gap-1 select-none mb-1">
									{head}
									<sup className="text-xs">UD</sup>
								</div>
								<div className="form-control w-full max-w-xs text-lg">
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
								</div>
							</th>
						);
					} else {
						acc.push(
							<th
								key={head + i}
								scope="col"
								aria-sort={orderBy.field === head ? (orderBy.order === "asc" ? "ascending" : "descending") : "none"}
								className="bg-base-100"
							>
								<button
									className="flex justify-between select-none mb-1 cursor-pointer w-full"
									onClick={() =>
										orderBy.field === head
											? orderBy.order === "asc"
												? setOrderBy({ field: head, order: "desc" })
												: setOrderBy(DEFAULT_ORDER_BY)
											: setOrderBy({ field: head, order: "asc" })
									}
								>
									{head}
									{orderBy.field === head ? <ArrowIcon order={orderBy.order} /> : <></>}
								</button>
								<div className="form-control w-full max-w-xs text-lg">
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
								</div>
							</th>
						);
					}
				}

				return acc;
			}, [])}

			<th></th>
		</tr>
	);
}
