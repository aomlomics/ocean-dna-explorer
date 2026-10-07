"use client";

import { useViewMode } from "./ViewModeContext";

const sw = 1.75;
const stroke = "currentColor";

export default function ViewModeToggle({ displayMode, toggle }: { displayMode?: "table" | "grid"; toggle?: true }) {
	const viewCtx = useViewMode();
	const viewLocked = !toggle;
	const currentView = viewCtx?.mode ?? displayMode ?? "table";
	const setMode = viewCtx?.setMode;

	if (!viewCtx) return null;

	return (
		<div className="inline-flex items-center gap-2 rounded-xl bg-base-200/40 p-1">
			<button
				type="button"
				className={`btn gap-2 rounded-lg border-0 px-3.5 normal-case min-h-10 h-10 shadow-none ${
					currentView === "table"
						? "btn-primary text-primary-content"
						: "btn-ghost bg-base-100/90 text-base-content hover:bg-base-100"
				}`}
				onClick={() => {
					if (viewLocked) return;
					setMode?.("table");
				}}
				aria-pressed={currentView === "table"}
				title="List view"
			>
				<span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
					<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
						<path d="M9 6h12M9 12h12M9 18h12" strokeLinecap="round" />
						<circle cx="5" cy="6" r="1.5" fill={stroke} />
						<circle cx="5" cy="12" r="1.5" fill={stroke} />
						<circle cx="5" cy="18" r="1.5" fill={stroke} />
					</svg>
				</span>
				List
			</button>
			<button
				type="button"
				className={`btn gap-2 rounded-lg border-0 px-3.5 normal-case min-h-10 h-10 shadow-none ${
					viewLocked
						? "btn-ghost bg-base-100/70 text-base-content/40 hover:bg-base-100/70 cursor-not-allowed"
						: currentView === "grid"
							? "btn-primary text-primary-content"
							: "btn-ghost bg-base-100/90 text-base-content hover:bg-base-100"
				}`}
				onClick={() => !viewLocked && setMode?.("grid")}
				disabled={viewLocked || !setMode}
				aria-pressed={currentView === "grid"}
				title={viewLocked ? "Grid view not available on this page" : "Grid view"}
			>
				<span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
					<svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} aria-hidden>
						<rect x="4" y="4" width="7" height="7" rx="1.5" strokeLinejoin="round" />
						<rect x="13" y="4" width="7" height="7" rx="1.5" strokeLinejoin="round" />
						<rect x="4" y="13" width="7" height="7" rx="1.5" strokeLinejoin="round" />
						<rect x="13" y="13" width="7" height="7" rx="1.5" strokeLinejoin="round" />
					</svg>
				</span>
				Grid
			</button>
		</div>
	);
}
