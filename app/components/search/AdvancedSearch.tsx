"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useReducer, useState } from "react";

type FilterElement = {
	type: string;
	relation?: string;
	field: string;
};

type FilterUpdate =
	| { fill: true; data: (FilterElement | undefined)[] }
	| { i: number; clear: true; fill?: undefined }
	| { clear?: undefined; new: true; fill?: undefined }
	| {
			i: number;
			key: "type" | "relation" | "field";
			value: string;
			clear?: undefined;
			new?: undefined;
			fill?: undefined;
	  }
	| null;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [searchTable, setSearchTable] = useState("");
	const [filters, setFilters] = useReducer(
		(state: (FilterElement | undefined)[], update: FilterUpdate) => {
			if (update) {
				if (update.fill) {
					return update.data;
				} else if (update.clear) {
					return state.toSpliced(update.i, 1, undefined);
				} else if (update.new) {
					return [...state, { type: "field", field: "", filter: "" }];
				} else {
					if (update.key === "type") {
						if (update.value === "relation") {
							return state.toSpliced(update.i, 1, { type: update.value, relation: "", field: "" });
						} else {
							return state.toSpliced(update.i, 1, { type: update.value, field: "" });
						}
					} else if (update.key === "relation") {
						return state.toSpliced(update.i, 1, { type: state[update.i]!.type, relation: update.value, field: "" });
					} else {
						return state.toSpliced(update.i, 1, {
							relation: state[update.i]!.relation,
							type: state[update.i]!.type,
							field: update.value
						});
					}
				}
			} else {
				return [{ type: "field", field: "", filter: "" }];
			}
		},
		[{ type: "field", field: "", filter: "" }]
	);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
				const params = new URLSearchParams(searchParams);
				params.delete("table");

				const data = [] as (FilterElement | undefined)[];
				for (const [type, value] of params.entries()) {
					const split = value.split(",");
					data[parseInt(split[0])] = {
						type: type,
						relation: type === "relation" ? split[1] : undefined,
						field: type === "relation" ? split[2] : split[1]
					};
				}

				setFilters({ fill: true, data });
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, []);

	useEffect(() => {
		setSearchTable(searchParams.get("table") || "");
	}, [searchParams]);

	const omit = [...GlobalOmit, "id"];

	//functions
	function handleSearch(clear = true, event?: FormEvent<HTMLFormElement>) {
		if (clear) {
			// setFilters(null);
			router.replace(pathname);
		} else if (event) {
			event.preventDefault();

			const params = new URLSearchParams();
			params.set("table", searchTable);

			let i = 0;
			for (const f of filters) {
				if (f) {
					const filter = f as FilterElement;
					if (filter.type === "relation") {
						params.append(
							"relation",
							`${i},${filter.relation},${filter.field},${event.currentTarget["filter" + i].value}`
						);
					} else {
						params.append("field", `${i},${filter.field},${event.currentTarget["filter" + i].value}`);
					}
				}

				i++;
			}

			window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
		}
	}

	//helper components
	function Filter({ i }: { i: number }) {
		if (!filters[i]) {
			return <></>;
		}

		const filter = filters[i] as FilterElement;
		const param = searchParams
			.getAll(filter.type)
			.find((f) => parseInt(f.split(",")[0]) === i)
			?.split(",");
		const table = (
			filter.relation ? filter.relation.toLowerCase() : searchTable.toLowerCase()
		) as Lowercase<Prisma.ModelName>;

		function InputElement() {
			const shape = TableMetadata[table].schema.shape;
			const type = getZodType(shape[filter.field as keyof typeof shape]).type;
			if (!type) {
				throw new Error(
					`Could not find type of '${filter.field}'. Make sure a field named '${filter.field}' exists on table named '${table}'.`
				);
			}

			let inputType = "text";
			let step = undefined;
			//TODO: add support for querying ranges
			if (type === "integer" || type === "float" || type === "integer[]" || type === "float[]") {
				inputType = "number";
				step = "any;";
			} else if (type === "date") {
				inputType = "date";
			}

			return (
				<input
					className="input input-primary rounded-l-none col-4"
					placeholder="Filter..."
					name={`filter${i}`}
					defaultValue={param && param[param.length - 1]}
					type={inputType}
					step={step}
					required
				/>
			);
		}

		return (
			<div className="grid grid-cols-[20%_20%_20%_35%_5%]">
				<div className="pr-3">
					<select
						className="select"
						value={filter.type}
						onChange={(e) => setFilters({ i, key: "type", value: e.target.value })}
						required
					>
						<option value="" disabled>
							Select Type
						</option>
						<option value="field">Field</option>
						<option value="relation">Relation</option>
					</select>
				</div>

				{filter.type === "relation" && (
					<div className="pr-3">
						<select
							className="select"
							value={filter.relation}
							onChange={(e) => setFilters({ i, key: "relation", value: e.target.value })}
							required
						>
							<option value="" disabled>
								Select Relation
							</option>
							{Object.keys(Prisma.ModelName)
								.sort()
								.reduce((acc, table) => {
									if (table !== searchTable) {
										acc.push(
											<option key={table} value={table}>
												{table}
											</option>
										);
									}

									return acc;
								}, [] as ReactNode[])}
						</select>
					</div>
				)}

				{(filter.type === "field" || filter.relation) && (
					<div className="pr-3">
						<select
							className="select"
							value={filter.field}
							onChange={(e) => setFilters({ i, key: "field", value: e.target.value })}
							required
						>
							<option value="" disabled>
								Select Field
							</option>
							{TableMetadata[table].enumSchema._def.values.reduce((acc, val) => {
								if (!omit.includes(val)) {
									acc.push(
										<option key={val} value={val}>
											{val}
										</option>
									);
								}

								return acc;
							}, [] as ReactNode[])}
						</select>
					</div>
				)}

				{!!filter.field && <InputElement />}

				{filters.filter((f) => !!f).length > 1 && (
					<button
						className="btn btn-xs btn-error rounded-lg col-5 aspect-square justify-self-center self-center"
						type="button"
						onClick={() => setFilters({ i, clear: true })}
					>
						X
					</button>
				)}
			</div>
		);
	}

	return (
		<form className="flex flex-col gap-5" onSubmit={(e) => handleSearch(false, e)}>
			<div className="grid grid-cols-[20%_60%_10%_10%]">
				<div className="pr-3">
					<select value={searchTable} className="select" onChange={(e) => setSearchTable(e.target.value)} required>
						<option disabled value="">
							Select table
						</option>
						{Object.keys(Prisma.ModelName)
							.sort()
							.map((table) => (
								<option key={table} value={table}>
									{table}
								</option>
							))}
					</select>
				</div>
				<div className="col-3 px-3">
					<button className="btn btn-error" type="button" onClick={() => handleSearch()}>
						Clear
					</button>
				</div>
				<button className="btn btn-primary">Search</button>
			</div>

			{searchTable && (
				<>
					<h2 className="text-primary text-xl">Filters</h2>
					{filters.map((f, i) => (
						<Filter key={i} i={i} />
					))}
					<button type="button" className="btn" onClick={() => setFilters({ new: true })}>
						+ Add Filter
					</button>
				</>
			)}
		</form>
	);
}
