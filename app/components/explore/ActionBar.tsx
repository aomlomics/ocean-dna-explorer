"use client";

import { ReactNode } from "react";

const sw = 1.75;
const stroke = "currentColor";

const segBase =
	"inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:text-[0.9375rem] active:brightness-95 cursor-pointer";

const segOn = "bg-primary text-primary-content shadow-md";
const segOff = "bg-base-200/90 text-base-content hover:bg-base-300";

function IconWrap({ children }: { children: ReactNode }) {
	return (
		<span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
			{children}
		</span>
	);
}

export default function ActionBar({
	activePanel,
	onPanelChange,
	activeFilterCount,
	onClear
}: {
	activePanel: "search" | "filters" | null;
	onPanelChange: (panel: "search" | "filters") => void;
	activeFilterCount: number;
	onClear: () => void;
}) {
	const filtersActive = activePanel === "filters";
	const searchActive = activePanel === "search";

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
			className="inline-flex max-w-full flex-wrap items-stretch gap-2"
			role="toolbar"
			aria-label="Search and filters"
		>
			<button
				type="button"
				onClick={() => onPanelChange("search")}
				className={`${segBase} ${searchActive ? segOn : segOff}`}
				aria-pressed={searchActive}
			>
				<IconWrap>
					<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
						<circle cx="11" cy="11" r="7" />
						<path d="M20 20l-4.3-4.3" strokeLinecap="round" />
					</svg>
				</IconWrap>
				Search
			</button>

			<button
				type="button"
				onClick={() => onPanelChange("filters")}
				className={`${segBase} relative ${filtersActive ? segOn : segOff}`}
				aria-pressed={filtersActive}
				aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filters"}
			>
				{activeFilterCount > 0 ? (
					<span
						className={`absolute -right-1 -top-1 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none shadow-md ${
							filtersActive
								? "bg-base-100 text-primary ring-2 ring-primary ring-offset-0"
								: "bg-primary text-primary-content ring-2 ring-base-100"
						}`}
						aria-hidden
					>
						{activeFilterCount}
					</span>
				) : null}
				<IconWrap>{filterIcon}</IconWrap>
				Filters
			</button>

			<button
				type="button"
				onClick={onClear}
				className={`${segBase} ${segOff} disabled:pointer-events-none disabled:opacity-35`}
			>
				<IconWrap>
					<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" aria-hidden>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</IconWrap>
				Clear all
			</button>
		</div>
	);
}
