"use client";

import type { BlastQuery, BlastQueryResult, Prisma, Sample } from "@/app/generated/prisma/client";
import Table from "./Table";
import Pagination from "../pagination/Pagination";
import { useEffect, useState } from "react";
import Grid from "../grid/Grid";
import TaxaGridItem from "../grid/TaxaGridItem";
import ProjectGridItem from "../grid/ProjectGridItem";
import { useViewMode } from "../../explore/ViewModeContext";
import InfoButton from "../../InfoButton";
import { useSearchParams } from "next/navigation";

const sw = 1.75;
const stroke = "currentColor";

export default function TableDisplay({
	table,
	tableWhere,
	displayMode = "table",
	toggle,
	ignoreParams,
	extraParams,
	setExtraResults
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableWhere?: Record<string, any> | undefined;
	displayMode?: "table" | "grid";
	toggle?: true;
	ignoreParams?: string[];
	extraParams?: Record<string, string>;
	setExtraResults?: (args: {
		blastResult: BlastQueryResult[] | undefined;
		existingBlastDate: BlastQuery["dateCalculated"] | undefined;
		samples: Sample[] | undefined;
	}) => void;
}) {
	const searchParams = useSearchParams();

	const [size, setSize] = useState<"lg" | "sm">("lg");
	const [showCommonNames, setShowCommonNames] = useState(true);

	// When inside an ExplorePage, mode is driven by ViewModeContext (list/grid control above the table).
	// On other pages (e.g. search), the context is absent so we fall back to local state,
	// which keeps the built-in toggle working independently.
	const viewModeCtx = useViewMode();
	const [localMode, setLocalMode] = useState<"table" | "grid">(displayMode);
	const mode = viewModeCtx?.mode ?? localMode;
	const setMode = (m: "table" | "grid") => {
		if (viewModeCtx) {
			viewModeCtx.setMode(m);
		} else {
			setLocalMode(m);
		}
	};
	const showBuiltInToggle = !viewModeCtx && toggle;
	const effectiveIgnoreParams =
		table === "taxonomy" ? Array.from(new Set([...(ignoreParams ?? []), "assignmentLevel"])) : ignoreParams;

	useEffect(() => {
		function handleResize() {
			if (window.innerWidth >= 1280) {
				setSize("lg");
			} else {
				setSize("sm");
			}
		}

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const fixedViewportClass = size === "lg" ? "h-[90vh]" : "";
	const dataShellClass = mode === "grid" ? "rounded-lg" : `rounded-lg ${fixedViewportClass}`;

	const dataContent =
		mode === "table" ? (
			size === "lg" ? (
				<Table
					key={table + "?" + searchParams.toString()}
					table={table}
					defaultTake={25}
					filterHeadersAtStart
					where={tableWhere}
					ignoreParams={ignoreParams}
					extraParams={extraParams}
					setExtraResults={setExtraResults}
					hideEmptyAtStart={table === "taxonomy"}
				/>
			) : (
				<Pagination key={table + "?" + searchParams.toString()} table={table} ignoreParams={effectiveIgnoreParams} />
			)
		) : table === "project" ? (
			<Grid
				key={table + "?" + searchParams.toString()}
				Child={ProjectGridItem}
				table={table}
				ignoreParams={effectiveIgnoreParams}
				extraQueryParams={{ relations: "AssayPreps", relationsAllFields: "true" }}
				fillViewport={false}
				itemsGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5"
			/>
		) : table === "taxonomy" ? (
			<Grid
				key={table + "?" + searchParams.toString()}
				Child={TaxaGridItem}
				table={table}
				ignoreParams={effectiveIgnoreParams}
				childProps={{ showCommonName: showCommonNames }}
				fillViewport={false}
				take={30}
				itemsGridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4"
			/>
		) : (
			<>Invalid</>
		);

	return (
		<div className="flex flex-col">
			{showBuiltInToggle && (
				<div className="mb-6 self-center">
					<div className="inline-flex items-center gap-2 rounded-xl bg-base-200/40 p-1">
						<button
							type="button"
							className={`btn gap-2 rounded-lg border-0 px-3.5 normal-case min-h-10 h-10 shadow-none ${
								mode === "table"
									? "btn-primary text-primary-content"
									: "btn-ghost bg-base-100/90 text-base-content hover:bg-base-100"
							}`}
							onClick={() => setMode("table")}
							aria-pressed={mode === "table"}
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
								mode === "grid"
									? "btn-primary text-primary-content"
									: "btn-ghost bg-base-100/90 text-base-content hover:bg-base-100"
							}`}
							onClick={() => setMode("grid")}
							aria-pressed={mode === "grid"}
							title="Grid view"
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
				</div>
			)}

			{viewModeCtx ? (
				<div className="flex w-full flex-col items-center gap-3">
					{table === "taxonomy" ? (
						<div className="flex w-full flex-wrap items-center justify-center gap-3">
							<label className="inline-flex items-center justify-center gap-2 text-sm">
								<input
									type="checkbox"
									className="checkbox checkbox-sm"
									checked={showCommonNames}
									onChange={(e) => setShowCommonNames(e.target.checked)}
								/>
								<span>Show common names</span>
							</label>
							<InfoButton
								text="GBIF common names are approximations and are not stored in our database."
								dir="tooltip-right"
							/>
						</div>
					) : null}
					<div className={`w-full ${dataShellClass}`}>{dataContent}</div>
				</div>
			) : (
				<div className={dataShellClass}>{dataContent}</div>
			)}
		</div>
	);
}
