"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterConfig, getActiveFilters } from "./filters/filterHelpers";
import { Prisma } from "@/app/generated/prisma/client";
import TableDisplay from "../paginated/TableDisplay";
import ActionBar from "./ActionBar";
import TableFilter from "./filters/TableFilter";
import TableMetadata from "@/types/tableMetadata";
import { capitalizeTable } from "@/app/helpers/utils";
import { ViewModeProvider } from "./ViewModeContext";
import ExploreTabButtons from "./ExploreTabButtons";
import ViewModeToggle from "./ViewModeToggle";

function SearchPanel({
	currentSearch,
	plural,
	onSearch,
	onClear
}: {
	currentSearch: string;
	plural: string;
	onSearch: (value: string) => void;
	onClear: () => void;
}) {
	const [searchValue, setSearchValue] = useState(currentSearch);

	const formRef = useRef<HTMLFormElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const hasText = searchValue.trim().length > 0;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		onSearch(searchValue.trim());
	}

	function handleClear() {
		setSearchValue("");
		onClear();
	}

	return (
		<form
			ref={formRef}
			onSubmit={handleSubmit}
			className="flex w-full max-w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:flex-wrap sm:items-center"
		>
			<label className="input input-bordered input-md flex h-12 min-h-12 w-full min-w-0 flex-1 items-center gap-2 border-base-300 bg-base-100 text-left text-base focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none sm:min-w-0">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					fill="currentColor"
					className="h-4 w-4 shrink-0 opacity-70"
				>
					<path
						fillRule="evenodd"
						d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
						clipRule="evenodd"
					/>
				</svg>

				<input
					ref={searchRef}
					type="text"
					inputMode="search"
					autoComplete="off"
					className="grow"
					id="searchInput"
					name="searchInput"
					placeholder={`Search ${plural}...`}
					value={searchValue}
					onChange={(e) => setSearchValue(e.currentTarget.value)}
				/>

				{hasText ? (
					<button
						type="button"
						className="btn btn-ghost btn-square btn-sm shrink-0 text-base-content/60 hover:bg-base-200 hover:text-base-content"
						aria-label="Clear search"
						onClick={handleClear}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className="h-4 w-4"
							aria-hidden
						>
							<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
						</svg>
					</button>
				) : null}
			</label>

			<button type="submit" className="btn btn-primary btn-sm h-10 min-h-10 w-full shrink-0 px-5 text-sm sm:w-auto">
				Search
			</button>
		</form>
	);
}

function ControlsBody({
	table,
	tableConfig,
	toggle,
	displayMode,
	tableWhere
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	toggle?: true;
	displayMode?: "table" | "grid";
	tableWhere?: Record<string, any> | undefined;
}) {
	const [activePanel, setActivePanel] = useState<"search" | "filters" | null>(null);

	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const searchRef = useRef<HTMLInputElement>(null);
	const currentSearch = searchParams.get("search") || "";
	const plural = TableMetadata[table as Prisma.ModelName]?.plural || table;
	const activeFilters = getActiveFilters(searchParams, tableConfig);
	const activeFilterCount = Object.keys(activeFilters).length;

	useEffect(() => {
		if (activePanel === "search") searchRef.current?.focus({ preventScroll: true });
	}, [activePanel]);

	function commitSearchParams(next: URLSearchParams) {
		const q = next.toString();
		router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
	}

	function handleSearch(searchValue: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (searchValue) {
			params.set("search", searchValue);
		} else {
			params.delete("search");
		}
		commitSearchParams(params);
	}

	function clearSearchOnly() {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("search");
		commitSearchParams(params);
	}

	function clearSearchAndFilters() {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("search");
		tableConfig.forEach((config) => {
			if (config.type === "selectGroup") {
				for (const field of config.group) {
					params.delete(typeof field === "string" ? field : field.rel);
				}
			} else {
				params.delete(typeof config.field === "string" ? config.field : config.field.rel);
			}
		});
		commitSearchParams(params);
		setActivePanel(null);
	}

	const canClearBar = currentSearch.length > 0 || activeFilterCount > 0;
	const canUseClear = canClearBar || activePanel !== null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3">
				<ExploreTabButtons activeTable={capitalizeTable(table)} />

				<div className="flex w-full max-w-full flex-col items-start gap-4">
					<div
						className="inline-flex max-w-full flex-wrap items-center gap-2"
						role="toolbar"
						aria-label="Explore actions and view mode"
					>
						<ActionBar
							activePanel={activePanel}
							onPanelChange={(panel) => setActivePanel((prev) => (prev === panel ? null : panel))}
							activeFilterCount={activeFilterCount}
							canClear={canUseClear}
							onClear={clearSearchAndFilters}
						/>

						<ViewModeToggle displayMode={displayMode} toggle={toggle} />
					</div>

					{activePanel === "search" ? (
						<div className="w-full max-w-full flex justify-center px-0">
							<SearchPanel
								key={currentSearch}
								currentSearch={currentSearch}
								plural={plural}
								onSearch={handleSearch}
								onClear={clearSearchOnly}
							/>
						</div>
					) : null}

					{activePanel === "filters" ? (
						<div className="w-full max-w-full flex justify-center">
							<div className="w-full sm:max-w-2xl">
								<TableFilter tableConfig={tableConfig} embedded />
							</div>
						</div>
					) : null}
				</div>
			</div>

			<TableDisplay table={table} tableWhere={tableWhere} displayMode={displayMode} toggle={toggle} />
		</div>
	);
}

export default function ExploreControls({
	table,
	tableConfig,
	displayMode = "table",
	tableWhere,
	toggle
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableConfig: FilterConfig[];
	toggle?: true;
	displayMode?: "table" | "grid";
	tableWhere?: Record<string, any> | undefined;
}) {
	return (
		<ViewModeProvider initialMode={displayMode}>
			<ControlsBody
				table={table}
				tableConfig={tableConfig}
				toggle={toggle}
				displayMode={displayMode}
				tableWhere={tableWhere}
			/>
		</ViewModeProvider>
	);
}
