"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/schema";
import { ParamsArray, ParamsArrayField, ParamsArrayRelation, QueryMode } from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { uncapitalizeTable } from "@/app/helpers/utils";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Modal from "@/app/components/Modal";

type FilterIds = Array<0 | 1 | FilterIds>;

export default function AdvancedSearch() {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
    const router = useRouter();
    const [searchTable, setSearchTable] = useState<Prisma.ModelName>(() => {
		const table = searchParams.get("table") as Prisma.ModelName;
		if (table && TableNames.includes(uncapitalizeTable(table))) {
			return table;
		}
		return "Project";
	});
	const [filterIds, setFilterIds] = useState([1] as FilterIds);
	const [paramsArray, setParamsArray] = useState([] as ParamsArray);
	const formRef = useRef<HTMLFormElement>(null);
	const helpModalRef = useRef<HTMLDialogElement>(null);
	const [formUpdateTrigger, setFormUpdateTrigger] = useState(0);
	const [apiCopied, setApiCopied] = useState(false);

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

                const paramTable = searchParams.get("table") as Prisma.ModelName | null;
                if (paramTable && TableNames.includes(uncapitalizeTable(paramTable))) {
                    setSearchTable(paramTable);
                } else {
                    setSearchTable("Project");
                }
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, [searchParams]);

	useEffect(() => {
		// Set default table parameter without creating a new history entry
		if (searchTable && !searchParams.has("advanced") && !searchParams.has("table")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("table", searchTable);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [searchTable, searchParams, pathname, router]);

	//functions
	function getQueryDescription() {
		// Use formUpdateTrigger to force re-evaluation
		const _ = formUpdateTrigger;
		
		if (!formRef.current || filterIds.length === 0) return "";

		function describeFilter(suffix: string): string {
			if (!formRef.current) return "";
			
			const type = formRef.current[`type_${suffix}`]?.value as "relation" | "field";
			const relation = type === "relation" ? formRef.current[`relation_${suffix}`]?.value : "";
			const field = formRef.current[`field_${suffix}`]?.value as string;
			const mode = formRef.current[`mode_${suffix}`]?.value as QueryMode;
			
			if (!field) return "";
			
			const tableName = relation || searchTable;
			const prefix = relation ? `${relation}.` : "";
			
			const modeText = {
				contains: "contains",
				equals: "equals",
				startsWith: "starts with",
				endsWith: "ends with",
				gt: ">",
				gte: ">=",
				lt: "<",
				lte: "<=",
				range: "is between"
			}[mode] || mode;
			
			let filterValue = formRef.current[`filter_${suffix}`]?.value || "";
			if (mode === "range") {
				const gte = formRef.current[`filter_${suffix}_gte`]?.value || "";
				const lte = formRef.current[`filter_${suffix}_lte`]?.value || "";
				filterValue = `${gte} and ${lte}`;
			}
			
			return `${prefix}${field} ${modeText} "${filterValue}"`;
		}

		function recurse(ids: FilterIds, prevSuffix = "", isTopLevel = true): string {
			const parts: string[] = [];
			
			ids.forEach((id, i) => {
				if (id === 0) return;
				const suffix = `${prevSuffix && prevSuffix + "|"}${i}`;
				
				if (id === 1) {
					const desc = describeFilter(suffix);
					if (desc) parts.push(desc);
				} else {
					const orDesc = recurse(id as FilterIds, suffix, false);
					if (orDesc) parts.push(`(${orDesc})`);
				}
			});
			
			return parts.join(isTopLevel ? " AND " : " OR ");
		}

		const desc = recurse(filterIds);
		return desc ? `Searching for ${TableMetadata[searchTable].plural} where: ${desc}` : "";
	}

	function getParamsArray(ids = filterIds, prevSuffix = "") {
		if (formRef.current && ids && searchTable) {
			const parts = [] as ParamsArray;
			let i = 0;
			for (const id of ids) {
				if (id !== 0) {
					const suffix = `${prevSuffix && prevSuffix + "|"}${i}`;

					if (id === 1) {
						if (formRef.current[`type_${suffix}`] && formRef.current[`field_${suffix}`] && formRef.current[`mode_${suffix}`]) {
							const type = formRef.current[`type_${suffix}`].value as "relation" | "field";
							const relation = type === "relation" && formRef.current[`relation_${suffix}`] ? formRef.current[`relation_${suffix}`].value : ("" as string);

							const table = (relation ? relation : searchTable) as Prisma.ModelName;
							const field = formRef.current[`field_${suffix}`].value as string;

							if (!field) {
								continue;
							}

							const shape = TableMetadata[table].schema.shape;
							const fieldType = getZodType(shape[field as keyof typeof shape]).type;

							const mode = formRef.current[`mode_${suffix}`].value as QueryMode;
							let filter = undefined as unknown as string | number | [number, number] | [string, string];

							if (fieldType === "date") {
								if (mode === "range") {
									if (!formRef.current[`filter_${suffix}_gte_date`] || !formRef.current[`filter_${suffix}_lte_date`]) continue;
									const gteDate = formRef.current[`filter_${suffix}_gte_date`].value;
									const gteTime = formRef.current[`filter_${suffix}_gte_time`]?.value || "";
									const lteDate = formRef.current[`filter_${suffix}_lte_date`].value;
									const lteTime = formRef.current[`filter_${suffix}_lte_time`]?.value || "";

									filter = [gteDate + (gteTime ? "T" + gteTime : ""), lteDate + (lteTime ? "T" + lteTime : "")];
								} else {
									if (!formRef.current[`filter_${suffix}_date`]) continue;
									const filterDate = formRef.current[`filter_${suffix}_date`].value;
									const filterTime = formRef.current[`filter_${suffix}_time`]?.value || "";

									filter = filterDate + (filterTime ? "T" + filterTime : "");
								}
							} else {
								if (mode === "range") {
									if (!formRef.current[`filter_${suffix}_gte`] || !formRef.current[`filter_${suffix}_lte`]) continue;
									const gte = formRef.current[`filter_${suffix}_gte`].value;
									const lte = formRef.current[`filter_${suffix}_lte`].value;
									if (fieldType === "integer") {
										filter = [parseInt(gte), parseInt(lte)];
									} else if (fieldType === "float") {
										filter = [parseFloat(gte), parseFloat(lte)];
									}
								} else {
									if (!formRef.current[`filter_${suffix}`]) continue;
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
        setSearchTable("Project");
		setFilterIds([]);
		setParamsArray([]);
		router.push(pathname);
	}

	function search() {
		const params = new URLSearchParams();
		params.set("table", searchTable);

		const advanced = getParamsArray();
		if (advanced && advanced.length) {
			params.set("advanced", JSON.stringify(advanced));
		}

		router.push(`${pathname}?${params.toString()}`);
	}

	function getApiQuery() {
		const advanced = getParamsArray();
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_URL;
		const tableName = uncapitalizeTable(searchTable);
		
		if (advanced && advanced.length) {
			// Return unencoded version - more readable and what people actually type
			return `${baseUrl}/api/${tableName}?advanced=${JSON.stringify(advanced)}`;
		}
		return `${baseUrl}/api/${tableName}`;
	}

	async function copyApiQuery() {
		const query = getApiQuery();
		await navigator.clipboard.writeText(query);
		setApiCopied(true);
		setTimeout(() => setApiCopied(false), 2000);
	}

    return (
        <div className="grid grid-cols-1 gap-y-4 pt-4">
            {searchTable && (
                <header>
                    <h1 className="text-4xl font-normal text-base-content">
                        <span className="">Search</span>{" "}
                        <span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
                        <span className="text-primary font-normal">{TableMetadata[searchTable].plural}</span>
                    </h1>
                </header>
            )}
            <div className="w-full space-y-4 text-base-content/80">
                {searchTable && <p>{TableMetadata[searchTable].description}</p>}
                <ExploreTabButtons activeTable={searchTable} />
            </div>

			<form
				ref={formRef}
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					search();
				}}
				onChange={() => setFormUpdateTrigger(prev => prev + 1)}
			>

                {searchTable && (
					<>
				<div className="rounded-lg mb-4">
					<div className="flex items-center gap-2 bg-base-200/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-base-200/50 transition-colors w-fit" onClick={() => helpModalRef.current?.showModal()}>
						<span className="bg-base-300 text-base-content rounded-md w-8 h-8 flex items-center justify-center font-semibold text-xl">
							?
						</span>
						<span className="text-sm font-medium">Help me use this page</span>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
					<div className="bg-base-100 py-4 px-6 rounded-lg">
						<h3 className="text-lg font-medium mb-3">Plain Text Query</h3>
						{getQueryDescription() ? (
							<p className="text-primary text-sm">{getQueryDescription().replace("Searching for ", "").replace(" where: ", " where: ")}</p>
						) : (
							<p className="text-base-content/50 italic text-sm">Build your query below...</p>
						)}
					</div>

					<div className="bg-base-100 py-4 px-6 rounded-lg">
						<h3 className="text-lg font-medium mb-3">API Query</h3>
						<div className="flex items-start gap-2">
							<div className="flex-1 bg-base-200/50 p-2 rounded text-xs font-mono break-all overflow-x-auto">
								{getApiQuery()}
							</div>
							<button
								type="button"
								onClick={copyApiQuery}
								className="btn btn-sm btn-square"
								title="Copy API query"
							>
								{apiCopied ? (
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
									</svg>
								)}
							</button>
						</div>
						<p className="text-xs text-base-content/60 mt-2">Copy this URL to use directly in your browser or code</p>
					</div>
				</div>

                        <div className="bg-base-100 py-6 rounded-lg">
                                <h2 className="text-2xl font-normal mb-6">Filters and Relations</h2>
                                <div className="text-sm overflow-x-auto overflow-hidden rounded-lg">
                                    <div className="grid grid-cols-[15%_18%_18%_1fr_40px] gap-2 text-center mb-4 font-medium text-base-content/70">
                                        <div>Type</div>
                                        <div>Relation</div>
                                        <div>Field</div>
                                        <div>Filter</div>
										<div></div>
                                    </div>

                                    <FilterSection
                                        key={JSON.stringify(paramsArray)}
                                        searchTable={searchTable}
                                        filterIds={filterIds}
                                        paramsArray={paramsArray}
                                        onChange={(prev) => setFilterIds(prev)}
                                    />
						</div>
				</div>
				
				<div className="flex items-center justify-start gap-4 mt-2">
					<button type="submit" className="btn btn-primary btn-lg gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
							className="w-5 h-5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
							/>
						</svg>
						Search
					</button>
					<button type="button" className="btn btn-error btn-lg gap-2" onClick={() => reset()}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-5 h-5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						Clear
					</button>
				</div>
				{/* <div className="collapse collapse-arrow bg-base-100 rounded-none mt-4">
					<input type="checkbox" />
					<div className="collapse-title font-semibold text-xl text-primary">Show on Map</div>
					<div className="collapse-content text-sm overflow-x-auto overflow-hidden">
						<Map locations={[] as any[]} titleTable={uncapitalizeTable(searchTable)} />
					</div>
				</div> */}
			</>
		)}
	</form>

			<Modal ref={helpModalRef} className="max-h-[85vh] overflow-y-auto my-8 max-w-4xl">
				<div className="p-6">
					<h3 className="text-2xl font-normal mb-6 text-primary">How to Use This Page</h3>
					<div className="space-y-6">
						{/* Part 1: How to Use the Page */}
						<div className="border-l-4 border-primary pl-4">
							<h4 className="font-semibold text-xl mb-3">Part 1: Building Your Search</h4>
							
							<div className="space-y-3">
								<div>
									<p className="text-base-content/80 font-medium mb-1">1. Select Your Table</p>
									<p className="text-base-content/70 text-sm ml-4">
										Click one of the table name tabs at the top (e.g., Projects, Samples, Taxonomy) to choose what data you want to search and see in the results table at the bottom of the page.
									</p>
								</div>

								<div>
									<p className="text-base-content/80 font-medium mb-1">2. Add Filters and Relations</p>
									<p className="text-base-content/70 text-sm ml-4">
										Use the Filters and Relations section to build your query. Add filters based on data fields, and include criteria from related tables by switching the type to "relation", choosing the related table, then selecting the field and condition.
									</p>
								</div>

								<div>
									<p className="text-base-content/80 font-medium mb-1">3. Review Your Query</p>
									<p className="text-base-content/70 text-sm ml-4">
										The <span className="font-semibold">Plain Text Query</span> box shows a readable version of your search. The <span className="font-semibold">API Query</span> box shows the actual URL you can copy and paste into your browser or code to get JSON results.
									</p>
								</div>

								<div>
									<p className="text-base-content/80 font-medium mb-1">4. Search</p>
									<p className="text-base-content/70 text-sm ml-4">
										Click the Search button to see your results in the table below.
									</p>
								</div>
							</div>
						</div>

						{/* Part 2: Understanding AND/OR Logic */}
						<div className="border-l-4 border-secondary pl-4">
							<h4 className="font-semibold text-xl mb-3">Part 2: Understanding AND/OR Logic</h4>

							<div className="space-y-3">
								<div>
									<p className="text-base-content/80 font-medium mb-1">AND Logic (Default)</p>
									<p className="text-base-content/70 text-sm ml-4">
										Each filter row you add is combined with <span className="font-semibold">AND</span> logic. For example, if you add two filters, the search will find records that match <span className="italic">both</span> conditions.
									</p>
								</div>

								<div>
									<p className="text-base-content/80 font-medium mb-1">Using OR</p>
									<p className="text-base-content/70 text-sm ml-4 mb-2">
										The <span className="font-semibold">"+ Add OR"</span> button creates an OR group—a combined statement that is true if <span className="italic">any one</span> of its conditions is met. The OR group itself is treated like a normal filter and is combined with other filters using <span className="font-semibold">AND</span> logic.
									</p>
									<div className="bg-base-200 p-3 rounded-md ml-4 mt-2">
										<p className="font-mono text-sm mb-1">Example:</p>
										<p className="font-mono text-sm">Filter A AND (Filter B OR Filter C)</p>
										<p className="text-xs text-base-content/70 mt-1">
											→ finds records matching A, and either B or C
										</p>
									</div>
								</div>

								<div>
									<p className="text-base-content/80 font-medium mb-1">Using Nested OR (Advanced)</p>
									<p className="text-base-content/70 text-sm ml-4 mb-2">
										Inside an OR group, you can click <span className="font-semibold">"+ Add Nested OR"</span> to create an OR within an OR. This is rarely needed for most searches.
									</p>
									<div className="bg-base-200 p-3 rounded-md ml-4 mt-2">
										<p className="font-mono text-sm mb-1">Example:</p>
										<p className="font-mono text-xs">((Filter A OR Filter B) OR (Filter C OR Filter D))</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</div>
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
	label,
	hideInnerDeletes,
	isSubSection = false,
}: {
	searchTable: string;
	filterIds: FilterIds;
	paramsArray: ParamsArray;
	onChange: (prev: FilterIds) => FilterIds | void;
	prevSuffix?: string;
	className?: string;
	label?: string;
	hideInnerDeletes?: boolean;
	isSubSection?: boolean;
}) {
	let visibleItemCount = 0;
	return (
		<div className={`flex flex-col gap-2 ${className}`}>
			{filterIds.reduce((acc: ReactNode[], id: FilterIds[0], i: number) => {
				if (id) {
					if (visibleItemCount > 0 && label) {
						acc.push(
							<div key={`${i}_label`} className="flex items-center justify-center">
								<span className="badge badge-primary badge-outline">OR</span>
							</div>
						);
					}
					visibleItemCount++;

					const zebraClass = !isSubSection ? (visibleItemCount % 2 === 0 ? "bg-base-200" : "") : "";

					if (id === 1) {
						acc.push(
							<Filter
								key={i}
								nameSuffix={`${prevSuffix && prevSuffix + "|"}${i}`}
								searchTable={searchTable}
								onDelete={() => onChange(filterIds.toSpliced(i, 1, 0))}
								hideDelete={!!hideInnerDeletes}
								paramsArray={paramsArray && (paramsArray[i] as ParamsArrayRelation | ParamsArrayField)}
								className={zebraClass}
							/>
						);
					} else {
						const orFilters = id as FilterIds;
						const isNested = isSubSection;
						acc.push(
							<div key={i} className={`rounded-lg p-3 ${zebraClass} relative ${isNested ? 'border-2 border-primary/30' : ''}`}>
								{orFilters.filter((f) => f === 1).length <= 1 && (
									<button
										className="btn btn-xs btn-square btn-primary absolute top-6 right-4 z-10"
										type="button"
										onClick={() => onChange(filterIds.toSpliced(i, 1, 0))}
									>
										<span className="text-primary-content text-lg leading-none">×</span>
									</button>
								)}
								{isNested && (
									<div className="absolute -top-3 left-4 bg-base-100 px-2">
										<span className="badge badge-primary badge-sm">Nested OR Group</span>
									</div>
								)}
								<FilterSection
									searchTable={searchTable}
									filterIds={orFilters}
									paramsArray={paramsArray && (paramsArray[i] as ParamsArray)}
									onChange={(prev: FilterIds) => onChange(filterIds.toSpliced(i, 1, prev))}
									prevSuffix={`${(prevSuffix && prevSuffix + "|") + i}`}
									label="OR"
									hideInnerDeletes={orFilters.filter((f) => f === 1).length < 2}
									isSubSection={true}
									className=""
								/>
							</div>
						);
					}
				}
				return acc;
			}, [])}

			<div className="flex justify-center items-center gap-5 mt-4">
				<button
					type="button"
					className="btn btn-md btn-primary"
					onClick={() => onChange([...filterIds, 1])}
				>
					+ Add Filter
				</button>
				<button
					type="button"
					className="btn btn-md btn-primary"
					onClick={() => onChange([...filterIds, [1]])}
					title={isSubSection ? "Add a nested OR group - creates an OR within this OR group" : "Add an OR group - combines conditions with OR logic"}
				>
					{isSubSection ? "+ Add Nested OR" : "+ Add OR"}
				</button>
			</div>
		</div>
	);
}

function Filter({
	nameSuffix,
	paramsArray,
	searchTable,
	onDelete,
	hideDelete,
	className,
}: {
	nameSuffix: string;
	paramsArray?: ParamsArrayRelation | ParamsArrayField;
	searchTable: string;
	onDelete: () => FilterIds | void;
	hideDelete?: boolean;
	className?: string;
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
		<div
			className={`grid grid-cols-[15%_18%_18%_1fr_40px] gap-2 items-center p-3 rounded-md ${className}`}
		>
			<div className="">
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

			<div className="">
				{type === "relation" ? (
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
						{TableNames.reduce((acc, table) => {
							if (table !== searchTable) {
								acc.push(
									<option key={table} value={table} title={table}>
										{table}
									</option>
								);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				) : (
					<div />
				)}
			</div>

			<div className={``}>
				{type === "field" || relation ? (
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
									<option key={val} value={val} title={val}>
										{val}
									</option>
								);
							}

							return acc;
						}, [] as ReactNode[])}
					</select>
				) : (
					<div />
				)}
			</div>

			<div className="">
				{!!field ? (
					<InputElement
						nameSuffix={nameSuffix}
						table={table}
						field={field}
						defaultMode={paramsArray ? `${paramsArray[1 + paramsOffset]}` : ""}
						defaultValue={paramsArray ? `${paramsArray[2 + paramsOffset]}` : ""}
					/>
				) : (
					<div />
				)}
			</div>
			<div className="flex justify-center items-center">
				{!hideDelete && (
					<button className="btn btn-xs btn-square btn-primary" type="button" onClick={onDelete}>
						<span className="text-primary-content text-lg leading-none">×</span>
					</button>
				)}
			</div>
		</div>
	);
}

function InputElement({
	nameSuffix,
	table,
	field,
	defaultMode,
	defaultValue,
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
