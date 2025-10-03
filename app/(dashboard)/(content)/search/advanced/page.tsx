"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/schema";
import { ParamsArray, ParamsArrayField, ParamsArrayRelation, QueryMode } from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import Map from "@/app/components/map/Map";
import { uncapitalizeTable } from "@/app/helpers/utils";

type FilterIds = Array<0 | 1 | FilterIds>;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [searchTable, setSearchTable] = useState("" as Prisma.ModelName | "");
	const [filterIds, setFilterIds] = useState([] as FilterIds);
	const [paramsArray, setParamsArray] = useState([] as ParamsArray);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
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

				setSearchTable((searchParams.get("table") as Prisma.ModelName) || "");
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, [searchParams]);

	useEffect(() => {
		if (searchTable) {
			search();
		}
	}, [searchTable]);

	//functions
	function getParamsArray(ids = filterIds, prevSuffix = "") {
		if (formRef.current && ids && searchTable) {
			const parts = [] as ParamsArray;
			let i = 0;
			for (const id of ids) {
				if (id !== 0) {
					const suffix = `${prevSuffix && prevSuffix + "|"}${i}`;

					if (id === 1) {
						if (formRef.current[`type_${suffix}`]) {
							const type = formRef.current[`type_${suffix}`].value as "relation" | "field";
							const relation = type === "relation" ? formRef.current[`relation_${suffix}`].value : ("" as string);

							const table = (relation ? relation : searchTable) as Prisma.ModelName;
							const field = formRef.current[`field_${suffix}`].value as string;
							const shape = TableMetadata[table].schema.shape;
							const fieldType = getZodType(shape[field as keyof typeof shape]).type;

							const mode = formRef.current[`mode_${suffix}`].value as QueryMode;
							let filter = undefined as unknown as string | number | [number, number] | [string, string];

							if (fieldType === "date") {
								if (mode === "range") {
									const gteDate = formRef.current[`filter_${suffix}_gte_date`].value;
									const gteTime = formRef.current[`filter_${suffix}_gte_time`].value;
									const lteDate = formRef.current[`filter_${suffix}_lte_date`].value;
									const lteTime = formRef.current[`filter_${suffix}_lte_time`].value;

									filter = [gteDate + (gteTime ? "T" + gteTime : ""), lteDate + (lteTime ? "T" + lteTime : "")];
								} else {
									const filterDate = formRef.current[`filter_${suffix}_date`].value;
									const filterTime = formRef.current[`filter_${suffix}_time`].value;

									filter = filterDate + (filterTime ? "T" + filterTime : "");
								}
							} else {
								if (mode === "range") {
									const gte = formRef.current[`filter_${suffix}_gte`].value;
									const lte = formRef.current[`filter_${suffix}_lte`].value;
									if (fieldType === "integer") {
										filter = [parseInt(gte), parseInt(lte)];
									} else if (fieldType === "float") {
										filter = [parseFloat(gte), parseFloat(lte)];
									}
								} else {
									const filterVal = formRef.current[`filter_${suffix}`].value;

									if (fieldType === "integer") {
										filter = parseInt(filterVal);
									} else if (fieldType === "float") {
										filter = parseFloat(filterVal);
									} else {
										filter = filterVal;
									}
								}
							}

							let arr = [field, mode, filter] as ParamsArrayRelation | ParamsArrayField;
							if (relation) {
								arr = [relation, ...arr] as typeof arr;
							}

							parts.push(arr);
						}
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

	function reset() {
		setSearchTable("");
		setFilterIds([]);
		setParamsArray([]);
		window.history.pushState(null, "", pathname);
	}

	function search() {
		const params = new URLSearchParams();
		params.set("table", searchTable);

		const advanced = getParamsArray();
		if (advanced && advanced.length) {
			params.set("advanced", JSON.stringify(advanced));
		}

		window.history.pushState(null, "", `${pathname}?${params.toString()}`);
	}

	return (
		<form
			ref={formRef}
			className="flex flex-col gap-6"
			onSubmit={(e) => {
				e.preventDefault();
				search();
			}}
		>
			<div className="grid grid-cols-[20%_60%_10%_10%] items-center">
				<div className="pr-3">
					<select
						value={searchTable}
						className="select"
						onChange={(e) => {
							setSearchTable(e.target.value as Prisma.ModelName);
							setFilterIds([]);
							setParamsArray([]);
						}}
						required
					>
						<option disabled value="">
							Select Table
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
						Filtering <span className="text-primary">{TableMetadata[searchTable].plural}</span>
					</div>
				)}

				<div className="col-3 px-3">
					<button className="btn btn-error" type="button" onClick={() => reset()}>
						Clear
					</button>
				</div>
				<button className="btn btn-primary">Search</button>
			</div>

			{searchTable && (
				<>
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
					<div className="collapse collapse-arrow bg-base-100 border-t-2 rounded-none">
						<input type="checkbox" />
						<div className="collapse-title font-semibold text-xl text-primary">Show on Map</div>
						<div className="collapse-content text-sm overflow-x-auto overflow-hidden">
							<Map
								locations={[] as any[]}
								titleTable={uncapitalizeTable(searchTable)}
								title={
									typeof TableMetadata[searchTable].titleField === "string"
										? (TableMetadata[searchTable].titleField as string)
										: (TableMetadata[searchTable].titleField as string[]).join(" | ")
								}
							/>
						</div>
					</div>
				</>
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
						acc.push(
							<div key={`${i}_label`} className="flex items-center">
								<hr className="grow border-warning mx-3"></hr>
								<div>{label}</div>
								<hr className="grow border-warning mx-3"></hr>
							</div>
						);
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
	const paramsOffset = type === "relation" ? 1 : 0;
	const [relation, setRelation] = useState(
		(paramsArray && type === "relation" ? paramsArray[0] : "") as Prisma.ModelName | ""
	);
	const [field, setField] = useState(paramsArray ? (paramsArray[0 + paramsOffset] as string) : "");
	const [loaded, setLoaded] = useState(false);

	const table = relation ? relation : (searchTable as Prisma.ModelName);
	const invalidField =
		paramsArray && !TableMetadata[table].enumSchema.options.includes(paramsArray[0 + paramsOffset] as string);

	useEffect(() => {
		if (invalidField) {
			onDelete();
		} else {
			setLoaded(true);
		}
	}, []);

	if (invalidField && !loaded) {
		return <></>;
	}

	const omit = [...GlobalOmit, "id"];

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
							setRelation(e.target.value as Prisma.ModelName);
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
						{TableMetadata[table].enumSchema.options.reduce((acc, val) => {
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
					defaultMode={paramsArray ? `${paramsArray[1 + paramsOffset]}` : ""}
					defaultValue={paramsArray ? `${paramsArray[2 + paramsOffset]}` : ""}
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
	table: Prisma.ModelName;
	field: string;
	defaultMode: string;
	defaultValue: string;
}) {
	const [gteDateSelected, setGteDateSelected] = useState(
		defaultValue.split(",").length === 2 && !!defaultValue.split(",")[0].split("T")[0]
	);
	const [lteDateSelected, setLteDateSelected] = useState(
		defaultValue.split(",").length === 2 && !!defaultValue.split(",")[1].split("T")[0]
	);

	const shape = TableMetadata[table].schema.shape;
	const type = getZodType(shape[field as keyof typeof shape]).type;

	const [mode, setMode] = useState(
		defaultMode ? defaultMode : type === "integer" || type === "float" || type === "date" ? "equals" : "contains"
	);

	//TODO: add support for querying ranges
	if (type === "integer" || type === "float") {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<select
					className="select rounded-r-none"
					required
					name={`mode_${nameSuffix}`}
					value={mode}
					onChange={(e) => setMode(e.target.value)}
				>
					<option value="equals">Equals</option>
					<option value="range">Range</option>
					<option value="gt">{">"}</option>
					<option value="gte">{">="}</option>
					<option value="lt">{"<"}</option>
					<option value="lte">{"<="}</option>
				</select>
				{mode === "range" ? (
					<div className="grid grid-cols-[45%_10%_45%] items-center justify-items-center">
						<input
							className="input input-primary w-full rounded-none"
							placeholder="Lower bound"
							name={`filter_${nameSuffix}_gte`}
							defaultValue={
								defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[0] : undefined
							}
							type="number"
							required
						/>
						<span className="text-4xl text-primary">-</span>
						<input
							className="input input-primary w-full rounded-l-none"
							placeholder="Upper bound"
							name={`filter_${nameSuffix}_lte`}
							defaultValue={
								defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[1] : undefined
							}
							type="number"
							required
						/>
					</div>
				) : (
					<input
						className="input input-primary w-full rounded-l-none"
						placeholder="Filter..."
						name={`filter_${nameSuffix}`}
						defaultValue={defaultValue && defaultValue.split(",").length === 1 ? defaultValue : undefined}
						type="number"
						required
					/>
				)}
			</div>
		);
	} else if (type === "date") {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<select
					className="select rounded-r-none"
					required
					name={`mode_${nameSuffix}`}
					value={mode}
					onChange={(e) => setMode(e.target.value)}
				>
					<option value="equals">Equals</option>
					<option value="range">Range</option>
					<option value="gt">{">"}</option>
					<option value="gte">{">="}</option>
					<option value="lt">{"<"}</option>
					<option value="lte">{"<="}</option>
				</select>
				{mode === "range" ? (
					<div className="grid grid-cols-[45%_10%_45%] items-center justify-items-center">
						<div className="input input-primary w-full rounded-none">
							<input
								name={`filter_${nameSuffix}_gte_date`}
								className={`w-[20px] ${gteDateSelected ? "text-success" : "text-error"}`}
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2
										? defaultValue.split(",")[0].split("T")[0]
										: undefined
								}
								onChange={(e) => setGteDateSelected(!!e.target.value)}
								type="date"
								required
							/>
							<input
								type="time"
								className="text-center"
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2
										? defaultValue.split(",")[0].split("T")[1]
										: undefined
								}
								name={`filter_${nameSuffix}_gte_time`}
							/>
						</div>
						<span className="text-4xl text-primary">-</span>
						<div className="input input-primary w-full rounded-l-none">
							<input
								name={`filter_${nameSuffix}_lte_date`}
								className={`w-[20px] ${lteDateSelected ? "text-success" : "text-error"}`}
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2
										? defaultValue.split(",")[1].split("T")[0]
										: undefined
								}
								onChange={(e) => setLteDateSelected(!!e.target.value)}
								type="date"
								required
							/>
							<input
								type="time"
								className="text-center"
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2
										? defaultValue.split(",")[1].split("T")[1]
										: undefined
								}
								name={`filter_${nameSuffix}_lte_time`}
							/>
						</div>
					</div>
				) : (
					<div className="input input-primary w-full">
						<input
							name={`filter_${nameSuffix}_date`}
							className="w-1/2"
							defaultValue={
								defaultValue && defaultValue.split(",").length === 1 ? defaultValue.split("T")[0] : undefined
							}
							type="date"
							required
						/>
						<input
							type="time"
							className="text-center w-1/2"
							defaultValue={
								defaultValue && defaultValue.split(",").length === 1 ? defaultValue.split("T")[1] : undefined
							}
							name={`filter_${nameSuffix}_time`}
						/>
					</div>
				)}
			</div>
		);
	} else {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<select
					className="select rounded-r-none"
					required
					name={`mode_${nameSuffix}`}
					value={mode}
					onChange={(e) => setMode(e.target.value)}
				>
					<option value="contains">Contains</option>
					<option value="equals">Equals</option>
					<option value="startsWith">Starts With</option>
					<option value="endsWith">Ends With</option>
				</select>
				<input
					className="input input-primary w-full rounded-l-none"
					placeholder="Filter..."
					name={`filter_${nameSuffix}`}
					defaultValue={defaultValue === "undefined" ? undefined : defaultValue}
					required
				/>
			</div>
		);
	}
}
