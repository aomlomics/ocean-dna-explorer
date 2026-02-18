"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/schema";
import {
	ParamsArray,
	ParamsArrayElement,
	ParamsArrayField,
	ParamsArrayRelation,
	ParamsArrayValue,
	ParamsLogicalOperator,
	QueryMode
} from "@/types/globals";
import { GlobalOmit } from "@/types/objects";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import Modal from "@/app/components/Modal";
import { DeadValues } from "@/types/enums";
import { getRelationPath } from "@/app/helpers/schema";

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

const MODE_TEXTS = {
	contains: "contains",
	equals: "equals",
	startsWith: "starts with",
	endsWith: "ends with",
	gt: ">",
	gte: ">=",
	lt: "<",
	lte: "<=",
	in: "is in",
	notIn: "is not in",
	null: "is null",
	notNull: "is not null"
};

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

export default function SearchUI({ noTable }: { noTable?: true }) {
	//hooks
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [searchTable, setSearchTable] = useState(() => {
		const paramTable = searchParams.get("table");
		return TableNames.find((name) => name.toLowerCase() === paramTable?.toLowerCase());
	}); //either noTable or searchTable will always exist, parent without noTable redirects to ?table=project
	const [searchTree, setSearchTree] = useState<SearchGroupNode>(() => createEmptyGroup(0));
	const formRef = useRef<HTMLFormElement>(null);
	const helpModalRef = useRef<HTMLDialogElement>(null);
	const apiFieldsModalRef = useRef<HTMLDialogElement>(null);
	const [apiCopied, setApiCopied] = useState(false);
	const [apiDropdownOpen, setApiDropdownOpen] = useState(false);
	const apiDropdownRef = useRef<HTMLDivElement | null>(null);
	const [apiFieldSelections, setApiFieldSelections] = useState<Record<string, string[]>>({});
	const [fieldSelectionDraft, setFieldSelectionDraft] = useState<string[]>([]);
	const [fieldSearchText, setFieldSearchText] = useState("");
	const [queryDescription, setQueryDescription] = useState("");
	const [triggerQueryDescription, setTriggerQueryDescription] = useState(false); //delay updating query description by a render cycle

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

				const paramTable = searchParams.get("table");
				const table = TableNames.find((name) => name.toLowerCase() === paramTable?.toLowerCase());
				if (table) {
					setSearchTable(table);
				}
			}
		} catch (err) {
			//ignore bad urls
			console.log(err);
		}
	}, [searchParams]);

	// Ensure we always have a root group
	useEffect(() => {
		if (searchTree.children.length === 0) {
			setQueryDescription("");
		} else {
			handleQueryDescription();
		}
	}, [searchTree]);

	useEffect(() => {
		if (Object.keys(searchTree).length === 1 && !Object.values(searchTree)[0].children.length) {
			handleQueryDescription();
		}
	}, [queryDescription]);

	useEffect(() => {
		handleQueryDescription();
	}, [triggerQueryDescription]);

	useEffect(() => {
		// Set default table parameter without creating a new history entry
		if (searchTable && !searchParams.has("advanced") && !searchParams.has("table")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("table", searchTable);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [searchTable, searchParams, pathname, router]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (apiDropdownRef.current && !apiDropdownRef.current.contains(event.target as Node)) {
				setApiDropdownOpen(false);
			}
		}

		if (apiDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [apiDropdownOpen]);

	//functions
	function getAvailableApiFields(table: Uncapitalize<Prisma.ModelName> | undefined) {
		if (table) {
			const omit = new Set(GlobalOmit);
			const meta = TableMetadata[table];
			const allFields = meta.enumSchema.options as string[];

			const ordered: string[] = [];

			if (meta.fieldOrder && meta.fieldOrder.length) {
				for (const f of meta.fieldOrder) {
					if (!omit.has(f)) {
						ordered.push(f);
					}
				}
			}

			for (const head of allFields) {
				if (ordered.includes(head)) continue;
				if (head === "id") continue;
				if (omit.has(head)) continue;

				ordered.push(head);
			}

			return ordered;
		} else {
			return [];
		}
	}

	//TODO: add shapes to description
	function handleQueryDescription() {
		if (!formRef.current || !searchTree || searchTree.children.length === 0) return "";

		function describeFilter(id: string): string {
			if (!formRef.current) return "";

			const type = formRef.current[`type_${id}`]?.value as "relation" | "field";
			const relation = type === "relation" ? formRef.current[`relation_${id}`]?.value : "";
			const field = formRef.current[`field_${id}`]?.value as string;
			if (!field) return "";
			const mode = formRef.current[`mode_${id}`]?.value as QueryMode;

			const prefix = relation ? `${relation}.` : "";

			const modeText = mode in MODE_TEXTS ? MODE_TEXTS[mode as keyof typeof MODE_TEXTS] : mode;

			if (mode === "null" || mode === "notNull") {
				return `${prefix}${field} ${modeText}`;
			}

			let filterValue =
				(mode === "boolean" ? formRef.current[`filter_${id}`]?.checked : formRef.current[`filter_${id}`]?.value) || "";
			if (mode === "range") {
				const gte = formRef.current[`filter_${id}_gte`]?.value || "";
				const lte = formRef.current[`filter_${id}_lte`]?.value || "";
				filterValue = `${gte} and ${lte}`;
			} else if (mode === "in" || mode === "notIn") {
				try {
					const parsed = JSON.parse(filterValue) as unknown[];
					filterValue = parsed.join(", ");
				} catch {
					filterValue = "";
				}
			} else if (mode === "deadValue" && filterValue === "any") {
				return `${prefix}${field} is any dead value`;
			} else if (mode === "boolean") {
				return `${prefix}${filterValue ? "it is" : "it is not"} ${field}`;
			}

			return `${prefix}${field} ${modeText}${filterValue ? ` "${filterValue}"` : ""}`;
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
		setQueryDescription(
			desc ? `Searching for ${noTable ? "results" : TableMetadata[searchTable!].plural} where: ${desc}` : ""
		);
	}

	function getParamsArrayFromTree(root: SearchGroupNode) {
		if (!formRef.current) return [] as ParamsArray;

		function buildRuleTuple(id: string): ParamsArrayField | ParamsArrayRelation | null {
			if (!formRef.current) return null;

			if (!formRef.current[`type_${id}`] || !formRef.current[`field_${id}`] || !formRef.current[`mode_${id}`]) {
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

			let filter = undefined as unknown as ParamsArrayValue;
			if (mode !== "null" && mode !== "notNull") {
				if (mode === "in" || mode === "notIn") {
					if (!formRef.current[`filter_${id}`]) return null;
					try {
						const filterStr = formRef.current[`filter_${id}`].value;
						filter = JSON.parse(filterStr);
						if (!Array.isArray(filter) || filter.length === 0) return null;
					} catch {
						return null;
					}
				} else if (mode === "boolean") {
					if (!formRef.current[`filter_${id}`]) return null;
					filter = formRef.current[`filter_${id}`]?.checked ? true : false;
				} else if (fieldType === "date") {
					if (mode === "range") {
						if (!formRef.current[`filter_${id}_gte_date`] || !formRef.current[`filter_${id}_lte_date`]) return null;
						const gteDate = formRef.current[`filter_${id}_gte_date`].value;
						const gteTime = formRef.current[`filter_${id}_gte_time`]?.value || "";
						const lteDate = formRef.current[`filter_${id}_lte_date`].value;
						const lteTime = formRef.current[`filter_${id}_lte_time`]?.value || "";

						filter = [gteDate + (gteTime ? "T" + gteTime : ""), lteDate + (lteTime ? "T" + lteTime : "")];
					} else if (mode === "deadValue") {
						if (!formRef.current[`filter_${id}`]) return null;
						filter = formRef.current[`filter_${id}`].value;
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
					} else if (mode === "deadValue") {
						if (!formRef.current[`filter_${id}`]) return null;
						filter = formRef.current[`filter_${id}`].value;
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
			}

			let arr = [field, mode, filter] as ParamsArrayRelation | ParamsArrayField;
			if (relation) {
				arr = [relation, ...arr] as ParamsArrayRelation;
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
		setSearchTree(createEmptyGroup(0));
		setQueryDescription("");
		router.push(pathname);
	}

	function search() {
		const params = new URLSearchParams();
		if (!noTable) {
			params.set("table", searchTable!);
		}

		//maintain shapes
		const polygons = searchParams.getAll("polygon");
		if (polygons.length) {
			polygons.forEach((poly) => params.set("polygon", poly));
		}
		const circles = searchParams.getAll("circle");
		if (circles.length) {
			circles.forEach((cir) => params.set("circle", cir));
		}

		const advanced = getParamsArrayFromTree(searchTree);
		if (advanced && advanced.length) {
			params.set("advanced", JSON.stringify(advanced));
		}

		router.push(`${pathname}?${params.toString()}`);

		// Scroll to results after a brief delay to allow data to load
		setTimeout(() => {
			const resultsElement = document.getElementById("search-results");
			if (resultsElement) {
				resultsElement.scrollIntoView({
					block: "start",
					behavior: "smooth"
				});
			}
		}, 300);
	}

	async function copyApiQuery(customFields?: string[] | null) {
		if (!searchTable) {
			return "";
		}

		const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_URL;

		// Prefer the current URL params so the API box always matches what the backend sees after a search
		const paramsFromUrl = new URLSearchParams(searchParams.toString());
		let advancedStr = paramsFromUrl.get("advanced");

		// If there's no advanced parameter in the URL yet, build it from the current tree state
		if (!advancedStr) {
			const advanced = getParamsArrayFromTree(searchTree);
			if (advanced && advanced.length) {
				advancedStr = JSON.stringify(advanced);
			}
		}

		const params = new URLSearchParams();
		if (advancedStr) {
			params.set("advanced", advancedStr);
		}

		//maintain shapes
		const polygons = paramsFromUrl.getAll("polygon");
		if (polygons.length) {
			polygons.forEach((poly) => params.set("polygon", poly));
		}
		const circles = paramsFromUrl.getAll("circle");
		if (circles.length) {
			circles.forEach((cir) => params.set("circle", cir));
		}

		let fieldsForTable = undefined as string[] | undefined;
		if (customFields === null) {
			fieldsForTable = undefined;
		} else if (customFields && customFields.length) {
			fieldsForTable = customFields;
		} else {
			const savedSelection = apiFieldSelections[searchTable];
			if (savedSelection && savedSelection.length) {
				fieldsForTable = savedSelection;
			}
		}

		if (fieldsForTable && fieldsForTable.length) {
			params.set("fields", fieldsForTable.join(","));
		}

		const queryString = params.toString();

		await navigator.clipboard.writeText(`${baseUrl}/api/${searchTable}${queryString ? "?" + queryString : ""}`);
		setApiCopied(true);
		setTimeout(() => setApiCopied(false), 2000);
	}

	function openFieldSelectionModal() {
		if (!searchTable) {
			return;
		}

		const availableFields = getAvailableApiFields(searchTable);
		const savedSelection = apiFieldSelections[searchTable];
		const initialSelection = savedSelection && savedSelection.length ? savedSelection : availableFields;

		setFieldSelectionDraft(initialSelection);
		setFieldSearchText("");
		setApiDropdownOpen(false);
		apiFieldsModalRef.current?.showModal();
	}

	const availableApiFields = getAvailableApiFields(searchTable);
	const filteredApiFields = availableApiFields.filter((field) =>
		field.toLowerCase().includes(fieldSearchText.toLowerCase())
	);
	const allFieldsSelected = availableApiFields.length > 0 && fieldSelectionDraft.length === availableApiFields.length;

	const rootFooter = (
		<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
			<div className="flex-1 text-sm md:text-base text-base-content whitespace-pre-wrap">
				{queryDescription ? (
					<p className="text-left">{queryDescription}</p>
				) : (
					<p className="text-base-content/60 italic text-sm text-left">
						Begin selecting filters and relations, and your query will be displayed here...
					</p>
				)}
			</div>

			<div className="flex items-center justify-end gap-3">
				{noTable ? (
					<></>
				) : (
					<div className="relative inline-block text-left" ref={apiDropdownRef}>
						<button
							type="button"
							className="btn btn-md gap-2 bg-base-200 text-base-content hover:bg-base-300 pr-10 relative"
							onClick={() => {
								if (!apiDropdownOpen) {
									copyApiQuery();
								} else {
									setApiDropdownOpen(false);
								}
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								{apiCopied ? (
									<polyline points="20 6 9 17 4 12"></polyline>
								) : (
									<>
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
									</>
								)}
							</svg>
							<span className="text-sm grid">
								<span className={apiCopied ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>
									Copy as API Query
								</span>
								<span className={apiCopied ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"}>
									Copied
								</span>
							</span>
							<span
								className="absolute inset-y-0 right-3 flex items-center"
								onClick={(e) => {
									e.stopPropagation();
									setApiDropdownOpen((open) => !open);
								}}
								aria-label="API query field options"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</span>
						</button>
						{apiDropdownOpen && (
							<div className="absolute right-0 mt-0 w-full rounded-box rounded-t-none shadow bg-base-200 border border-t-0 border-base-300 z-9999">
								<ul className="menu p-2">
									<li>
										<button
											type="button"
											onClick={() => {
												setApiDropdownOpen(false);
												copyApiQuery(null);
											}}
										>
											Return all fields
										</button>
									</li>
									<li>
										<button
											type="button"
											onClick={() => {
												openFieldSelectionModal();
											}}
										>
											Select fields to return
										</button>
									</li>
								</ul>
							</div>
						)}
					</div>
				)}
				<button type="button" className="btn btn-error btn-md gap-2" onClick={reset}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="w-5 h-5"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
	);

	const tableArgs = noTable ? { noTable } : { searchTable: searchTable! };

	return (
		<>
			<form
				ref={formRef}
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					search();
				}}
				onChange={() => setTriggerQueryDescription(!triggerQueryDescription)}
			>
				<div className="bg-base-100 py-6 rounded-lg mb-4">
					<div className="space-y-4">
						<SearchGroupComponent
							group={searchTree}
							onChange={setSearchTree}
							onHelpClick={() => helpModalRef.current?.showModal()}
							footer={rootFooter}
							{...tableArgs}
						/>
					</div>
				</div>
			</form>

			{searchTable ? (
				<Modal ref={apiFieldsModalRef} className="max-h-[85vh] overflow-y-auto my-8 max-w-3xl">
					<div className="p-6 space-y-4">
						<h3 className="text-2xl font-normal text-primary">Select Fields for API Query</h3>
						<p className="text-sm text-base-content/70">
							Choose which fields from {TableMetadata[searchTable].plural} to include when copying this search as an API
							query. Leaving all fields selected will return the full records.
						</p>
						<div className="mt-2 space-y-3">
							<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
								<label className="w-full md:max-w-sm">
									<span className="text-sm font-medium text-base-content block mb-1">Narrow list</span>
									<input
										type="text"
										className="input input-bordered w-full"
										placeholder="Filter fields..."
										value={fieldSearchText}
										onChange={(e) => setFieldSearchText(e.target.value)}
									/>
								</label>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										className="checkbox"
										checked={allFieldsSelected}
										onChange={(e) =>
											e.target.checked ? setFieldSelectionDraft(availableApiFields) : setFieldSelectionDraft([])
										}
									/>
									<span className="text-sm text-base-content/80">Select/deselect all</span>
								</label>
							</div>
							<div className="border-t border-base-300 pt-3 h-80 overflow-y-auto">
								{filteredApiFields.length ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
										{filteredApiFields.map((field) => (
											<label key={field} className="flex items-center gap-2 text-sm text-base-content/90">
												<input
													type="checkbox"
													className="checkbox checkbox-sm"
													checked={fieldSelectionDraft.includes(field)}
													onChange={() => {
														setFieldSelectionDraft((prev) =>
															prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
														);
													}}
												/>
												<span className="font-mono text-xs break-all">{field}</span>
											</label>
										))}
									</div>
								) : (
									<p className="text-sm text-base-content/60 italic">
										No fields match your search. Try a different filter term.
									</p>
								)}
							</div>
						</div>
						<div className="mt-4 flex items-center justify-end gap-3">
							<button type="button" className="btn btn-ghost" onClick={() => apiFieldsModalRef.current?.close()}>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-primary"
								disabled={!fieldSelectionDraft.length}
								onClick={() => {
									const normalizedSelection = availableApiFields.filter((field) => fieldSelectionDraft.includes(field));
									const selectionIsAll = normalizedSelection.length === availableApiFields.length;

									setApiFieldSelections((prev) => {
										if (!normalizedSelection.length || selectionIsAll) {
											const { [searchTable]: _omit, ...rest } = prev;
											return rest;
										}

										return {
											...prev,
											[searchTable]: normalizedSelection
										};
									});

									copyApiQuery(selectionIsAll ? null : normalizedSelection);
									apiFieldsModalRef.current?.close();
								}}
							>
								Copy selection as query
							</button>
						</div>
					</div>
				</Modal>
			) : (
				<></>
			)}

			<Modal ref={helpModalRef} className="max-h-[85vh] overflow-y-auto my-8 max-w-4xl">
				<div className="p-6">
					<h3 className="text-2xl font-normal mb-6 text-primary">How to Use This Page</h3>
					<div className="space-y-6">
						<div className="space-y-3">
							<p className="text-base-content/80 font-medium">Building a search</p>
							<p className="text-base-content/70 text-sm">
								1. Select a table using the tabs at the top (Projects, Samples, Taxonomy, etc.). This controls what type
								of records you will see in the results table.
							</p>
							<p className="text-base-content/70 text-sm">
								2. In the filter box, use the dropdowns to add filters on fields or related tables. Each row lets you
								pick a type (Field or Relation), a field name, a condition, and a value.
							</p>
							<p className="text-base-content/70 text-sm">
								3. The plain text line at the bottom of the filter box shows a readable description of your search. The
								API Query box below shows the exact URL you can copy into your browser or code.
							</p>
							<p className="text-base-content/70 text-sm">
								4. Click Search to run the query and see results in the table at the bottom of the page. Use Clear to
								reset all filters back to an empty search.
							</p>
							<div className="bg-base-200 p-3 rounded-md mt-2 space-y-1">
								<p className="font-mono text-sm mb-1">Examples:</p>
								<p className="font-mono text-xs">
									Project tab: Field = <span className="font-normal">institution</span>, Condition ={" "}
									<span className="font-normal">contains</span>, Value = <span className="font-normal">"NOAA"</span>
								</p>
								<p className="font-mono text-xs">
									Sample tab: Field = <span className="font-normal">minimumDepthInMeters</span>, Condition ={" "}
									<span className="font-normal">{">"}</span>, Value = <span className="font-normal">100</span>
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<p className="text-base-content/80 font-medium">Filters vs relations</p>
							<p className="text-base-content/70 text-sm">
								A <span className="font-semibold">Field</span> filter searches a column on the table you selected in the
								tabs. For example, on the Projects tab you might filter by a Project field like{" "}
								<span className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">institution</span> or{" "}
								<span className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">study_factor</span>.
							</p>
							<p className="text-base-content/70 text-sm">
								A <span className="font-semibold">Relation</span> filter lets you filter by data on a related table
								while still returning rows from the main table. For example, on the Projects tab you can choose Relation
								= a sample table and Field ={" "}
								<span className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">geo_loc_name</span> to find projects
								that have at least one sample in a specific location.
							</p>
							<p className="text-base-content/70 text-sm">
								Field and Relation filters can be mixed freely inside the same group; they all follow the same AND/OR
								rules described below.
							</p>
						</div>

						<div className="space-y-3">
							<p className="text-base-content/80 font-medium">AND / OR groups and parentheses</p>
							<p className="text-base-content/70 text-sm">
								Every filter lives inside a group. At the top of each group you can choose whether the group matches{" "}
								<span className="font-semibold">ALL (AND)</span> of its filters or{" "}
								<span className="font-semibold">ANY (OR)</span> of its filters.
							</p>
							<p className="text-base-content/70 text-sm">
								Use <span className="font-semibold">+ Add Nested Group</span> to create parentheses in your logic. A
								nested group is evaluated as a single block. For example, if you create a group containing filters B and
								C with <span className="font-semibold">ANY (OR)</span>, and keep filter A outside that group with{" "}
								<span className="font-semibold">ALL (AND)</span>, the query behaves like:
							</p>
							<div className="bg-base-200 p-3 rounded-md mt-1">
								<p className="font-mono text-sm mb-1">Example:</p>
								<p className="font-mono text-sm">A AND (B OR C)</p>
								<p className="text-xs text-base-content/70 mt-1">
									The group around B and C is like parentheses around that part of the expression.
								</p>
							</div>
							<p className="text-base-content/70 text-sm">
								You can nest groups inside other groups to build more complex logic such as{" "}
								<span className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">(A OR B) AND (C OR D)</span>. Each
								nested group controls how its own filters are combined, and the parent group controls how those blocks
								are combined with the rest of the query.
							</p>
							<div className="bg-base-200 p-3 rounded-md mt-2">
								<p className="font-mono text-sm mb-1">Example (nested AND inside OR):</p>
								<p className="font-mono text-sm">A OR [B AND (C OR D)]</p>
								<p className="text-xs text-base-content/70 mt-1">
									To build this, set the top group to ANY (OR), add filter A as a single row, then create a nested group
									set to ALL (AND) that contains filter B and another nested group set to ANY (OR) with filters C and D.
								</p>
							</div>
							<div className="bg-base-200 p-3 rounded-md mt-2">
								<p className="font-mono text-sm mb-1">Example (field + relation):</p>
								<p className="font-mono text-xs">
									(Project.institution = "NOAA" OR Project.institution = "EPA")
									{" AND "}
									(Sample.geo_loc_name contains "Gulf of Mexico" OR Sample.geo_loc_name contains "Caribbean Sea")
								</p>
								<p className="text-xs text-base-content/70 mt-1">
									To build this, create one nested group for the two Project field filters (institution) with ANY (OR),
									and another nested group for the two Sample relation filters (geo_loc_name) with ANY (OR). Leave the
									top group on ALL (AND) so both blocks must be true.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
}

//helper components

function SearchGroupComponent({
	group,
	searchTable,
	noTable,
	onChange,
	onDelete,
	footer,
	onHelpClick
}: {
	group: SearchGroupNode;
	onChange: (group: SearchGroupNode) => void;
	onDelete?: () => void;
	footer?: ReactNode;
	onHelpClick?: () => void;
} & (
	| { searchTable: Uncapitalize<Prisma.ModelName>; noTable?: undefined }
	| { searchTable?: undefined; noTable: true }
)) {
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
			g.children = [...g.children, createEmptyGroup((g.depth || 0) + 1)];
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

	const tableArgs = noTable ? { noTable } : { searchTable };

	return (
		<div className={`card bg-base-100 shadow-sm border border-base-300 w-full ${!isRoot ? "bg-base-200/60" : ""}`}>
			<div className={`card-body p-4 space-y-2 relative ${!isRoot ? "pl-8" : ""}`}>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center text-sm text-base-content/70">
						{isRoot && (
							<>
								<span>Show</span>
								{noTable ? (
									<span className="mx-1">results</span>
								) : (
									<span className="text-primary mx-2">{TableMetadata[searchTable].plural}</span>
								)}

								<span>where</span>
							</>
						)}
						<select
							className="select select-xs md:select-sm w-auto mx-2 text-base-content"
							value={group.operator}
							onChange={(e) =>
								updateGroup((g) => {
									g.operator = e.target.value as Operator;
								})
							}
						>
							<option value="AND">ALL</option>
							<option value="OR">ANY</option>
						</select>
						<span>of the following are true:</span>
					</div>

					<div className="flex items-center gap-2">
						{isRoot && onHelpClick && (
							<button
								type="button"
								className="btn btn-ghost btn-sm text-base-content/60 border-0 hover:bg-base-200 gap-2 font-normal"
								onClick={onHelpClick}
							>
								<span className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-sm font-semibold">
									?
								</span>
								<span className="text-xs md:text-sm normal-case">Help me use the query builder</span>
							</button>
						)}

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
				</div>

				<div className="space-y-0.5">
					{group.children.length === 0 && (
						<p className="text-sm text-base-content/60 italic">No criteria yet. Add a filter or nested group.</p>
					)}

					{group.children.reduce((acc: ReactNode[], child, index) => {
						if (index > 0) {
							acc.push(
								<div key={child.id + "_op"} className="grid grid-cols-[30px_15%_18%_18%_1fr] px-3">
									<div className="flex justify-center items-center">
										<span className="text-xs text-base-content/60 font-semibold tracking-wide">{group.operator}</span>
									</div>
									<div />
									<div />
									<div />
									<div />
								</div>
							);
						}

						acc.push(
							<div key={child.id}>
								{child.type === "rule" ? (
									<SearchRuleComponent
										node={child}
										onChange={(updated) => handleChildChange(index, updated)}
										{...tableArgs}
									/>
								) : (
									<div className="mt-3 mb-3">
										<SearchGroupComponent
											group={child}
											onChange={(updatedGroup) => handleChildChange(index, updatedGroup)}
											onDelete={() => handleChildChange(index, null)}
											{...tableArgs}
										/>
									</div>
								)}
							</div>
						);

						return acc;
					}, [])}
				</div>

				<div className="flex flex-wrap items-center gap-3 pt-1 mt-1">
					<button type="button" className="btn btn-sm btn-primary" onClick={handleAddRule}>
						+ Add Filter
					</button>
					<button type="button" className="btn btn-sm btn-primary" onClick={handleAddGroup}>
						+ Add Nested Group
					</button>
				</div>

				{footer && isRoot && <div className="mt-3">{footer}</div>}
			</div>
		</div>
	);
}

function SearchRuleComponent({
	node,
	searchTable,
	noTable,
	onChange
}: {
	node: SearchRuleNode;
	onChange: (node: SearchRuleNode | null) => void;
} & (
	| { searchTable: Uncapitalize<Prisma.ModelName>; noTable?: undefined }
	| { searchTable?: undefined; noTable: true }
)) {
	const paramsArray = node.initialParams;
	const [type, setType] = useState(noTable || (paramsArray && paramsArray.length === 4) ? "relation" : "field");
	const paramsOffset = type === "relation" ? 1 : 0;
	const [relation, setRelation] = useState(
		(paramsArray && type === "relation"
			? TableNames.find((table) => table.toLowerCase() === paramsArray[0].toLowerCase()) || ""
			: "") as Uncapitalize<Prisma.ModelName> | ""
	);
	const [field, setField] = useState(paramsArray ? (paramsArray[0 + paramsOffset] as string) : "");
	const [loaded, setLoaded] = useState(false);

	const table = relation ? relation : searchTable;
	const invalidField =
		paramsArray && table && !TableMetadata[table].enumSchema.options.includes(paramsArray[0 + paramsOffset] as string);

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

	const omit = [...GlobalOmit, "id", "userDefined"];
	const nameSuffix = node.id;

	return (
		<div
			className={`grid ${
				type === "relation" && !noTable ? "grid-cols-[30px_14%_14%_20%_1fr]" : "grid-cols-[30px_14%_26%_1fr]"
			} gap-2 items-center py-1.5 px-3 rounded-md hover:bg-base-200/60 transition-colors`}
		>
			<div className="flex justify-center">
				<button
					className="btn btn-xs btn-square btn-primary"
					type="button"
					onClick={() => onChange(null)}
					aria-label="Remove filter"
				>
					<span className="text-primary-content text-sm leading-none">×</span>
				</button>
			</div>
			<select
				className={`select${noTable ? " invisible" : ""}`}
				hidden={noTable}
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

			{type === "relation" && (
				<select
					className="select"
					value={relation}
					onChange={(e) => {
						setRelation(e.target.value as Uncapitalize<Prisma.ModelName>);
						setField("");
					}}
					required
					name={`relation_${nameSuffix}`}
				>
					<option value="" disabled>
						Select {noTable ? "Table" : "Relation"}
					</option>
					{TableNames.reduce((acc, t) => {
						if (!searchTable || (t !== searchTable && getRelationPath(searchTable, t))) {
							acc.push(
								<option key={t} title={t}>
									{t}
								</option>
							);
						}

						return acc;
					}, [] as ReactNode[])}
				</select>
			)}

			{table ? (
				<>
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
						<></>
					)}

					{field ? (
						<InputElement
							nameSuffix={nameSuffix}
							table={table}
							field={field}
							defaultMode={paramsArray ? `${paramsArray[1 + paramsOffset]}` : ""}
							defaultValue={paramsArray ? `${paramsArray[2 + paramsOffset]}` : ""}
						/>
					) : (
						<></>
					)}
				</>
			) : (
				<></>
			)}
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
	table: Uncapitalize<Prisma.ModelName>;
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
		defaultMode
			? defaultMode
			: type === "boolean"
				? "boolean"
				: type === "integer" || type === "float" || type === "date"
					? "equals"
					: "contains"
	);

	const [inValues, setInValues] = useState<string[]>(() => {
		if (defaultMode === "in" || defaultMode === "notIn") {
			try {
				const parsed = JSON.parse(defaultValue);
				return Array.isArray(parsed) ? parsed.map((e) => (typeof e !== "string" ? e.toString() : e)) : [];
			} catch {
				return [];
			}
		}
		return [];
	});

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
					<option value="in">In</option>
					<option value="notIn">Not In</option>
					<option value="null">Null</option>
					<option value="notNull">Not null</option>
					<option value="deadValue">Dead value</option>
				</select>
				{mode === "null" || mode === "notNull" ? (
					<div className="bg-base-300/30 rounded-l-md px-4 py-2 text-sm text-base-content/60 flex items-center">
						{mode === "null" ? "is empty" : "is not empty"}
					</div>
				) : mode === "in" || mode === "notIn" ? (
					<div className="rounded-l-md space-y-2 py-2">
						{inValues.map((val, idx) => (
							<div key={idx} className="flex gap-2 items-center">
								<input
									type="number"
									className="input input-primary input-sm w-full"
									placeholder={`Value ${idx + 1}`}
									value={val}
									onChange={(e) => {
										const newValues = [...inValues];
										newValues[idx] = e.target.value;
										setInValues(newValues);
									}}
									name={`filter_${nameSuffix}_${idx}`}
								/>
								<button
									type="button"
									className="btn btn-xs btn-ghost text-error"
									onClick={() => {
										setInValues(inValues.filter((_, i) => i !== idx));
									}}
									aria-label="Remove value"
								>
									×
								</button>
							</div>
						))}
						<button
							type="button"
							className="btn btn-xs btn-primary w-full"
							onClick={() => setInValues([...inValues, ""])}
						>
							+ Add Value
						</button>
						<input
							type="hidden"
							name={`filter_${nameSuffix}`}
							value={JSON.stringify(
								inValues.filter((v) => v.trim() !== "").map((v) => (type === "integer" ? parseInt(v) : parseFloat(v)))
							)}
						/>
					</div>
				) : mode === "range" ? (
					<div className="grid grid-cols-[45%_10%_45%] items-center justify-items-center">
						<input
							className="input input-primary w-full rounded-none"
							placeholder="Lower bound"
							name={`filter_${nameSuffix}_gte`}
							defaultValue={defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[0] : ""}
							type="number"
							required
						/>
						<span className="text-4xl text-primary">-</span>
						<input
							className="input input-primary w-full rounded-l-none"
							placeholder="Upper bound"
							name={`filter_${nameSuffix}_lte`}
							defaultValue={defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[1] : ""}
							type="number"
							required
						/>
					</div>
				) : mode === "deadValue" ? (
					<select
						className="select select-primary rounded-l-md"
						defaultValue={defaultValue && DeadValues.includes(defaultValue) ? defaultValue : "any"}
						name={`filter_${nameSuffix}`}
					>
						<option value="any">any</option>
						{DeadValues.map((dv) => (
							<option key={dv} value={dv}>
								{dv}
							</option>
						))}
					</select>
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
					<option value="in">In</option>
					<option value="notIn">Not In</option>
					<option value="null">Null</option>
					<option value="notNull">Not null</option>
					<option value="deadValue">Dead value</option>
				</select>
				{mode === "null" || mode === "notNull" ? (
					<div className="bg-base-300/30 rounded-l-md px-4 py-2 text-sm text-base-content/60 flex items-center">
						{mode === "null" ? "is empty" : "is not empty"}
					</div>
				) : mode === "in" || mode === "notIn" ? (
					<div className="rounded-l-md space-y-2 py-2">
						{inValues.map((val, idx) => (
							<div key={idx} className="flex gap-2 items-center">
								<input
									type="text"
									className="input input-primary input-sm w-full"
									placeholder={`ISO 8601 Date (${idx + 1})`}
									value={val}
									onChange={(e) => {
										const newValues = [...inValues];
										newValues[idx] = e.target.value;
										setInValues(newValues);
									}}
									name={`filter_${nameSuffix}_${idx}`}
								/>
								<button
									type="button"
									className="btn btn-xs btn-ghost text-error"
									onClick={() => {
										setInValues(inValues.filter((_, i) => i !== idx));
									}}
									aria-label="Remove value"
								>
									×
								</button>
							</div>
						))}
						<button
							type="button"
							className="btn btn-xs btn-primary w-full"
							onClick={() => setInValues([...inValues, ""])}
						>
							+ Add Date
						</button>
						<input
							type="hidden"
							name={`filter_${nameSuffix}`}
							value={JSON.stringify(inValues.filter((v) => v.trim() !== ""))}
						/>
					</div>
				) : mode === "deadValue" ? (
					<select
						className="select select-primary rounded-l-md"
						defaultValue={defaultValue && DeadValues.includes(defaultValue) ? defaultValue : "any"}
						name={`filter_${nameSuffix}`}
					>
						<option value="any">any</option>
						{DeadValues.map((dv) => (
							<option key={dv} value={dv}>
								{dv}
							</option>
						))}
					</select>
				) : mode === "range" ? (
					<div className="grid grid-cols-[45%_10%_45%] items-center justify-items-center">
						<div className="input input-primary w-full rounded-none">
							<input
								name={`filter_${nameSuffix}_gte_date`}
								className={`w-5 ${gteDateSelected ? "text-success" : "text-error"}`}
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[0].split("T")[0] : ""
								}
								onChange={(e) => setGteDateSelected(!!e.target.value)}
								type="date"
								required
							/>
							<input
								type="time"
								className="text-center"
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[0].split("T")[1] : ""
								}
								name={`filter_${nameSuffix}_gte_time`}
							/>
						</div>
						<span className="text-4xl text-primary">-</span>
						<div className="input input-primary w-full rounded-l-none">
							<input
								name={`filter_${nameSuffix}_lte_date`}
								className={`w-5 ${lteDateSelected ? "text-success" : "text-error"}`}
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[1].split("T")[0] : ""
								}
								onChange={(e) => setLteDateSelected(!!e.target.value)}
								type="date"
								required
							/>
							<input
								type="time"
								className="text-center"
								defaultValue={
									defaultValue && defaultValue.split(",").length === 2 ? defaultValue.split(",")[1].split("T")[1] : ""
								}
								name={`filter_${nameSuffix}_lte_time`}
							/>
						</div>
					</div>
				) : (
					<div className="flex justify-start">
						<div className="input input-primary w-full max-w-xs">
							<input
								name={`filter_${nameSuffix}_date`}
								className="w-1/2"
								defaultValue={defaultValue && defaultValue.split(",").length === 1 ? defaultValue.split("T")[0] : ""}
								type="date"
								required
							/>
							<input
								type="time"
								className="text-center w-1/2"
								defaultValue={defaultValue && defaultValue.split(",").length === 1 ? defaultValue.split("T")[1] : ""}
								name={`filter_${nameSuffix}_time`}
							/>
						</div>
					</div>
				)}
			</div>
		);
	} else if (type === "boolean") {
		return (
			<div className="px-2 grid grid-cols-[30%_70%]">
				<input type="hidden" name={`mode_${nameSuffix}`} value="boolean" />
				<input
					type="checkbox"
					className="checkbox checkbox-primary"
					defaultChecked={defaultValue === "true"}
					name={`filter_${nameSuffix}`}
				/>
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
					<option value="in">In</option>
					<option value="notIn">Not In</option>
					<option value="null">Null</option>
					<option value="notNull">Not null</option>
					<option value="deadValue">Dead value</option>
				</select>
				{mode === "null" || mode === "notNull" ? (
					<div className="bg-base-300/30 rounded-l-md px-4 py-2 text-sm text-base-content/60 flex items-center">
						{mode === "null" ? "is empty" : "is not empty"}
					</div>
				) : mode === "in" || mode === "notIn" ? (
					<div className="rounded-l-md space-y-2 py-2">
						{inValues.map((val, idx) => (
							<div key={idx} className="flex gap-2 items-center">
								<input
									type="text"
									className="input input-primary input-sm w-full"
									placeholder={`Value ${idx + 1}`}
									value={val}
									onChange={(e) => {
										const newValues = [...inValues];
										newValues[idx] = e.target.value;
										setInValues(newValues);
									}}
									name={`filter_${nameSuffix}_${idx}`}
								/>
								<button
									type="button"
									className="btn btn-xs btn-ghost text-error"
									onClick={() => {
										setInValues(inValues.filter((_, i) => i !== idx));
									}}
									aria-label="Remove value"
								>
									×
								</button>
							</div>
						))}
						<button
							type="button"
							className="btn btn-xs btn-primary w-full"
							onClick={() => setInValues([...inValues, ""])}
						>
							+ Add Value
						</button>
						<input
							type="hidden"
							name={`filter_${nameSuffix}`}
							value={JSON.stringify(inValues.filter((v) => v.trim() !== ""))}
						/>
					</div>
				) : mode === "deadValue" ? (
					<select
						className="select select-primary rounded-l-md"
						defaultValue={defaultValue && DeadValues.includes(defaultValue) ? defaultValue : "any"}
						name={`filter_${nameSuffix}`}
					>
						<option value="any">any</option>
						{DeadValues.map((dv) => (
							<option key={dv} value={dv}>
								{dv}
							</option>
						))}
					</select>
				) : (
					<input
						className="input input-primary w-full rounded-l-none"
						placeholder="Filter..."
						name={`filter_${nameSuffix}`}
						defaultValue={defaultValue === "undefined" ? undefined : defaultValue}
						required
					/>
				)}
			</div>
		);
	}
}
