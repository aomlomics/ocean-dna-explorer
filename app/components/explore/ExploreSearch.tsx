"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function ExploreSearch({ title, fieldOptions }: { title: string; fieldOptions: string[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [field, setField] = useState("");

	const handleSearchDebounce = useDebouncedCallback((value: string) => {
		const params = new URLSearchParams(searchParams);

		if (value === "") {
			params.delete(field);
		} else {
			if (field) {
				params.set(field, value);
			} else {
				params.set("search", value);
			}
		}

		router.push(`?${params.toString()}`);
	}, 100);

	return (
		<div className="grid grid-cols-5 items-center">
			<div className="grid grid-cols-[25%_75%] col-span-3">
				<select
					className="select select-bordered w-full rounded-r-none"
					value={field}
					onChange={(e) => setField(e.target.value)}
				>
					<option value="">Any field</option>
					{fieldOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<input
					className="input input-primary rounded-l-none"
					placeholder="Search..."
					onChange={(e) => handleSearchDebounce(e.currentTarget.value)}
				/>
			</div>

			<h1 className="text-xl font-medium text-base-content col-start-4">
				Showing all
				<span className="text-primary"> {title}</span>
			</h1>
		</div>
	);
}
