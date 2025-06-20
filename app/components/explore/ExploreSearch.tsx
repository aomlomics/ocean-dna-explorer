"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { EXPLORE_ROUTES, GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function ExploreSearch({
	table,
	fieldOptions,
	defaultField,
	omit = []
}: {
	table: Uncapitalize<Prisma.ModelName>;
	fieldOptions: string[];
	defaultField: string;
	omit?: string[];
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [field, setField] = useState(defaultField);

	useEffect(() => {
		const search = searchParams.get("search");
		if (search) {
			setField(search.split(",")[0]);
		}
	}, []);

	const handleSearchDebounce = useDebouncedCallback((value: string) => {
		const params = new URLSearchParams(searchParams);

		if (value === "") {
			params.delete("search");
		} else {
			params.set("search", `${field},${value}`);
		}

		router.push(`?${params.toString()}`);
	}, 100);

	function handleFieldChange(event: ChangeEvent<HTMLSelectElement>) {
		setField(event.currentTarget.value);

		const search = searchParams.get("search");
		if (search) {
			const params = new URLSearchParams(searchParams);
			params.set("search", `${event.currentTarget.value},${search.split(",")[1]}`);
			router.push(`?${params.toString()}`);
		}
	}

	omit = [...omit, ...GlobalOmit, "id"];

	function InputElement() {
		const shape = TableMetadata[table].schema.shape;
		const type = getZodType(shape[field as keyof typeof shape]).type;
		if (!type) {
			throw new Error(
				`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
			);
		}

		if (type === "integer" || type === "float") {
			return (
				<input
					className="input input-primary rounded-l-none"
					type="number"
					step="any"
					placeholder="Search..."
					defaultValue={searchParams.get("search") ? searchParams.get("search")?.split(",")[1] : ""}
					onChange={(e) => handleSearchDebounce(e.currentTarget.value)}
				/>
			);
		} else if (type === "date") {
			return (
				<input
					className="input input-primary rounded-l-none"
					placeholder="Search..."
					type="date"
					defaultValue={searchParams.get("search") ? searchParams.get("search")?.split(",")[1] : ""}
					onChange={(e) => handleSearchDebounce(e.currentTarget.value)}
				/>
			);
		} else {
			return (
				<input
					className="input input-primary rounded-l-none"
					placeholder="Search..."
					defaultValue={searchParams.get("search") ? searchParams.get("search")?.split(",")[1] : ""}
					onChange={(e) => handleSearchDebounce(e.currentTarget.value)}
				/>
			);
		}
	}

	return (
		<div className="grid grid-cols-5 items-center">
			<div className="grid grid-cols-[25%_75%] col-span-3">
				<select className="select select-bordered w-full rounded-r-none" value={field} onChange={handleFieldChange}>
					{fieldOptions.reduce((acc, option) => {
						if (!omit.includes(option)) {
							acc.push(
								<option key={option} value={option}>
									{option}
								</option>
							);
						}

						return acc;
					}, [] as ReactNode[])}
				</select>
				<InputElement />
			</div>

			<h1 className="text-xl font-medium text-base-content col-start-4 col-span-2">
				Showing {searchParams.toString().length ? "filtered" : "all"}
				<span className="text-primary"> {EXPLORE_ROUTES[table as keyof typeof EXPLORE_ROUTES]}</span>
			</h1>
		</div>
	);
}
