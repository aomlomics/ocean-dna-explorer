"use client";

import { useSearchParams, useRouter } from "next/navigation";
import RangeFilter from "./filterTypes/RangeFilter";
import { FilterConfig, getActiveFilters } from "./filterHelpers";
import SelectFilter from "./filterTypes/SelectFilter";
import { ReactNode } from "react";
import SelectGroupFilter from "./filterTypes/SelectGroupFilter";
import Filter from "./filterTypes/Filter";

// Main filter component that shows in the sidebar
// Handles all the filters for a specific table (like projects or analyses)
export default function ActualTableFilter({ tableConfig }: { tableConfig: FilterConfig[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get what filters are currently active from the URL
	const activeFilters = getActiveFilters(searchParams, tableConfig);
	const activeFilterCount = Object.keys(activeFilters).length;

	return (
		<div className="bg-base-100 rounded-lg border border-base-300 sticky top-6">
			{/* Shows how many filters are being used */}
			<div className="flex justify-between items-center p-4 border-b border-base-300 bg-base-200/50">
				<div>
					<div className="flex items-center gap-3">
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
							className="text-primary"
						>
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
						<h3 className="font-medium text-base-content">Filters</h3>
					</div>
					<div>
						{activeFilterCount > 0 ? (
							<span className="text-sm text-base-content/70">{activeFilterCount} active</span>
						) : (
							<span className="text-sm text-base-content/70">{"\u200b"}</span>
						)}
					</div>
				</div>
				{/* Button to clear all active filters */}
				{activeFilterCount > 0 && (
					<button
						onClick={() => {
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
						className="btn btn-primary btn-sm"
					>
						Clear all filters
					</button>
				)}
			</div>

			{/* List of all available filters */}
			<div className="divide-y divide-base-300">
				{tableConfig.reduce((acc: ReactNode[], config) => {
					if (config.type === "select" || config.type === "enum") {
						acc.push(
							<Filter
								fieldName={typeof config.field === "string" ? config.field : config.field.f}
								value={
									typeof config.field === "string" && activeFilters[config.field] !== undefined
										? activeFilters[config.field]
										: typeof config.field === "object" &&
										  activeFilters[config.field.rel] !== undefined &&
										  JSON.parse(activeFilters[config.field.rel])[config.field.f]
								}
							>
								<SelectFilter config={config} activeFilters={activeFilters} />
							</Filter>
						);
					} else if (config.type === "range") {
						acc.push(
							<Filter
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
						acc.push(<SelectGroupFilter config={config} activeFilters={activeFilters} />);
					}

					return acc;
				}, [])}
			</div>
		</div>
	);
}
