"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";

export default function Search() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const searchRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [searchTable, setSearchTable] = useState("");

	useEffect(() => {
		const search = searchParams.get("search");
		if (searchRef && searchRef.current && search) {
			searchRef.current.value = search;
		}
	}, [searchRef]);

	useEffect(() => {
		setSearchTable(searchParams.get("table") || "");
	}, [searchParams]);

	useEffect(() => {
		if (searchTable) {
			search();
		}
	}, [searchTable]);

	function search() {
		if (formRef.current) {
			const formData = new FormData(formRef.current);
			const search = formData.get("searchInput") as string;

			const params = new URLSearchParams();
			params.set("table", searchTable);
			if (search) {
				params.set("search", search);
			}

			window.history.pushState(null, "", `${pathname}?${params.toString()}`);
		}
	}

	return (
		<form
			ref={formRef}
			onSubmit={(e) => {
				e.preventDefault();
				search();
			}}
			className="grid grid-cols-[20%_70%_10%] w-full"
		>
			<div className="pr-3">
				<select
					value={searchTable}
					className="select"
					onChange={(e) => {
						setSearchTable(e.target.value);
					}}
					required
				>
					<option value="" disabled>
						Select Table
					</option>
					{Object.keys(Prisma.ModelName)
						.sort()
						.map((table) => (
							<option key={table} value={table} onClick={(e) => searchRef.current?.focus()}>
								{table}
							</option>
						))}
				</select>
			</div>

			<div className="pr-3">
				{searchTable && (
					<label className="input w-full">
						<input
							type="search"
							className="grow"
							id="searchInput"
							name="searchInput"
							ref={searchRef}
							placeholder={`Search ${TableMetadata[searchTable as Prisma.ModelName].plural}...`}
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
				)}
			</div>
			<button className="btn btn-primary">Search</button>
		</form>
	);
}
