"use client";

import { SelectGroupFilterConfig } from "../filterHelpers";
import SelectGroupFilter from "./SelectGroupFilter";

export default function SelectGroup({
	config,
	activeFilters
}: {
	config: SelectGroupFilterConfig;
	activeFilters: {
		[k: string]: string;
	};
}) {
	return (
		<>
			{config.group.map((field) => (
				<SelectGroupFilter
					key={typeof field === "string" ? field : field.f}
					field={field}
					activeFilters={activeFilters}
					value={
						typeof field === "string" && activeFilters[field] !== undefined
							? activeFilters[field]
							: typeof field === "object" &&
							  activeFilters[field.rel] !== undefined &&
							  JSON.parse(activeFilters[field.rel])[field.f]
					}
					table={config.table}
					group={config.group}
				/>
			))}
		</>
	);
}
