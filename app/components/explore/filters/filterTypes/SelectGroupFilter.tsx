"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ConfigField, handleFilterChange } from "../filterHelpers";
import { NetworkPacket } from "@/types/globals";
import { Prisma } from "@/app/generated/prisma/client";
import { useState } from "react";

export default function SelectGroupFilter({
	field,
	activeFilters,
	value,
	table,
	group
}: {
	field: ConfigField;
	activeFilters: {
		[k: string]: string;
	};
	value: string;
	table: Uncapitalize<Prisma.ModelName>;
	group: ConfigField[];
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [options, setOptions] = useState({} as Record<string, string[]>);

	async function getOptions() {
		const fieldName = typeof field === "string" ? field : field.f;

		let extraSelf = true;
		const where = Object.entries(activeFilters)
			.reduce((acc, [field, value]) => {
				if (group.includes(field)) {
					acc.push(field + "=" + value);

					if (field === fieldName) {
						extraSelf = false;
					}
				}

				return acc;
			}, [] as string[])
			.join("&");

		const response = await fetch(
			`/api/${table}/fields/distinct/?${where.length ? where + "&" : ""}${extraSelf ? `extraFields=${fieldName}` : ""}`
		);
		const json = (await response.json()) as NetworkPacket;

		if (json.statusMessage === "success") {
			setOptions(json.result);
		}
	}

	return (
		<div key={typeof field === "string" ? field : field.f} className="collapse collapse-arrow bg-base-100">
			<input type="checkbox" className="collapse-toggle" onClick={() => setOptions({})} />
			<div className="collapse-title">
				<div className="flex flex-col items-start gap-1">
					<span className="font-medium text-base-content">{typeof field === "string" ? field : field.f}</span>
					<span className="text-sm text-base-content/70 break-all">{value}</span>
				</div>
			</div>
			<div className="collapse-content bg-base-200/30 pt-0 !pb-0">
				<select
					className="select select-bordered w-full my-3"
					value={
						typeof field === "string"
							? activeFilters[field] || ""
							: searchParams.get(field.rel)
							? JSON.parse(searchParams.get(field.rel) as string)[field.f]
							: ""
					}
					onChange={(e) => {
						handleFilterChange(field, e.target.value || undefined, searchParams, router);
						setOptions({});
					}}
					onClick={getOptions}
				>
					<option value="">Any</option>
					{!!value && <option value={value}>{value}</option>}
					{Object.keys(options).length !== 0 &&
						options[typeof field === "string" ? field : field.f].map((option: string) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
				</select>
			</div>
		</div>
	);
}
