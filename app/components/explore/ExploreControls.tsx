"use client";

import { useState, Suspense } from "react";
import { FilterConfig } from "./filters/filterHelpers";
import { Prisma } from "@/app/generated/prisma/client";
import TableDisplay from "../paginated/TableDisplay";
import ActionBar from "./ActionBar";
import TableFilter from "./filters/TableFilter";
import { ViewModeProvider } from "./ViewModeContext";

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
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	return (
		<ViewModeProvider initialMode={displayMode}>
			{/* ActionBar is inside Suspense (uses useSearchParams).
			    isFilterOpen lives HERE in the parent so it survives any Suspense re-fires. */}
			<Suspense fallback={<div className="h-16 bg-base-200 rounded-xl animate-pulse" />}>
				<ActionBar
					table={table}
					tableConfig={tableConfig}
					toggle={toggle}
					isFilterOpen={isFilterOpen}
					onFilterToggle={() => setIsFilterOpen((v) => !v)}
				/>
			</Suspense>

			{/* Filter panel renders as a sibling BELOW the bar — not inside it.
			    This avoids the bug where router.push() inside the filter would remount
			    ActionBar (via its Suspense boundary) and lose the open state. */}
			{isFilterOpen && <TableFilter tableConfig={tableConfig} defaultOpen />}

			<TableDisplay table={table} tableWhere={tableWhere} displayMode={displayMode} toggle={toggle} />
		</ViewModeProvider>
	);
}
