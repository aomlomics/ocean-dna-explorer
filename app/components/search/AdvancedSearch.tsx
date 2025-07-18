"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";

type FilterIds = Array<0 | 1 | FilterIds>;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [searchTable, setSearchTable] = useState("");
	const [filterIds, setFilterIds] = useState([] as FilterIds);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
				const params = new URLSearchParams(searchParams);

				setSearchTable(searchParams.get("table") || "");
				params.delete("table");

				function parseFilterIds(ids: number[], listToFill: FilterIds) {
					const i = ids[0];
					if (ids.length === 1) {
						listToFill[i] = 1;
					} else {
						if (!listToFill[i]) {
							listToFill[i] = [] as FilterIds;
						}
						parseFilterIds(ids.slice(1), listToFill[i] as FilterIds);
					}
				}

				const newFilterIds = [] as FilterIds;
				for (const id of params.keys()) {
					parseFilterIds(
						id.split("|").map((k2) => parseInt(k2)),
						newFilterIds
					);
				}

				setFilterIds(newFilterIds);
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, []);

	useEffect(() => {
		setSearchTable(searchParams.get("table") || "");
	}, [searchParams]);

	//functions
	function handleSearch(clear = true, event?: FormEvent<HTMLFormElement>) {
		if (clear) {
			setSearchTable("");
			setFilterIds([1]);
			router.replace(pathname);
		} else if (event) {
			event.preventDefault();

			const params = new URLSearchParams();
			params.set("table", searchTable);

			function setParams(target: HTMLFormElement, ids: FilterIds, prevSuffix = "", prevParamsKey = "") {
				if (ids) {
					let i = 0;
					let paramsI = 0;
					for (const id of ids) {
						if (id !== 0) {
							const suffix = `${prevSuffix && prevSuffix + "|"}${i}`;
							const paramsKey = `${prevParamsKey && prevParamsKey + "|"}${paramsI}`;

							if (id === 1) {
								const type = target[`type_${suffix}`].value;
								const relation = type === "relation" ? target[`relation_${suffix}`].value : "";
								const field = target[`field_${suffix}`].value;
								const filter = target[`filter_${suffix}`].value;

								params.set(paramsKey, `${type},${relation},${field},${filter}`);
							} else {
								setParams(target, id, suffix, paramsKey);
							}

							paramsI++;
						}

						i++;
					}
				}
			}

			setParams(event.currentTarget, filterIds);

			window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
		}
	}

	return (
		<form className="flex flex-col gap-5" onSubmit={(e) => handleSearch(false, e)}>
			<div className="grid grid-cols-[20%_60%_10%_10%]">
				<div className="px-2">
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
					<div className="grid grid-cols-[20%_20%_20%_35%_5%] text-center">
						<div>Type</div>
						<div>Relation</div>
						<div>Field</div>
						<div>Filter</div>
					</div>

					<FilterSection searchTable={searchTable} filterIds={filterIds} onChange={(prev) => setFilterIds(prev)} />
				</>
			)}
		</form>
	);
}

//helper components
function FilterSection({
	searchTable,
	filterIds,
	onChange,
	prevSuffix = "",
	className,
	label
}: {
	searchTable: string;
	filterIds: FilterIds;
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
	searchTable,
	onDelete
}: {
	nameSuffix: string;
	searchTable: string;
	onDelete: () => FilterIds | void;
}) {
	const searchParams = useSearchParams();

	const urlFilter = searchParams.get(nameSuffix)?.split(",");
	const [type, setType] = useState(urlFilter ? urlFilter[0] : "field");
	const [relation, setRelation] = useState(urlFilter ? urlFilter[1] : "");
	const [field, setField] = useState(urlFilter ? urlFilter[2] : "");

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

			{!!field && <InputElement nameSuffix={nameSuffix} table={table} field={field} />}

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
	field
}: {
	nameSuffix: string;
	table: Lowercase<Prisma.ModelName>;
	field: string;
}) {
	const searchParams = useSearchParams();
	const urlFilter = searchParams.get(nameSuffix)?.split(",");
	const [value, setValue] = useState(urlFilter ? urlFilter[3] : "");

	const shape = TableMetadata[table].schema.shape;
	const type = getZodType(shape[field as keyof typeof shape]).type;
	if (!type) {
		throw new Error(
			`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
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
		<div className="px-2">
			<input
				className="input input-primary w-full"
				placeholder="Filter..."
				name={`filter_${nameSuffix}`}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				type={inputType}
				step={step}
				required
			/>
		</div>
	);
}
