"use client";

import { Prisma } from "@/app/generated/prisma/client";
import Table from "../paginated/Table";
import Pagination from "../paginated/Pagination";
import { useEffect, useState } from "react";
import Grid from "./grid/Grid";
import TaxaGridItem from "./grid/TaxaGridItem";
import ProjectGridItem from "./grid/ProjectGridItem";
import { useViewMode } from "../explore/ViewModeContext";
import ViewModeToggle from "../explore/ViewModeToggle";

export default function TableDisplay({
	table,
	tableWhere,
	displayMode = "table",
	toggle,
	ignoreParams
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableWhere?: Record<string, any> | undefined;
	displayMode?: "table" | "grid";
	toggle?: true;
	ignoreParams?: string[];
}) {
	const [size, setSize] = useState((window.innerWidth > 1024 ? "lg" : "sm") as "lg" | "sm");

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

	useEffect(() => {
		function handleResize() {
			if (window.innerWidth > 1024) {
				setSize("lg");
			} else {
				setSize("sm");
			}
		}

		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const dataShellClass =
		mode !== "grid"
			? "rounded-lg h-[90vh]"
			: table === "taxonomy"
				? "rounded-lg"
				: "rounded-lg h-[90vh] min-h-0 flex flex-col";

	return (
		<div className="flex flex-col">
			{showBuiltInToggle && (
				<fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-36 border self-center p-2 mb-6">
					<legend className="fieldset-legend">Display Mode</legend>
					<label className="label">
						<input
							type="checkbox"
							className="toggle"
							defaultChecked={mode === "grid"}
							onChange={(e) => (e.target.checked ? setMode("grid") : setMode("table"))}
						/>
						{mode}
					</label>
				</fieldset>
			)}

			{viewModeCtx ? (
				<div className="flex justify-center pb-0.5">
					<ViewModeToggle displayMode={displayMode} toggle={toggle} />
				</div>
			) : null}

			<div className={dataShellClass}>
				{mode === "table" ? (
					size === "lg" ? (
						<Table
							table={table}
							defaultTake={25}
							filterHeadersAtStart
							where={tableWhere}
							ignoreParams={ignoreParams}
							className={viewModeCtx ? "pl-0!" : undefined}
						/>
					) : (
						<Pagination table={table} ignoreParams={ignoreParams} />
					)
				) : table === "project" ? (
					<Grid Child={ProjectGridItem} table={table} ignoreParams={ignoreParams} />
				) : table === "taxonomy" ? (
					<Grid
						Child={TaxaGridItem}
						table={table}
						ignoreParams={ignoreParams}
						fillViewport={false}
						take={30}
						itemsGridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4"
					/>
				) : (
					<>Invalid</>
				)}
			</div>
		</div>
	);
}
