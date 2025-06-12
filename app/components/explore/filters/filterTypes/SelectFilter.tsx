"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { handleFilterChange, EnumFilterConfig, SelectFilterConfig } from "../filterHelpers";
import { parseDbEnum } from "@/app/helpers/utils";

export default function SelectFilter({
	config,
	activeFilters,
	fieldName,
	value
}: {
	config: SelectFilterConfig | EnumFilterConfig;
	activeFilters: {
		[k: string]: string;
	};
	fieldName: string;
	value: string;
}) {
	const searchParams = useSearchParams();
	const router = useRouter();

	return (
		<div className="collapse collapse-arrow bg-base-100">
			<input type="checkbox" className="collapse-toggle" />
			<div className="collapse-title">
				<div className="flex flex-col items-start gap-1">
					<span className="font-medium text-base-content">{fieldName}</span>
					<span className="text-sm text-base-content/70 break-all">{value}</span>
				</div>
			</div>
			<div className="collapse-content bg-base-200/30 pt-0 !pb-0">
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
			</div>
		</div>
	);
}
