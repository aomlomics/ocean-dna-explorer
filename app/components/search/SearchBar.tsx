"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";

export default function SearchBar({ table }: { table: Uncapitalize<Prisma.ModelName> }) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const searchRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		const search = searchParams.get("search");
		if (searchRef && searchRef.current && search) {
			searchRef.current.value = search;
		}
	}, [searchRef, searchParams]);

	function search() {
		if (formRef.current) {
			const formData = new FormData(formRef.current);
			const searchValue = formData.get("searchInput") as string;

			const newParams = new URLSearchParams(searchParams.toString());
			if (searchValue) {
				newParams.set("search", searchValue);
			} else {
				newParams.delete("search");
			}

			window.history.pushState(null, "", `${pathname}?${newParams.toString()}`);
		}
	}

	return (
		<form
			ref={formRef}
			onSubmit={(e) => {
				e.preventDefault();
				search();
			}}
			className="grid grid-cols-[80%_20%] w-full mb-4"
		>
			<div className="pr-3">
				{table && (
					<label className="input w-full">
						<input
							type="search"
							className="grow"
							id="searchInput"
							name="searchInput"
							ref={searchRef}
							placeholder={`Search ${TableMetadata[table].plural || table}...`}
							defaultValue={searchParams.get("search")?.toString() || ""}
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
