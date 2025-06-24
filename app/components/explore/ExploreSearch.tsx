"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "@/app/helpers/utils";
import { EXPLORE_ROUTES, GlobalOmit } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

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

	function handleSearch(value: string) {
		const params = new URLSearchParams(searchParams);

		if (value === "") {
			params.delete("search");
		} else {
			params.set("search", `${field},${value}`);
		}

		router.push(`?${params.toString()}`);
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

		let inputType = undefined;
		let step = undefined;
		//TODO: add support for querying ranges
		if (type === "integer" || type === "float" || type === "integer[]" || type === "float[]") {
			inputType = "number";
			step = "any;";
		} else if (type === "date") {
			inputType = "date";
		}

		return (
			<input
				className="input input-primary rounded-l-none"
				placeholder="Search..."
				name="value"
				type={inputType}
				step={step}
				defaultValue={searchParams.get("search") ? searchParams.get("search")?.split(",")[1] : ""}
			/>
		);
	}

	return (
		<form
			className="grid grid-cols-5 items-center gap-5"
			onSubmit={(e) => {
				e.preventDefault();
				handleSearch(e.currentTarget.value.value);
			}}
		>
			<div className="grid grid-cols-[35%_65%] col-span-2">
				<select
					className="select select-bordered w-full rounded-r-none"
					value={field}
					onChange={(e) => setField(e.currentTarget.value)}
				>
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

			<div className="justify-self-start flex gap-2">
				<button className="btn">Filter</button>
				<button className="btn" type="button" onClick={() => handleSearch("")}>
					Clear
				</button>
			</div>

			<h1 className="text-xl font-medium text-base-content col-start-4 col-span-2">
				Showing {searchParams.toString().length ? "filtered" : "all"}
				<span className="text-primary"> {EXPLORE_ROUTES[table as keyof typeof EXPLORE_ROUTES]}</span>
			</h1>
		</form>
	);
}
