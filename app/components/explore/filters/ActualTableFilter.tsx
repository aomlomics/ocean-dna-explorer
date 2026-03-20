"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import RangeFilter from "./filterTypes/RangeFilter";
import { FilterConfig, getActiveFilters, buildActiveSummaries } from "./filterHelpers";
import SelectFilter from "./filterTypes/SelectFilter";
import { ReactNode } from "react";
import SelectGroup from "./filterTypes/SelectGroup";
import Filter from "./filterTypes/Filter";

function ActiveFilterSummaries({ summaries }: { summaries: string[] }) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const checkOverflow = () => {
			const container = containerRef.current;
			if (!container) return;

			const children = Array.from(container.querySelectorAll("[data-filter-summary]"));

			children.forEach((child) => {
				(child as HTMLElement).style.display = "inline-flex";
			});

			for (let i = children.length - 1; i >= 0; i--) {
				const child = children[i] as HTMLElement;
				const isOverflowing = container.scrollWidth > container.clientWidth;

				if (isOverflowing && i > 0) {
					child.style.display = "none";
				}
			}
		};

		checkOverflow();
		window.addEventListener("resize", checkOverflow);
		return () => window.removeEventListener("resize", checkOverflow);
	}, [summaries.length]);

	return (
		<div ref={containerRef} className="flex items-center gap-1 text-sm flex-wrap max-w-lg overflow-hidden">
			{summaries.map((summary, idx) => (
				<span key={idx} data-filter-summary className="text-base-content/70 whitespace-nowrap">
					{summary}
					{idx < summaries.length - 1 && <span className="mx-1">•</span>}
				</span>
			))}
		</div>
	);
}

// Main filter component that shows in the sidebar
// Handles all the filters for a specific table (like projects or analyses)
export default function ActualTableFilter({
	tableConfig,
	sticky = false,
	defaultOpen = false
}: {
	tableConfig: FilterConfig[];
	sticky?: boolean;
	defaultOpen?: boolean;
}) {
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const [isOpen, setIsOpen] = useState(defaultOpen);

	// Get what filters are currently active from the URL
	const activeFilters = getActiveFilters(searchParams, tableConfig);
	const activeFilterCount = Object.keys(activeFilters).length;

	function clearAllFilters() {
		const params = new URLSearchParams(searchParams);
		tableConfig.forEach((config) => {
			if (config.type === "selectGroup") {
				for (const field of config.group) {
					params.delete(typeof field === "string" ? field : field.rel);
				}
			} else {
				params.delete(typeof config.field === "string" ? config.field : config.field.rel);
			}
		});
		router.push(`?${params.toString()}`);
	}

	function renderFilterFields() {
		return tableConfig.reduce((acc: ReactNode[], config, i) => {
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
		}, []);
	}

	return (
		<div className={`bg-base-200 rounded-xl shadow-inner relative z-20 ${sticky ? "sticky top-6 z-30" : ""}`}>
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
						<div className="bg-primary text-primary-content rounded-md shadow-lg px-3 py-1.5 text-sm text-center max-w-sm whitespace-normal">
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
					<span
						className={`badge badge-md rounded-full px-3 border bg-base-100 ${activeFilterCount > 0 ? "text-primary border-primary/30" : "text-base-content/70 border-base-300"}`}
					>
						{activeFilterCount} active
					</span>
					{activeFilterCount > 0 && (
						<div className="hidden md:block">
							<ActiveFilterSummaries summaries={buildActiveSummaries(tableConfig, activeFilters)} />
						</div>
					)}
				</div>
				<div className="flex items-center gap-4">
				{activeFilterCount > 0 && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							clearAllFilters();
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
				{renderFilterFields()}
			</div>
		)}
		</div>
	);
}
