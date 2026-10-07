"use client";

import { getZodType } from "@/app/helpers/schema";
import { GlobalOmit } from "@/types/objects";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import { useSearchParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function ExploreSearch({
	table,
	defaultField,
	omit = []
}: {
	table: Uncapitalize<ModelName>;
	defaultField: string;
	omit?: string[];
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [urlField, searchValue] = (searchParams.get("search") ?? "").split(",", 2);
	const field = urlField || defaultField;

	function handleSearch(search: string) {
		const newParams = new URLSearchParams(searchParams);

		if (search === "") {
			newParams.delete("search");
		} else {
			newParams.set("search", `${field},${search}`);
		}

		router.push(`?${newParams.toString()}`);
	}

	function handleFieldChange(newField: string) {
		const newParams = new URLSearchParams(searchParams);

		if (searchValue) {
			newParams.set("search", `${newField},${searchValue}`);
		} else {
			// If there isn't a search value yet, just change the field
			// without creating an active search.
			newParams.delete("search");
		}

		router.push(`?${newParams.toString()}`);
	}

	const combinedOmit = [...omit, ...GlobalOmit, "id", "userDefined"];

	const type = getZodType(table, field).type;

	let inputType: string | undefined;
	let step: string | undefined;

	// TODO: add support for querying ranges
	if (type === "integer" || type === "float") {
		inputType = "number";
		step = "any";
	} else if (type === "date") {
		inputType = "date";
	}

	return (
		<form
			className="grid grid-cols-5 items-center gap-5"
			onSubmit={(e) => {
				e.preventDefault();
				handleSearch((e.currentTarget.elements.namedItem("search") as HTMLInputElement).value);
			}}
		>
			<div className="grid grid-cols-[35%_65%] col-span-2">
				<select
					className="select select-bordered w-full rounded-r-none"
					value={field}
					onChange={(e) => handleFieldChange(e.currentTarget.value)}
				>
					{TableMetadata[table].enumSchema.options.reduce((acc, option) => {
						if (!combinedOmit.includes(option)) {
							acc.push(
								<option key={option} value={option}>
									{option}
								</option>
							);
						}

						return acc;
					}, [] as ReactNode[])}
				</select>

				<input
					className="input input-primary rounded-l-none"
					placeholder="Search..."
					name="search"
					type={inputType}
					step={step}
					defaultValue={searchValue ?? ""}
				/>
			</div>

			<div className="justify-self-start flex gap-2">
				<button className="btn btn-primary" type="submit">
					Filter
				</button>

				<button className="btn btn-error" type="button" onClick={() => handleSearch("")}>
					Clear
				</button>
			</div>

			<h1 className="text-xl font-medium text-base-content col-start-4 col-span-2">
				Showing {searchParams.toString().length ? "filtered" : "all"}
				<span className="text-primary"> {TableMetadata[table].plural}</span>
			</h1>
		</form>
	);
}
