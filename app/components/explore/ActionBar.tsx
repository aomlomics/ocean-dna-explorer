"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { FilterConfig, getActiveFilters, buildActiveSummaries } from "./filters/filterHelpers";
import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";
import { useViewMode } from "./ViewModeContext";

export default function ActionBar({
	table,
	tableConfig,
	toggle,
	isFilterOpen,
	onFilterToggle
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	toggle?: true;
	isFilterOpen: boolean;
	onFilterToggle: () => void;
}) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const searchRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const ctx = useViewMode();
	const currentView = ctx?.mode ?? "table";

	const activeFilters = getActiveFilters(searchParams, tableConfig);
	const activeFilterCount = Object.keys(activeFilters).length;
	const currentSearch = searchParams.get("search") || "";
	const activeSummaries = buildActiveSummaries(tableConfig, activeFilters);
	const hasActiveState = !!currentSearch || activeFilterCount > 0 || (!!toggle && currentView === "grid");

	const plural = TableMetadata[table as Prisma.ModelName]?.plural || table;

	// Sync search input value when URL changes (e.g. browser back/forward)
	useEffect(() => {
		if (searchRef.current) {
			searchRef.current.value = currentSearch;
		}
	}, [currentSearch]);

	function handleSearch() {
		if (!formRef.current) return;
		const formData = new FormData(formRef.current);
		const searchValue = formData.get("searchInput") as string;
		const params = new URLSearchParams(searchParams.toString());
		if (searchValue) {
			params.set("search", searchValue);
		} else {
			params.delete("search");
		}
		window.history.pushState(null, "", `${pathname}?${params.toString()}`);
	}

	return (
		<div className="flex flex-col gap-2">
			{/* Main action bar — single flat container, no nested boxes */}
			<div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-base-100 rounded-xl shadow-sm">
				{/* Search — takes up the majority of the bar width */}
				<form
					ref={formRef}
					onSubmit={(e) => {
						e.preventDefault();
						handleSearch();
					}}
					className="flex items-center gap-2 flex-1 min-w-[240px]"
				>
					<label className="input flex-1 flex items-center gap-2 focus-within:outline-none">
						{/* Magnifying glass icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							className="h-4 w-4 opacity-50 shrink-0"
						>
							<path
								fillRule="evenodd"
								d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
								clipRule="evenodd"
							/>
						</svg>
						<input
							type="search"
					className="grow min-w-0"
						name="searchInput"
							ref={searchRef}
							placeholder={`Search ${plural}...`}
							defaultValue={currentSearch}
						/>
					</label>
					<button type="submit" className="btn btn-primary shrink-0">
						Search
					</button>
				</form>

				{/* Visual divider */}
				<div className="hidden sm:block h-8 w-px bg-base-300 shrink-0" />

				{/* Right controls: filter button + view toggle */}
				<div className="flex items-center gap-2 shrink-0">
					{/* Filter toggle button */}
					<button
						type="button"
						onClick={onFilterToggle}
						className={`btn gap-2 ${isFilterOpen ? "btn-primary" : "btn-ghost border border-base-300"}`}
					>
						{/* Adjustments / sliders icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-4 h-4"
						>
							<line x1="4" y1="6" x2="16" y2="6" />
							<line x1="8" y1="12" x2="20" y2="12" />
							<line x1="4" y1="18" x2="16" y2="18" />
							<circle cx="18" cy="6" r="2" />
							<circle cx="6" cy="12" r="2" />
							<circle cx="18" cy="18" r="2" />
						</svg>
						<span>Filters</span>
						{activeFilterCount > 0 && (
							<span className="badge badge-sm badge-primary px-1.5">{activeFilterCount}</span>
						)}
					</button>

					{/* View toggle — always rendered; disabled for pages without grid support */}
					<div
						className={`join ${!toggle ? "opacity-40 pointer-events-none" : ""}`}
						title={!toggle ? "Grid view is not available for this data type" : undefined}
					>
						<button
							type="button"
							className={`btn join-item gap-2 ${currentView === "table" ? "btn-primary" : "btn-ghost border border-base-300"}`}
							onClick={() => ctx?.setMode("table")}
						>
							{/* List icon */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-4 h-4"
							>
								<line x1="8" y1="6" x2="21" y2="6" />
								<line x1="8" y1="12" x2="21" y2="12" />
								<line x1="8" y1="18" x2="21" y2="18" />
								<line x1="3" y1="6" x2="3.01" y2="6" />
								<line x1="3" y1="12" x2="3.01" y2="12" />
								<line x1="3" y1="18" x2="3.01" y2="18" />
							</svg>
							<span className="hidden sm:inline">List</span>
						</button>
						<button
							type="button"
							className={`btn join-item gap-2 ${currentView === "grid" ? "btn-primary" : "btn-ghost border border-base-300"}`}
							onClick={() => ctx?.setMode("grid")}
						>
							{/* Grid icon */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-4 h-4"
							>
								<rect x="3" y="3" width="7" height="7" />
								<rect x="14" y="3" width="7" height="7" />
								<rect x="3" y="14" width="7" height="7" />
								<rect x="14" y="14" width="7" height="7" />
							</svg>
							<span className="hidden sm:inline">Grid</span>
						</button>
					</div>
				</div>
			</div>

			{/* Active state chips — only shown when search / filters / grid view are active */}
			{hasActiveState && (
				<div className="flex items-center flex-wrap gap-1.5 px-1 text-xs">
					{currentSearch && (
						<span className="badge badge-sm bg-base-200 text-base-content/70 border-0 gap-1">
							{/* Mini search icon */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								className="h-3 w-3 opacity-60"
							>
								<path
									fillRule="evenodd"
									d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
									clipRule="evenodd"
								/>
							</svg>
							&ldquo;{currentSearch}&rdquo;
						</span>
					)}
					{activeSummaries.map((summary, idx) => (
						<span key={idx} className="badge badge-sm bg-base-200 text-base-content/70 border-0">
							{summary}
						</span>
					))}
					{toggle && currentView === "grid" && (
						<span className="badge badge-sm bg-base-200 text-base-content/70 border-0">
							Grid view
						</span>
					)}
				</div>
			)}
		</div>
	);
}
