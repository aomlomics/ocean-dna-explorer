"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import RangeFilter from "./filterTypes/RangeFilter";
import { FilterConfig, getActiveFilters } from "./filterHelpers";
import SelectFilter from "./filterTypes/SelectFilter";
import { ReactNode } from "react";
import SelectGroup from "./filterTypes/SelectGroup";
import Filter from "./filterTypes/Filter";

// Main filter component that shows in the sidebar
// Handles all the filters for a specific table (like projects or analyses)
export default function ActualTableFilter({ tableConfig, sticky = false }: { tableConfig: FilterConfig[]; sticky?: boolean }) {
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const [isOpen, setIsOpen] = useState(false);

	// Get what filters are currently active from the URL
	const activeFilters = getActiveFilters(searchParams, tableConfig);
	const activeFilterCount = Object.keys(activeFilters).length;

	function formatLabelFromField(fieldKey: string): string {
		const withSpaces = fieldKey.replace(/_/g, " ");
		return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
	}

	function buildActiveSummaries(): string[] {
		const summaries: string[] = [];
		for (const config of tableConfig) {
			if (config.type === "select" || config.type === "enum") {
				if (typeof config.field === "string") {
					const raw = activeFilters[config.field];
					if (raw !== undefined) {
						let valueLabel = String(raw);
						if (config.type === "select" && Array.isArray(config.options)) {
							const idx = (config.options as any[]).indexOf(raw);
							if (idx !== -1 && Array.isArray((config as any).optionsLabels)) {
								valueLabel = (config as any).optionsLabels[idx] ?? valueLabel;
							}
						}
						summaries.push(`${formatLabelFromField(config.field)}: ${valueLabel}`);
					}
				} else {
					const rel = config.field.rel;
					const f = (config.field as any).f;
					const rawRel = activeFilters[rel];
					if (rawRel !== undefined) {
						try {
							const parsed = JSON.parse(rawRel);
							if (parsed && parsed[f] !== undefined) {
								summaries.push(`${formatLabelFromField(f)}: ${parsed[f]}`);
							}
						} catch {}
					}
				}
			} else if (config.type === "range") {
				if (typeof config.field === "string") {
					const raw = activeFilters[config.field];
					if (raw !== undefined) {
						try {
							const parsed = JSON.parse(raw);
							const g = parsed.gte ?? config.gte;
							const l = parsed.lte ?? config.lte;
							summaries.push(`${formatLabelFromField(config.field)}: ${g}–${l}`);
						} catch {}
					}
				}
			}
		}
		return summaries;
	}

return (
    <div className={`bg-base-200 rounded-xl shadow-inner relative z-20${sticky ? " sticky top-6 z-30" : ""}`}>
		{/* Animated perimeter runner (subtle) */}

			{/* Header: Filters title, icon (larger), active count, chevron; no background bar */}
        <div
            className={`relative group flex justify-between items-center px-5 py-3 cursor-pointer select-none transition-colors rounded-xl hover:bg-primary/10`}
            onClick={() => setIsOpen((v) => !v)}
            role="button"
            aria-expanded={isOpen}
        >
                {!isOpen && (
                    <div className="pointer-events-none absolute left-4/5 -translate-x-1/2 bottom-full mb-2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-primary text-primary-content shadow-xl rounded-md shadow-lg px-3 py-1.5 text-sm text-center max-w-sm whitespace-normal">
                            Apply filters to the data below by using the dropdown menus in this Filter Menu
                        </div>
                    </div>
                )}
				<div className="flex items-center gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary w-6 h-6"
						>
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
                    <h3 className="text-lg font-semibold text-base-content">Filters</h3>
				<span className={`badge badge-md rounded-full px-3 border bg-base-100 ${activeFilterCount > 0 ? "text-primary border-primary/30" : "text-base-content/70 border-base-300"}`}>
						{activeFilterCount} active
					</span>
					</div>
				<div className="flex items-center gap-4">
					{activeFilterCount > 0 && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								const params = new URLSearchParams(searchParams);
								tableConfig.forEach((config) => {
									if (config.type === "selectGroup") {
										for (let field of config.group) {
											params.delete(typeof field === "string" ? field : field.rel);
										}
									} else {
										params.delete(typeof config.field === "string" ? config.field : config.field.rel);
									}
								});
								router.push(`?${params.toString()}`);
							}}
							className="btn btn-primary btn-sm normal-case"
						>
							Clear Filters
						</button>
					)}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={`w-6 h-6 transition-transform text-base-content ${isOpen ? "rotate-180" : ""}`}
					>
						<path d="M6 9l6 6 6-6" />
					</svg>
				</div>
			</div>

			{/* Filter controls */}
			{isOpen && (
				<div className="p-5 pt-3 pb-6 flex flex-col gap-5 min-h-[220px]">
					{tableConfig.reduce((acc: ReactNode[], config, i) => {
						if (config.type === "select" || config.type === "enum") {
							acc.push(
								<SelectFilter
									key={i}
									config={config}
									activeFilters={activeFilters}
									fieldName={typeof config.field === "string" ? config.field : config.field.f}
									value={
										typeof config.field === "string" && activeFilters[config.field] !== undefined
											? activeFilters[config.field]
											: typeof config.field === "object" &&
											  activeFilters[config.field.rel] !== undefined &&
											  JSON.parse(activeFilters[config.field.rel])[config.field.f]
									}
								/>
							);
						} else if (config.type === "range") {
							acc.push(
								<Filter
									key={i}
									fieldName={typeof config.field === "string" ? config.field : config.field.f}
									value={
										typeof config.field === "string" && activeFilters[config.field] !== undefined
											? (JSON.parse(activeFilters[config.field]).gte || config.gte) +
											  " to " +
											  (JSON.parse(activeFilters[config.field]).lte || config.lte)
											: typeof config.field === "object" &&
											  activeFilters[config.field.rel] !== undefined &&
											  JSON.parse(activeFilters[config.field.rel])[config.field.f]
									}
								>
									<RangeFilter config={config} />
								</Filter>
							);
						} else if (config.type === "selectGroup") {
							acc.push(<SelectGroup key={i} config={config} activeFilters={activeFilters} />);
						}

						return acc;
					}, [])}
				</div>
			)}
		</div>
	);
}
