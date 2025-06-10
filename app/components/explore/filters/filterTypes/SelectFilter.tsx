"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { handleFilterChange, EnumFilterConfig, SelectFilterConfig } from "../filterHelpers";
import { parseDbEnum } from "@/app/helpers/utils";

export default function SelectFilter({
	config,
	activeFilters
}: {
	config: SelectFilterConfig | EnumFilterConfig;
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
				typeof config.field === "string"
					? activeFilters[config.field] || ""
					: searchParams.get(config.field.rel)
					? JSON.parse(searchParams.get(config.field.rel) as string)[config.field.f]
					: ""
			}
			onChange={(e) => handleFilterChange(config.field, e.target.value || undefined, searchParams, router)}
		>
			<option value="">Any</option>
			{config.type === "enum"
				? Object.values(parseDbEnum(config.enum)).map((option, i) => (
						<option key={option} value={option}>
							{option}
						</option>
				  ))
				: config.options &&
				  config.options.map((option, i) => (
						<option key={option} value={option}>
							{config.optionsLabels ? config.optionsLabels[i] : option}
						</option>
				  ))}
		</select>
	);
}
