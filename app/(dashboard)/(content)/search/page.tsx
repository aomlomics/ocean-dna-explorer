"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/schema";
import { ParamsArray, ParamsArrayElement, ParamsArrayField, ParamsArrayRelation, ParamsLogicalOperator, QueryMode } from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { uncapitalizeTable } from "@/app/helpers/utils";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Modal from "@/app/components/Modal";

type FilterIds = Array<0 | 1 | FilterIds>;

type Operator = "AND" | "OR";

interface SearchGroupNode {
	id: string;
	type: "group";
	operator: Operator;
	children: SearchNode[];
	depth: number;
}

interface SearchRuleNode {
	id: string;
	type: "rule";
	// Optional initial params, used to hydrate the uncontrolled inputs from URL state
	initialParams?: ParamsArrayField | ParamsArrayRelation;
}

type SearchNode = SearchGroupNode | SearchRuleNode;

function isGroupElement(e: ParamsArrayElement): e is [ParamsLogicalOperator, ...ParamsArrayElement[]] {
	return Array.isArray(e) && typeof e[0] === "string" && (e[0] === "AND" || e[0] === "OR");
}

function isLegacyOrGroup(e: ParamsArrayElement): e is ParamsArray {
	return Array.isArray(e) && Array.isArray(e[0]);
}

function createEmptyGroup(depth = 0): SearchGroupNode {
	return {
		id: crypto.randomUUID(),
		type: "group",
		operator: "AND",
		children: [],
		depth
	};
}

function paramsArrayToSearchTree(advancedParsed: ParamsArray | undefined): SearchGroupNode {
	// Root group is always present
	const root = createEmptyGroup(0);
	if (!advancedParsed || !advancedParsed.length) {
		return root;
	}

	function buildFromParams(params: ParamsArrayElement[], depth: number): SearchNode[] {
		const result: SearchNode[] = [];

		for (const element of params) {
			// Explicit logical groups: ["AND", ...] or ["OR", ...]
			if (isGroupElement(element)) {
				const [, ...childrenElements] = element;
				result.push({
					id: crypto.randomUUID(),
					type: "group",
					operator: element[0],
					children: buildFromParams(childrenElements, depth + 1),
					depth
				});
				continue;
			}

			// Legacy OR-group: nested ParamsArray
			if (isLegacyOrGroup(element)) {
				result.push({
					id: crypto.randomUUID(),
					type: "group",
					operator: "OR",
					children: buildFromParams(element as ParamsArrayElement[], depth + 1),
					depth
				});
				continue;
			}

			// Otherwise this is a single rule (field or relation filter)
			const tuple = element as ParamsArrayField | ParamsArrayRelation;
			result.push({
				id: crypto.randomUUID(),
				type: "rule",
				initialParams: tuple
			});
		}

		return result;
	}

	root.children = buildFromParams(advancedParsed as ParamsArrayElement[], 1);
	return root;
}

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
	const [searchTree, setSearchTree] = useState<SearchGroupNode>(() => createEmptyGroup(0));
	const formRef = useRef<HTMLFormElement>(null);
	const helpModalRef = useRef<HTMLDialogElement>(null);
	const [formUpdateTrigger, setFormUpdateTrigger] = useState(0);
	const [apiCopied, setApiCopied] = useState(false);

	useEffect(() => {
		try {
			if (searchParams.toString()) {
				const advanced = searchParams.get("advanced");
				if (advanced) {
					let advancedParsed: ParamsArray | undefined;
					try {
						advancedParsed = JSON.parse(advanced) as ParamsArray;
					} catch {
						// Fallback for URLs where "advanced" may be percent-encoded JSON
						try {
							advancedParsed = JSON.parse(decodeURIComponent(advanced)) as ParamsArray;
						} catch {
							console.error("Failed to parse advanced query parameter", advanced);
						}
					}

					if (advancedParsed) {
						setSearchTree(paramsArrayToSearchTree(advancedParsed));
					} else {
						setSearchTree(createEmptyGroup(0));
					}
				} else {
					// Clear filters when switching tables without advanced parameter.
					// Initialize with an empty root group.
					setSearchTree(createEmptyGroup(0));
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

	// Ensure we always have a root group
	useEffect(() => {
		if (!searchTree) {
			setSearchTree(createEmptyGroup(0));
		}
	}, [searchTree]);

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
		
		if (!formRef.current || !searchTree || searchTree.children.length === 0) return "";

		function describeFilter(id: string): string {
			if (!formRef.current) return "";
			
			const type = formRef.current[`type_${id}`]?.value as "relation" | "field";
			const relation = type === "relation" ? formRef.current[`relation_${id}`]?.value : "";
			const field = formRef.current[`field_${id}`]?.value as string;
			const mode = formRef.current[`mode_${id}`]?.value as QueryMode;
			
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
			
			let filterValue = formRef.current[`filter_${id}`]?.value || "";
			if (mode === "range") {
				const gte = formRef.current[`filter_${id}_gte`]?.value || "";
				const lte = formRef.current[`filter_${id}_lte`]?.value || "";
				filterValue = `${gte} and ${lte}`;
			}
			
			return `${prefix}${field} ${modeText} "${filterValue}"`;
		}

		function recurseGroup(group: SearchGroupNode, isRoot = false): string {
			const parts: string[] = [];

			for (const child of group.children) {
				if (child.type === "rule") {
					const desc = describeFilter(child.id);
					if (desc) parts.push(desc);
				} else {
					const childDesc = recurseGroup(child, false);
					if (childDesc) parts.push(`(${childDesc})`);
				}
			}

			if (!parts.length) return "";

			const joiner = group.operator === "AND" ? " AND " : " OR ";
			const joined = parts.join(joiner);

			// Root group is not wrapped in extra parentheses
			return isRoot ? joined : joined;
		}

		const desc = recurseGroup(searchTree, true);
		return desc ? `Searching for ${TableMetadata[searchTable].plural} where: ${desc}` : "";
	}

	function getParamsArrayFromTree(root: SearchGroupNode) {
		if (!formRef.current || !searchTable) return [] as ParamsArray;

		function buildRuleTuple(id: string): ParamsArrayField | ParamsArrayRelation | null {
			if (!formRef.current) return null;

			if (
				!formRef.current[`type_${id}`] ||
				!formRef.current[`field_${id}`] ||
				!formRef.current[`mode_${id}`]
			) {
				return null;
			}

			const type = formRef.current[`type_${id}`].value as "relation" | "field";
			const relation =
				type === "relation" && formRef.current[`relation_${id}`]
					? (formRef.current[`relation_${id}`].value as string)
					: "";

			const table = (relation ? relation : searchTable) as Prisma.ModelName;
			const field = formRef.current[`field_${id}`].value as string;

			if (!field) {
				return null;
			}

			const shape = TableMetadata[table].schema.shape;
			const fieldType = getZodType(shape[field as keyof typeof shape]).type;

			const mode = formRef.current[`mode_${id}`].value as QueryMode;
			let filter = undefined as unknown as string | number | [number, number] | [string, string];

			if (fieldType === "date") {
				if (mode === "range") {
					if (!formRef.current[`filter_${id}_gte_date`] || !formRef.current[`filter_${id}_lte_date`])
						return null;
					const gteDate = formRef.current[`filter_${id}_gte_date`].value;
					const gteTime = formRef.current[`filter_${id}_gte_time`]?.value || "";
					const lteDate = formRef.current[`filter_${id}_lte_date`].value;
					const lteTime = formRef.current[`filter_${id}_lte_time`]?.value || "";

					filter = [gteDate + (gteTime ? "T" + gteTime : ""), lteDate + (lteTime ? "T" + lteTime : "")];
				} else {
					if (!formRef.current[`filter_${id}_date`]) return null;
					const filterDate = formRef.current[`filter_${id}_date`].value;
					const filterTime = formRef.current[`filter_${id}_time`]?.value || "";

					filter = filterDate + (filterTime ? "T" + filterTime : "");
				}
			} else {
				if (mode === "range") {
					if (!formRef.current[`filter_${id}_gte`] || !formRef.current[`filter_${id}_lte`]) return null;
					const gte = formRef.current[`filter_${id}_gte`].value;
					const lte = formRef.current[`filter_${id}_lte`].value;
					if (fieldType === "integer") {
						filter = [parseInt(gte), parseInt(lte)];
					} else if (fieldType === "float") {
						filter = [parseFloat(gte), parseFloat(lte)];
					}
				} else {
					if (!formRef.current[`filter_${id}`]) return null;
					const filterVal = formRef.current[`filter_${id}`].value;

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

			return arr;
		}

		function buildGroup(node: SearchGroupNode): ParamsArray {
			const parts: ParamsArray = [];

			for (const child of node.children) {
				if (child.type === "rule") {
					const tuple = buildRuleTuple(child.id);
					if (tuple) {
						parts.push(tuple);
					}
				} else {
					const childParts = buildGroup(child);
					if (!childParts.length) continue;
					const groupElement: ParamsArrayElement = [child.operator as ParamsLogicalOperator, ...childParts];
					parts.push(groupElement);
				}
			}

			return parts;
		}

		// Root semantics:
		// - If root is AND, we can just return all children parts and let the backend wrap them in AND.
		// - If root is OR, wrap children in a single explicit OR group so the backend sees (A OR B OR ...).
		const inner = buildGroup(root);
		if (!inner.length) return [] as ParamsArray;

		if (root.operator === "AND") {
			return inner;
		} else {
			return [[root.operator as ParamsLogicalOperator, ...inner] as ParamsArrayElement];
		}
	}

    function reset() {
        setSearchTable("Project");
		setSearchTree(createEmptyGroup(0));
		router.push(pathname);
	}

	function search() {
		const params = new URLSearchParams();
		params.set("table", searchTable);

		const advanced = getParamsArrayFromTree(searchTree);
		if (advanced && advanced.length) {
			params.set("advanced", JSON.stringify(advanced));
		}

		router.push(`${pathname}?${params.toString()}`);
		
		// Scroll to results after a brief delay to allow data to load
		setTimeout(() => {
			const resultsElement = document.getElementById('search-results');
			if (resultsElement) {
				resultsElement.scrollIntoView({
					block: "start",
					behavior: "smooth"
				});
			}
		}, 300);
	}

	function getApiQuery() {
		const advanced = getParamsArrayFromTree(searchTree);
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
                <header className="flex items-start justify-between">
					<div>
						<h1 className="text-4xl font-normal text-base-content">
							<span className="">Search</span>{" "}
							<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
							<span className="text-primary font-normal">{TableMetadata[searchTable].plural}</span>
						</h1>
					</div>
					<div className="flex items-center gap-2 bg-base-200/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-base-200/50 transition-colors" onClick={() => helpModalRef.current?.showModal()}>
						<span className="bg-base-300 text-base-content rounded-md w-8 h-8 flex items-center justify-center font-semibold text-xl">
							?
						</span>
						<span className="text-sm font-medium">Help me use this page</span>
					</div>
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
						<div className="bg-base-100 py-6 px-6 rounded-lg mb-4">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-base-content/80">
										Find all <span className="font-semibold">{TableMetadata[searchTable].plural}</span> where:
									</p>
								</div>

								<SearchGroupComponent
									group={searchTree}
									searchTable={searchTable}
									onChange={setSearchTree}
								/>

								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
									<div className="flex-1 text-sm md:text-base text-primary">
										{getQueryDescription() ? (
											<p className="text-left">{getQueryDescription()}</p>
										) : (
											<p className="text-base-content/60 italic text-sm text-left">
												Begin selecting filters and relations, and your query will be displayed here...
											</p>
										)}
									</div>

									<div className="flex items-center justify-end gap-3">
										<button
											type="button"
											className="btn btn-error btn-md gap-2"
											onClick={() => reset()}
										>
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
										<button type="submit" className="btn btn-primary btn-md gap-2">
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
									</div>
								</div>
							</div>
						</div>

				<div className="bg-base-100 py-4 px-6 rounded-lg mb-4">
					<h3 className="text-lg font-medium mb-3">API Query</h3>
					<div className="flex items-start gap-2 max-w-4xl">
						<div className="flex-1 bg-base-200/50 p-3 rounded text-xs font-mono break-words overflow-wrap-anywhere min-h-20 max-h-40 overflow-y-auto">
							{getApiQuery()}
						</div>
						<button
							type="button"
							onClick={copyApiQuery}
							className="btn btn-sm btn-square flex-shrink-0"
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

function SearchGroupComponent({
	group,
	searchTable,
	onChange,
	onDelete
}: {
	group: SearchGroupNode;
	searchTable: Prisma.ModelName;
	onChange: (group: SearchGroupNode) => void;
	onDelete?: () => void;
}) {
	function updateGroup(updater: (group: SearchGroupNode) => void) {
		const clone = { ...group, children: [...group.children] } as SearchGroupNode;
		updater(clone);
		onChange(clone);
	}

	function handleAddRule() {
		updateGroup((g) => {
			g.children = [
				...g.children,
				{
					id: crypto.randomUUID(),
					type: "rule"
				}
			];
		});
	}

	function handleAddGroup() {
		updateGroup((g) => {
			g.children = [
				...g.children,
				createEmptyGroup((g.depth || 0) + 1)
			];
		});
	}

	function handleChildChange(index: number, node: SearchNode | null) {
		updateGroup((g) => {
			const children = [...g.children];
			if (node === null) {
				children.splice(index, 1);
			} else {
				children[index] = node;
			}
			g.children = children;
		});
	}

	const isRoot = group.depth === 0;

	return (
		<div
			className={`card bg-base-100 shadow-sm border border-base-300 ${
				!isRoot ? "ml-6 bg-base-200/60" : ""
			}`}
		>
			<div className="card-body p-4 space-y-4 relative">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<span className="text-sm text-base-content/70">
							Match
						</span>
						<select
							className="select select-xs md:select-sm w-auto"
							value={group.operator}
							onChange={(e) =>
								updateGroup((g) => {
									g.operator = e.target.value as Operator;
								})
							}
						>
							<option value="AND">ALL (AND)</option>
							<option value="OR">ANY (OR)</option>
						</select>
						<span className="text-sm text-base-content/70">
							of the following:
						</span>
					</div>

					{!isRoot && onDelete && (
						<button
							type="button"
							className="btn btn-xs btn-square btn-primary"
							onClick={onDelete}
							aria-label="Remove group"
						>
							<span className="text-primary-content text-lg leading-none">×</span>
						</button>
					)}
				</div>

				<div className="space-y-2">
					{group.children.length === 0 && (
						<p className="text-xs text-base-content/60 italic">
							No criteria yet. Add a filter or nested group.
						</p>
					)}

					{group.children.map((child, index) => (
						<div key={child.id}>
							{child.type === "rule" ? (
								<SearchRuleComponent
									node={child}
									searchTable={searchTable}
									onChange={(updated) => handleChildChange(index, updated)}
								/>
							) : (
								<div className="mt-2">
									<SearchGroupComponent
										group={child}
										searchTable={searchTable}
										onChange={(updatedGroup) => handleChildChange(index, updatedGroup)}
										onDelete={() => handleChildChange(index, null)}
									/>
								</div>
							)}
						</div>
					))}
				</div>

				<div className="flex flex-wrap items-center gap-3 pt-2 mt-2">
					<button
						type="button"
						className="btn btn-sm btn-primary"
						onClick={handleAddRule}
					>
						+ Add Filter
					</button>
					<button
						type="button"
						className="btn btn-sm btn-primary"
						onClick={handleAddGroup}
					>
						+ Add Nested Group
					</button>
				</div>
			</div>
		</div>
	);
}

function SearchRuleComponent({
	node,
	searchTable,
	onChange
}: {
	node: SearchRuleNode;
	searchTable: Prisma.ModelName;
	onChange: (node: SearchRuleNode | null) => void;
}) {
	const paramsArray = node.initialParams;
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
			onChange(null);
		} else {
			setLoaded(true);
		}
	}, []);

	if (invalidField && !loaded) {
		return <></>;
	}

	const omit = [...GlobalOmit, "id"];
	const nameSuffix = node.id;

	return (
		<div className="grid grid-cols-[15%_18%_18%_1fr_40px] gap-2 items-center p-3 rounded-md hover:bg-base-200/60 transition-colors">
			<div>
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

			<div>
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
							if (table !== (searchTable.toLowerCase() as Uncapitalize<Prisma.ModelName>)) {
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

			<div>
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

			<div>
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
				<button
					className="btn btn-xs btn-square btn-primary"
					type="button"
					onClick={() => onChange(null)}
				>
					<span className="text-primary-content text-lg leading-none">×</span>
				</button>
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
