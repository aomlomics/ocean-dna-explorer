"use client";

import { useSearchParams, useRouter } from "next/navigation";
import RangeFilter from "./filterTypes/RangeFilter";
import { FilterConfig, getActiveFilters } from "./filterHelpers";
import SelectFilter from "./filterTypes/SelectFilter";
import SelectGroupFilter from "./filterTypes/SelectGroupFilter";
import { useState } from "react";

// Main filter component that shows in the sidebar
// Handles all the filters for a specific table (like projects or analyses)
export default function ActualTableFilter({ tableConfig }: { tableConfig: FilterConfig[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [whereByGroup, setWhereByGroup] = useState(
		tableConfig.reduce((acc, filter) => {
			if (filter.type === "selectGroup") {
				acc[filter.group] = {};
			}

			return acc;
		}, {} as Record<string, Record<string, string>>)
	);

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
								if (typeof config.field === "string") {
									params.delete(config.field);
								} else {
									params.delete(config.field.rel);
								}
							});
							setWhereByGroup(
								tableConfig.reduce((acc, filter) => {
									if (filter.type === "selectGroup") {
										acc[filter.group] = {};
									}

									return acc;
								}, {} as Record<string, Record<string, string>>)
							);
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
				{tableConfig.map((filter) => (
					<div
						key={typeof filter.field === "string" ? filter.field : filter.field.f}
						className="collapse collapse-arrow bg-base-100"
					>
						<input type="checkbox" className="collapse-toggle" />
						<div className="collapse-title">
							<div className="flex flex-col items-start gap-1">
								<span className="font-medium text-base-content">
									{typeof filter.field === "string" ? filter.field : filter.field.f}
								</span>
								{typeof filter.field === "string" && activeFilters[filter.field] !== undefined ? (
									<span className="text-sm text-base-content/70 break-all">
										{filter.type === "range"
											? (JSON.parse(activeFilters[filter.field]).gte || filter.gte) +
											  " to " +
											  (JSON.parse(activeFilters[filter.field]).lte || filter.lte)
											: activeFilters[filter.field]}
									</span>
								) : (
									typeof filter.field === "object" &&
									activeFilters[filter.field.rel] !== undefined && (
										<span className="text-sm text-base-content/70 break-all">
											{JSON.parse(activeFilters[filter.field.rel])[filter.field.f]}
										</span>
									)
								)}
							</div>
						</div>
						<div className="collapse-content bg-base-200/30 pt-0 !pb-0">
							{(() => {
								switch (filter.type) {
									case "select":
										return <SelectFilter filter={filter} activeFilters={activeFilters} />;
									case "range":
										return <RangeFilter filter={filter} />;
									case "selectGroup":
										return (
											<SelectGroupFilter
												filter={filter}
												activeFilters={activeFilters}
												whereByGroup={whereByGroup}
												setWhereByGroup={setWhereByGroup}
											/>
										);
									default:
										return <></>;
								}
							})()}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
