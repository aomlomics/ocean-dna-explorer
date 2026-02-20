"use client";

import { Prisma } from "@/app/generated/prisma/client";
import Table from "../paginated/Table";
import Pagination from "../paginated/Pagination";
import { useEffect, useState } from "react";
import TaxaGrid from "../paginated/TaxaGrid";

export default function ExploreDisplay({
	table,
	tableWhere,
	displayMode,
	toggle
}: {
	table: Uncapitalize<Prisma.ModelName>;
	tableWhere?: Record<string, any> | undefined;
	displayMode: "table" | "grid";
	toggle?: true;
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
							onChange={(e) => (e.target.checked ? setMode("table") : setMode("grid"))}
						/>
						{mode}
					</label>
				</fieldset>
			) : (
				<></>
			)}

			{mode === "table" ? (
				size === "lg" ? (
					<div className="rounded-lg border border-base-300 h-[90vh]">
						<Table table={table} defaultTake={25} filterHeadersAtStart where={tableWhere} />
					</div>
				) : (
					<Pagination table={table} />
				)
			) : table === "taxonomy" ? (
				<div className="rounded-lg border border-base-300">
					<TaxaGrid />
				</div>
			) : (
				<>Invalid</>
			)}
		</div>
	);
}
