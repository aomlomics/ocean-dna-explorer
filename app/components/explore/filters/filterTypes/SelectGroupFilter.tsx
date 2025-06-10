//implicit client component

import { useState } from "react";
import { handleFilterChange, SelectGroupFilterConfig } from "../filterHelpers";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/app/helpers/utils";
import Filter from "./Filter";
import { NetworkPacket } from "@/types/globals";

export default function SelectGroupFilter({
	config,
	activeFilters
}: {
	config: SelectGroupFilterConfig;
	activeFilters: {
		[k: string]: string;
	};
}) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const where = Object.entries(activeFilters).reduce((acc, [field, value]) => {
		if (config.group.includes(field)) {
			acc[field] = value;
		}

		return acc;
	}, {} as Record<string, string>);

	const { data, error, isLoading }: { data: NetworkPacket; error: any; isLoading: boolean } = useSWR(
		`/api/${config.table}/fields/distinct/?` +
			Object.entries(where) //add filters to query
				.map(([field, value]) => `${field}=${value}`)
				.join("&") +
			"&extraFields=" + //add extra fields to query
			config.group.filter((field) =>
				typeof field === "string" ? !Object.keys(where).includes(field) : !Object.keys(where).includes(field.f)
			),
		fetcher
	);
	if (isLoading)
		return (
			<>
				{config.group.map((field) => (
					<Filter
						key={typeof field === "string" ? field : field.f}
						fieldName={typeof field === "string" ? field : field.f}
						value={
							typeof field === "string" && activeFilters[field] !== undefined
								? activeFilters[field]
								: typeof field === "object" &&
								  activeFilters[field.rel] !== undefined &&
								  JSON.parse(activeFilters[field.rel])[field.f]
						}
					>
						<select
							className="select select-bordered w-full my-3"
							disabled
							value={
								typeof field === "string"
									? activeFilters[field] || ""
									: searchParams.get(field.rel)
									? JSON.parse(searchParams.get(field.rel) as string)[field.f]
									: ""
							}
						></select>
					</Filter>
				))}
			</>
		);
	if (error) return <div>failed to load: {error}</div>;
	if (data.statusMessage === "error") return <div>failed to load: {data.error}</div>;

	return (
		<>
			{config.group.map((field) => (
				<Filter
					key={typeof field === "string" ? field : field.f}
					fieldName={typeof field === "string" ? field : field.f}
					value={
						typeof field === "string" && activeFilters[field] !== undefined
							? activeFilters[field]
							: typeof field === "object" &&
							  activeFilters[field.rel] !== undefined &&
							  JSON.parse(activeFilters[field.rel])[field.f]
					}
				>
					<select
						className="select select-bordered w-full my-3"
						value={
							typeof field === "string"
								? activeFilters[field] || ""
								: searchParams.get(field.rel)
								? JSON.parse(searchParams.get(field.rel) as string)[field.f]
								: ""
						}
						onChange={(e) => handleFilterChange(field, e.target.value || undefined, searchParams, router)}
					>
						<option value="">Any</option>
						{data.result[typeof field === "string" ? field : field.f].map((option: string) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</Filter>
			))}
		</>
	);
}
