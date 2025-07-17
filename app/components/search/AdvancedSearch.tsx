"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useState } from "react";

type FilterIds = Array<0 | 1 | FilterIds>;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [searchTable, setSearchTable] = useState("");
	const [filterIds, setFilterIds] = useState([1] as FilterIds);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
				const params = new URLSearchParams(searchParams);

				setSearchTable(searchParams.get("table") || "");
				params.delete("table");

				const temp = [] as FilterIds;
				for (const key of params.keys()) {
					const prefixes = key.split("|");
					if (prefixes.length === 1) {
						temp[parseInt(prefixes[0])] = 1;
					} else {
						//TODO: recursively index
					}
				}
				setFilterIds(temp);
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

			let i = 0;
			let paramsI = 0;
			for (const id of filterIds) {
				if (id !== 0) {
					if (id === 1) {
						const type = event.currentTarget[`type_${i}`].value;
						const relation = type === "relation" ? event.currentTarget[`relation_${i}`].value : "";
						const field = event.currentTarget[`field_${i}`].value;
						const filter = event.currentTarget[`filter_${i}`].value;

						params.set(paramsI.toString(), `${type},${relation},${field},${filter}`);
					} else {
						// let j = 0;
						// let paramsJ = 0;
						// for (const orId of id) {
						// 	if (orId) {
						// 		const nameSuffix = `${i}|${j}`;
						// 		const type = event.currentTarget[`type_${nameSuffix}`].value;
						// 		const relation = type === "relation" ? event.currentTarget[`relation_${nameSuffix}`].value : "";
						// 		const field = event.currentTarget[`field_${nameSuffix}`].value;
						// 		const filter = event.currentTarget[`filter_${nameSuffix}`].value;
						// 		params.set(`${paramsI}|${paramsJ}`, `${type},${relation},${field},${filter}`);
						// 		paramsJ++;
						// 	}
						// 	j++;
						// }
					}

					paramsI++;
				}

				i++;
			}
			console.log(params.toString());

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
					{filterIds.reduce((acc, id, i) => {
						if (id !== 0) {
							if (id === 1) {
								acc.push(
									<Filter key={i} i={i} searchTable={searchTable} filterIds={filterIds} setFilterIds={setFilterIds} />
								);
							} else {
								acc.push(
									<div key={i} className="flex flex-col gap-5 mx-5">
										<h2>OR</h2>
										{/* {id.map((orId, j) => {
										if (orId === 0) {
											return <></>;
										} else {
											return (
												<Filter
													key={orId}
													i={i}
													j={j}
													searchTable={searchTable}
													filterIds={filterIds}
													setFilterIds={setFilterIds}
												/>
											);
										}
									})} */}
									</div>
								);
							}
						}

						return acc;
					}, [] as ReactNode[])}
					<button type="button" className="btn" onClick={() => setFilterIds([...filterIds, 1])}>
						+ Add Filter
					</button>
				</>
			)}
		</form>
	);
}

//helper components
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
				className="input input-primary"
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

function Filter({
	i,
	j,
	searchTable,
	filterIds,
	setFilterIds
}: {
	i: number;
	j?: number;
	searchTable: string;
	filterIds: FilterIds;
	setFilterIds: Dispatch<SetStateAction<FilterIds>>;
}) {
	const searchParams = useSearchParams();

	const nameSuffix = j ? `${i}|${j}` : i.toString();
	const urlFilter = searchParams.get(nameSuffix)?.split(",");
	const [type, setType] = useState(urlFilter ? urlFilter[0] : "field");
	const [relation, setRelation] = useState(urlFilter ? urlFilter[1] : "");
	const [field, setField] = useState(urlFilter ? urlFilter[2] : "");

	const omit = [...GlobalOmit, "id"];

	const param = searchParams.get(nameSuffix)?.split(",");
	const table = (relation ? relation.toLowerCase() : searchTable.toLowerCase()) as Lowercase<Prisma.ModelName>;

	return (
		<div className="grid grid-cols-[20%_20%_20%_35%_5%]">
			<div className="pr-2">
				<select
					className="select"
					value={type}
					onChange={(e) => setType(e.target.value)}
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
						onChange={(e) => setRelation(e.target.value)}
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

			{filterIds.filter((id) => id !== 0).length > 1 && (
				<button
					className="btn btn-xs btn-error rounded-lg aspect-square justify-self-center self-center col-5 pl-2"
					type="button"
					onClick={() => setFilterIds(filterIds.toSpliced(i, 1, 0))}
				>
					X
				</button>
			)}
		</div>
	);
}
