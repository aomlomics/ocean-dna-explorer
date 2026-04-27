"use client";

import { Prisma } from "@/app/generated/prisma/client";
import Table from "../paginated/Table";
import Pagination from "../paginated/Pagination";
import { useEffect, useState } from "react";
import Grid from "./grid/Grid";
import TaxaGridItem from "./grid/TaxaGridItem";
import ProjectGridItem from "./grid/ProjectGridItem";

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
	const [mode, setMode] = useState(displayMode);

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

	return (
		<div className="flex flex-col">
			{toggle ? (
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
			) : (
				<></>
			)}

			<div id="table" className="rounded-lg border border-base-300 h-[90vh]">
				{mode === "table" ? (
					size === "lg" ? (
						<Table
							table={table}
							defaultTake={25}
							filterHeadersAtStart
							where={tableWhere}
							ignoreParams={ignoreParams}
							hideEmptyAtStart={table === "taxonomy"}
						/>
					) : (
						<Pagination table={table} ignoreParams={ignoreParams} />
					)
				) : table === "project" ? (
					<Grid Child={ProjectGridItem} table={table} ignoreParams={ignoreParams} />
				) : table === "taxonomy" ? (
					<Grid Child={TaxaGridItem} table={table} ignoreParams={ignoreParams} />
				) : (
					<>Invalid</>
				)}
			</div>
		</div>
	);
}
