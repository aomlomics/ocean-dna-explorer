"use client";

import { ReactNode } from "react";

const toolLabelClass = "w-full text-center text-xs font-semibold leading-none";

const toolBtnBase = [
	"flex min-w-17 flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1 text-center sm:min-w-20 sm:px-3 sm:py-1.5",
	"transition-[background-color,color,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
	"disabled:pointer-events-none disabled:opacity-35"
].join(" ");

function toolBtnActive(active: boolean) {
	return active ? "bg-primary text-primary-content shadow-md" : "text-base-content hover:bg-base-300/60";
}

function ActionTool({
	active,
	onClick,
	label,
	icon,
	disabled
}: {
	active?: boolean;
	onClick: () => void;
	label: string;
	icon: ReactNode;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={`${toolBtnBase} ${toolBtnActive(!!active)} ${disabled ? "" : "active:scale-[0.97]"}`}
		>
			<span className="flex h-5 w-full shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
			<span className={toolLabelClass}>{label}</span>
		</button>
	);
}

export default function ActionBar({
	activePanel,
	onPanelChange,
	activeFilterCount,
	currentView,
	onViewModeChange,
	showGridToggle,
	canClear,
	onClear
}: {
	activePanel: "search" | "filters" | null;
	onPanelChange: (panel: "search" | "filters") => void;
	activeFilterCount: number;
	currentView: "table" | "grid";
	onViewModeChange?: (mode: "table" | "grid") => void;
	showGridToggle?: boolean;
	canClear: boolean;
	onClear: () => void;
}) {
	const stroke = "currentColor";
	const sw = 1.75;
	const filtersActive = activePanel === "filters";

	const filterIcon = (
		<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" aria-hidden>
			<path d="M4 6h12M8 12h12M4 18h12" />
			<circle cx="17" cy="6" r="2" fill={stroke} stroke="none" />
			<circle cx="7" cy="12" r="2" fill={stroke} stroke="none" />
			<circle cx="17" cy="18" r="2" fill={stroke} stroke="none" />
		</svg>
	);

	return (
		<div
			className="w-fit max-w-full rounded-full bg-base-200 px-2 py-1 shadow-md sm:px-2.5 sm:py-1.5"
			role="toolbar"
			aria-label="Table tools"
		>
			<div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
				<ActionTool
					active={activePanel === "search"}
					onClick={() => onPanelChange("search")}
					label="Search"
					icon={
						<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
							<circle cx="11" cy="11" r="7" />
							<path d="M20 20l-4.3-4.3" strokeLinecap="round" />
						</svg>
					}
				/>

				<div className="indicator">
					{activeFilterCount > 0 ? (
						<span
							className="indicator-item indicator-end indicator-top z-1 flex h-4.5 min-h-4.5 min-w-4.5 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full border border-primary/80 bg-primary px-1 text-[0.65rem] font-semibold leading-none text-primary-content shadow-sm"
							aria-hidden
						>
							{activeFilterCount}
						</span>
					) : null}
					<button
						type="button"
						onClick={() => onPanelChange("filters")}
						className={`${toolBtnBase} ${toolBtnActive(filtersActive)} active:scale-[0.97]`}
						aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters"}
					>
						<span className="flex h-5 w-full shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
							{filterIcon}
						</span>
						<span className={toolLabelClass}>Filters</span>
					</button>
				</div>

				{showGridToggle ? (
					<>
						<ActionTool
							active={currentView === "table"}
							onClick={() => onViewModeChange?.("table")}
							disabled={!onViewModeChange}
							label="List"
							icon={
								<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
									<path d="M9 6h12M9 12h12M9 18h12" strokeLinecap="round" />
									<circle cx="5" cy="6" r="1.5" fill={stroke} />
									<circle cx="5" cy="12" r="1.5" fill={stroke} />
									<circle cx="5" cy="18" r="1.5" fill={stroke} />
								</svg>
							}
						/>
						<ActionTool
							active={currentView === "grid"}
							onClick={() => onViewModeChange?.("grid")}
							disabled={!onViewModeChange}
							label="Grid"
							icon={
								<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
									<rect x="4" y="4" width="7" height="7" rx="1.5" strokeLinejoin="round" />
									<rect x="13" y="4" width="7" height="7" rx="1.5" strokeLinejoin="round" />
									<rect x="4" y="13" width="7" height="7" rx="1.5" strokeLinejoin="round" />
									<rect x="13" y="13" width="7" height="7" rx="1.5" strokeLinejoin="round" />
								</svg>
							}
						/>
					</>
				) : null}

				<ActionTool
					active={false}
					disabled={!canClear}
					onClick={() => canClear && onClear()}
					label="Clear all"
					icon={
						<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" aria-hidden>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					}
				/>
			</div>
		</div>
	);
}
