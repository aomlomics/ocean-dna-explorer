"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { handleFilterChange, EnumFilterConfig, SelectFilterConfig } from "../filterHelpers";
import { parseDbEnum } from "@/app/helpers/utils";

export default function SelectFilter({
	filter,
	activeFilters
}: {
	filter: SelectFilterConfig | EnumFilterConfig;
	activeFilters: {
		[k: string]: string;
	};
}) {
	const searchParams = useSearchParams();
	const router = useRouter();

	return (
		<select
			className="select select-bordered w-full my-3"
			value={
				typeof filter.field === "string"
					? activeFilters[filter.field] || ""
					: searchParams.get(filter.field.rel)
					? JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f]
					: ""
			}
			onChange={(e) => handleFilterChange(filter.field, e.target.value || undefined, searchParams, router)}
		>
			<option value="">Any</option>
			{filter.type === "enum"
				? Object.values(parseDbEnum(filter.enum)).map((option, i) => (
						<option key={option} value={option}>
							{option}
						</option>
				  ))
				: filter.options &&
				  filter.options.map((option, i) => (
						<option key={option} value={option}>
							{filter.optionsLabels ? filter.optionsLabels[i] : option}
						</option>
				  ))}
		</select>
	);
}
