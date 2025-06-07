//implicit client component

import { Dispatch, SetStateAction } from "react";
import { handleFilterChange, SelectGroupFilterConfig } from "../filterHelpers";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/app/helpers/utils";

export default function SelectGroupFilter({
	filter,
	activeFilters,
	whereByGroup,
	setWhereByGroup
}: {
	filter: SelectGroupFilterConfig;
	activeFilters: {
		[k: string]: string;
	};
	whereByGroup: Record<string, Record<string, string>>;
	setWhereByGroup: Dispatch<SetStateAction<typeof whereByGroup>>;
}) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const { data, error, isLoading } = useSWR(
		`/api/${filter.table}/fields/unique/${filter.field}${
			Object.keys(whereByGroup[filter.group]).length
				? "?" +
				  Object.entries(whereByGroup[filter.group])
						.map(([field, value]) => `${field}=${value}`)
						.join("&")
				: ""
		}`,
		fetcher
	);
	if (isLoading)
		return (
			<select
				className="select select-bordered w-full my-3"
				disabled
				value={activeFilters[filter.field] || ""}
				onChange={(e) => handleFilterChange(filter.field, e.target.value || undefined, searchParams, router)}
			>
				<option value="">Any</option>
			</select>
		);
	if (error || data.error) return <div>failed to load: {error || data.error}</div>;

	return (
		<select
			className="select select-bordered w-full my-3"
			value={activeFilters[filter.field] || ""}
			onChange={(e) => {
				handleFilterChange(filter.field, e.target.value || undefined, searchParams, router);
				const temp = { ...whereByGroup };
				temp[filter.group][filter.field] = e.target.value;
				setWhereByGroup(temp);
			}}
		>
			<option value="">Any</option>
			{data.result.map((option: string) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
	);
}
