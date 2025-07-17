"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Prisma } from "../../generated/prisma/client";
import tableMetadata from "@/types/tableMetadata";

export default function Search() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const searchRef = useRef<HTMLInputElement>(null);
	const [searchTable, setSearchTable] = useState("All Tables");

	useEffect(() => {
		setSearchTable(searchParams.get("table") || "All Tables");
	}, [searchParams]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const search = formData.get("searchInput") as string;

		const params = new URLSearchParams(searchParams);
		if (search) {
			if (searchTable === "All Tables") {
				params.delete("table");
			} else {
				params.set("table", searchTable);
			}
			params.set("q", search);
		} else {
			params.delete("q");
		}
		router.replace(`${pathname}?${params.toString()}`);
	}

	return (
		<form onSubmit={handleSubmit} className="grid grid-cols-[20%_70%_10%] w-full">
			<div className="pr-3">
				<select value={searchTable} className="select" onChange={(e) => setSearchTable(e.target.value)}>
					<option value="All Tables">All Tables</option>
					{Object.keys(Prisma.ModelName)
						.sort()
						.map((table) => (
							<option key={table} value={table}>
								{table}
							</option>
						))}
				</select>
			</div>

			<div className="pr-3">
				<label className="input w-full">
					<input
						type="search"
						className="grow"
						id="searchInput"
						name="searchInput"
						ref={searchRef}
						placeholder={`Search ${
							searchTable === "All Tables"
								? "All Tables"
								: tableMetadata[searchTable.toLowerCase() as Lowercase<Prisma.ModelName>].plural
						}...`}
						defaultValue={searchParams.get("q")?.toString()}
					/>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						className="h-4 w-4 opacity-70"
					>
						<path
							fillRule="evenodd"
							d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
							clipRule="evenodd"
						/>
					</svg>
				</label>
			</div>
			<button className="btn btn-primary">Search</button>
		</form>
	);
}
