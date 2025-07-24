"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { ParamsArray, ParamsArrayField, ParamsArrayRelation, QueryMode } from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, usePathname } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type FilterIds = Array<0 | 1 | FilterIds>;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [searchTable, setSearchTable] = useState("");
	const [filterIds, setFilterIds] = useState([] as FilterIds);
	const [paramsArray, setParamsArray] = useState([] as ParamsArray);
	const formRef = useRef<HTMLFormElement>(null);

	function scrollToResults() {
		//scroll search results into view
		const element = document.getElementById("searchResults");
		if (element) {
			element.scrollIntoView({
				block: "start",
				behavior: "smooth"
			});
		}
	}

	useEffect(() => {
		if (searchParams.get("advanced")) {
			scrollToResults();
		}
	}, [paramsArray]);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
				setSearchTable(searchParams.get("table") || "");
				const advanced = searchParams.get("advanced");
				if (advanced) {
					const advancedParsed = JSON.parse(advanced) as ParamsArray;
					setParamsArray(advancedParsed);

					//replace all values with ones
					function getFilterIds(e: ParamsArray[0]): FilterIds | 1 {
						if (typeof e[0] === "string") {
							return 1;
						} else {
							const paramsE = e as ParamsArray;
							return paramsE.map(getFilterIds);
						}
					}

					setFilterIds(advancedParsed.map(getFilterIds));
				}
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, [searchParams]);

	function getParamsArray(ids = filterIds, prevSuffix = "") {
		if (formRef.current)
			if (ids) {
				const parts = [] as ParamsArray;
				let i = 0;
				for (const id of ids) {
					if (id !== 0) {
						const suffix = `${prevSuffix && prevSuffix + "|"}${i}`;

						if (id === 1) {
							const type = formRef.current[`type_${suffix}`].value as "relation" | "field";
							const relation = type === "relation" ? formRef.current[`relation_${suffix}`].value : ("" as string);
							const field = formRef.current[`field_${suffix}`].value as string;
							const mode = formRef.current[`mode_${suffix}`].value as QueryMode;
							const filter = formRef.current[`filter_${suffix}`].value as string;
							const fieldType = formRef.current[`filter_${suffix}`].type;

							let arr = [field, mode, fieldType === "number" ? parseFloat(filter) : filter] as
								| ParamsArrayRelation
								| ParamsArrayField;
							if (relation) {
								arr = [relation, ...arr] as typeof arr;
							}

							parts.push(arr);
						} else {
							const recurs = getParamsArray(id, suffix);
							if (recurs) {
								parts.push(recurs);
							}
						}
					}

					i++;
				}

				return parts;
			}
	}

	//functions
	function handleSearch(clear = true, event?: FormEvent<HTMLFormElement>) {
		if (clear) {
			setSearchTable("");
			setFilterIds([]);
			setParamsArray([]);
			window.history.pushState(null, "", pathname);
		} else if (event) {
			event.preventDefault();

			const params = new URLSearchParams();
			params.set("table", searchTable);

			const advanced = getParamsArray();
			if (advanced && advanced.length) {
				params.set("advanced", JSON.stringify(advanced));
			}

			window.history.pushState(null, "", `${pathname}?${params.toString()}`);
			scrollToResults();
		}
	}

	return (
		<form ref={formRef} className="flex flex-col gap-6" onSubmit={(e) => handleSearch(false, e)}>
			<div className="grid grid-cols-[20%_60%_10%_10%] items-center">
				<div className="pr-3">
					<select
						value={searchTable}
						className="select"
						onChange={(e) => {
							setSearchTable(e.target.value);
							setFilterIds([]);
							setParamsArray([]);
						}}
						required
					>
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

				{searchTable && (
					<div className="text-2xl justify-self-center">
						Filtering{" "}
						<span className="text-primary">
							{TableMetadata[searchTable.toLowerCase() as Lowercase<Prisma.ModelName>].plural}
						</span>
					</div>
				)}

				<div className="col-3 px-3">
					<button className="btn btn-error" type="button" onClick={() => handleSearch()}>
						Clear
					</button>
				</div>
				<button className="btn btn-primary">Search</button>
			</div>

			{searchTable && (
				<div className="collapse collapse-arrow bg-base-100 border-t-2 rounded-none">
					<input type="checkbox" defaultChecked />
					<div className="collapse-title font-semibold text-xl text-primary">Filters</div>
					<div className="collapse-content text-sm overflow-x-auto overflow-hidden">
						<div className="grid grid-cols-[20%_20%_20%_35%_5%] text-center">
							<div>Type</div>
							<div>Relation</div>
							<div>Field</div>
							<div>Filter</div>
						</div>

						<FilterSection
							searchTable={searchTable}
							filterIds={filterIds}
							paramsArray={paramsArray}
							onChange={(prev) => setFilterIds(prev)}
						/>
					</div>
				</div>
			)}
		</form>
	);
}

//helper components
function FilterSection({
	searchTable,
	filterIds,
	paramsArray,
	onChange,
	prevSuffix = "",
	className,
	label
}: {
	searchTable: string;
	filterIds: FilterIds;
	paramsArray: ParamsArray;
	onChange: (prev: FilterIds) => FilterIds | void;
	prevSuffix?: string;
	className?: string;
	label?: string;
}) {
	return (
		<div className={`flex flex-col gap-5 ${className}`}>
			{filterIds.reduce((acc, id, i) => {
				if (id) {
					if (acc.length && label) {
						acc.push(label);
					}

					if (id === 1) {
						acc.push(
							<Filter
								key={i}
								nameSuffix={`${prevSuffix && prevSuffix + "|"}${i}`}
								searchTable={searchTable}
								onDelete={() => onChange(filterIds.toSpliced(i, 1, 0))}
								paramsArray={paramsArray && (paramsArray[i] as ParamsArrayRelation | ParamsArrayField)}
							/>
						);
					} else {
						acc.push(
							<div key={i} className="flex flex-col gap-5 border-2 border-warning rounded-lg p-3">
								<button
									className="btn btn-xs btn-warning rounded-lg aspect-square justify-self-center self-start pl-2 col-2"
									type="button"
									onClick={() => onChange(filterIds.toSpliced(i, 1, 0))}
								>
									X
								</button>

								<FilterSection
									searchTable={searchTable}
									filterIds={id}
									paramsArray={paramsArray && (paramsArray[i] as ParamsArray)}
									onChange={(prev) => onChange(filterIds.toSpliced(i, 1, prev))}
									prevSuffix={`${prevSuffix && prevSuffix + "|"}${i}`}
									label="OR"
								/>
							</div>
						);
					}
				}

				return acc;
			}, [] as ReactNode[])}

			<div className="flex gap-5">
				<button type="button" className="btn grow" onClick={() => onChange([...filterIds, 1])}>
					+ Add Filter
				</button>
				<button type="button" className="btn btn-warning" onClick={() => onChange([...filterIds, []])}>
					+ Add OR
				</button>
			</div>
		</div>
	);
}

function Filter({
	nameSuffix,
	paramsArray,
	searchTable,
	onDelete
}: {
	nameSuffix: string;
	paramsArray?: ParamsArrayRelation | ParamsArrayField;
	searchTable: string;
	onDelete: () => FilterIds | void;
}) {
	const [type, setType] = useState(paramsArray && paramsArray.length === 4 ? "relation" : "field");
	const [relation, setRelation] = useState(paramsArray && type === "relation" ? paramsArray[0] : "");
	const [field, setField] = useState(paramsArray ? (type === "relation" ? paramsArray[1] : paramsArray[0]) : "");

	const omit = [...GlobalOmit, "id"];

	const table = (relation ? relation.toLowerCase() : searchTable.toLowerCase()) as Lowercase<Prisma.ModelName>;

	return (
		<div className="grid grid-cols-[20%_20%_20%_35%_5%]">
			<div className="pr-2">
				<select
					className="select"
					value={type}
					onChange={(e) => {
						setType(e.target.value);
						setRelation("");
						setField("");
					}}
					required
					name={`type_${nameSuffix}`}
				>
					<option value="" disabled>
						Select Type
					</option>
					<option value="field">Field</option>
					<option value="relation">Relation</option>
				</select>
			</div>

			{type === "relation" && (
				<div className="px-2">
					<select
						className="select"
						value={relation}
						onChange={(e) => {
							setRelation(e.target.value);
							setField("");
						}}
						required
						name={`relation_${nameSuffix}`}
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

			{(type === "field" || relation) && (
				<div className="px-2 col-3">
					<select
						className="select"
						value={field}
						onChange={(e) => setField(e.target.value)}
						required
						name={`field_${nameSuffix}`}
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

			{!!field && (
				<InputElement
					nameSuffix={nameSuffix}
					table={table}
					field={field}
					defaultMode={paramsArray ? (type === "relation" ? `${paramsArray[2]}` : `${paramsArray[1]}`) : undefined}
					defaultValue={paramsArray ? (type === "relation" ? `${paramsArray[3]}` : `${paramsArray[2]}`) : undefined}
				/>
			)}

			<button
				className="btn btn-xs btn-error rounded-lg aspect-square justify-self-center self-center col-5 pl-2"
				type="button"
				onClick={onDelete}
			>
				X
			</button>
		</div>
	);
}

function InputElement({
	nameSuffix,
	table,
	field,
	defaultMode,
	defaultValue
}: {
	nameSuffix: string;
	table: Lowercase<Prisma.ModelName>;
	field: string;
	defaultMode?: string;
	defaultValue?: string;
}) {
	const shape = TableMetadata[table].schema.shape;
	if (!shape) return <></>;
	const type = getZodType(shape[field as keyof typeof shape]).type;
	if (!type) {
		throw new Error(
			`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
		);
	}

	//TODO: add support for querying ranges
	if (type === "integer" || type === "float" || type === "integer[]" || type === "float[]") {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<select className="select rounded-r-none" required name={`mode_${nameSuffix}`} defaultValue={defaultMode}>
					<option value="equals">Equals</option>
					<option value="gt">{">"}</option>
					<option value="gte">{">="}</option>
					<option value="lt">{"<"}</option>
					<option value="lte">{"<="}</option>
				</select>
				<input
					className="input input-primary w-full"
					placeholder="Filter..."
					name={`filter_${nameSuffix}`}
					defaultValue={defaultValue}
					type="number"
					required
				/>
			</div>
		);
	} else if (type === "date") {
		return (
			<div className="px-2">
				<input
					className="input input-primary w-full"
					placeholder="Filter..."
					name={`filter_${nameSuffix}`}
					defaultValue={defaultValue}
					type="date"
					required
				/>
			</div>
		);
	} else {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<select className="select rounded-r-none" required name={`mode_${nameSuffix}`} defaultValue={defaultMode}>
					<option value="contains">Contains</option>
					<option value="equals">Equals</option>
					<option value="startsWith">Starts With</option>
					<option value="endsWith">Ends With</option>
				</select>
				<input
					className="input input-primary w-full rounded-l-none"
					placeholder="Filter..."
					name={`filter_${nameSuffix}`}
					defaultValue={defaultValue}
					required
				/>
			</div>
		);
	}
}
