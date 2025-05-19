"use client";

import { convertDBEnum } from "@/app/helpers/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

type RangeValue = {
	gte?: number;
	lte?: number;
};

type FilterValue = string | RangeValue | undefined;

type FilterConfig = {
	type: "select" | "range";
	field: string | { rel: string; f: string };
	options?: string[];
	optionsLabels?: string[];
	enum?: Record<string, string>;
	gte?: number;
	lte?: number;
};

// Main filter component that shows in the sidebar
// Handles all the filters for a specific table (like projects or analyses)
export default function ActualTableFilter({ tableConfig }: { tableConfig: FilterConfig[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get what filters are currently active from the URL
	const activeFilters = Object.fromEntries(
		Array.from(searchParams.entries()).filter(([key]) => tableConfig.some((config) => config.field === key))
	);

	const activeFilterCount = Object.keys(activeFilters).length;

	// When someone changes a filter, update the URL
	function handleFilterChange(field: string | { rel: string; f: string }, value: FilterValue) {
		const params = new URLSearchParams(searchParams);

		if (value === undefined || value === "") {
			if (typeof field === "string") {
				params.delete(field);
			} else {
				params.delete(field.rel);
			}
		} else if (typeof value === "string") {
			if (typeof field === "string") {
				params.set(field, value);
			} else {
				params.set(field.rel, JSON.stringify({ [field.f]: value }));
			}
		} else if (typeof value === "object") {
			//range
			const temp = {} as RangeValue;

			let valObj;
			if (typeof field === "string") {
				valObj = params.get(field);
			} else {
				valObj = params.get(field.rel);
			}

			if (valObj) {
				const parsedValObj = JSON.parse(valObj);

				if (parsedValObj.gte) {
					temp.gte = parsedValObj.gte;
				}
				if (parsedValObj.lte) {
					temp.lte = parsedValObj.lte;
				}
			}

			if (value.gte) {
				temp.gte = value.gte;
			}
			if (value.lte) {
				temp.lte = value.lte;
			}

			if (typeof field === "string") {
				params.set(field, JSON.stringify(temp));
			} else {
				params.set(field.rel, JSON.stringify(temp));
			}
		}

		router.push(`?${params.toString()}`);
	}
	const handleFilterDebounce = useDebouncedCallback(
		(field: string | { rel: string; f: string }, value: FilterValue) => {
			handleFilterChange(field, value);
		},
		100
	);

	function safeJsonParse(str: string) {
		try {
			return JSON.parse(str);
		} catch {
			return str;
		}
	}

	return (
		<div className="bg-base-100 rounded-lg border border-base-300 sticky top-6">
			{/* Shows how many filters are being used */}
			<div className="flex justify-between items-center p-4 border-b border-base-300 bg-base-200/50">
				<div>
					<div className="flex items-center gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
						<h3 className="font-medium text-base-content">Filters</h3>
					</div>
					<div>
						{activeFilterCount > 0 ? (
							<span className="text-sm text-base-content/70">{activeFilterCount} active</span>
						) : (
							<span className="text-sm text-base-content/70">{"\u200b"}</span>
						)}
					</div>
				</div>
				{/* Button to clear all active filters */}
				{/* TODO: reset all fields back to default */}
				{activeFilterCount > 0 && (
					<button
						onClick={() => {
							const params = new URLSearchParams(searchParams);
							tableConfig.forEach((config) => {
								if (typeof config.field === "string") {
									params.delete(config.field);
								} else {
									params.delete(config.field.rel);
								}
							});
							router.push(`?${params.toString()}`);
						}}
						className="btn btn-primary btn-sm"
					>
						Clear all filters
					</button>
				)}
			</div>

			{/* List of all available filters */}
			<div className="divide-y divide-base-300">
				{tableConfig.map((filter) => (
					<div
						key={typeof filter.field === "string" ? filter.field : filter.field.f}
						className="collapse collapse-arrow bg-base-100"
					>
						<input type="checkbox" className="collapse-toggle" />
						<div className="collapse-title">
							<div className="flex flex-col items-start gap-1">
								<span className="font-medium text-base-content">
									{typeof filter.field === "string" ? filter.field : filter.field.f}
								</span>
								{typeof filter.field === "string" && activeFilters[filter.field] !== undefined ? (
									<span className="text-sm text-base-content/70 break-all">
										{typeof safeJsonParse(activeFilters[filter.field]) === "object"
											? (JSON.parse(activeFilters[filter.field]).gte || filter.gte) +
											  " to " +
											  (JSON.parse(activeFilters[filter.field]).lte || filter.lte)
											: activeFilters[filter.field]}
									</span>
								) : (
									typeof filter.field === "object" &&
									activeFilters[filter.field.rel] !== undefined && (
										<span className="text-sm text-base-content/70 break-all">
											{JSON.parse(activeFilters[filter.field.rel])[filter.field.f]}
										</span>
									)
								)}
							</div>
						</div>
						<div className="collapse-content bg-base-200/30 pt-0 !pb-0">
							{filter.type === "select" ? (
								<select
									className="select select-bordered w-full my-3"
									value={
										typeof filter.field === "string"
											? activeFilters[filter.field] || ""
											: searchParams.get(filter.field.rel)
											? JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f]
											: ""
									}
									onChange={(e) => handleFilterChange(filter.field, e.target.value || undefined)}
								>
									<option value="">Any</option>
									{filter.enum
										? Object.values(convertDBEnum(filter.enum)).map((option, i) => (
												<option key={option} value={option}>
													{filter.optionsLabels ? filter.optionsLabels[i] : option}
												</option>
										  ))
										: filter.options &&
										  filter.options.map((option, i) => (
												<option key={option} value={option}>
													{filter.optionsLabels ? filter.optionsLabels[i] : option}
												</option>
										  ))}
								</select>
							) : (
								filter.type === "range" && (
									<div>
										<div className="flex flex-col gap-2">
											<h2>Min:</h2>
											<input
												id={`${filter.field}MinSlider`}
												type="range"
												min={filter.gte}
												max={filter.lte}
												className="range"
												defaultValue={
													typeof filter.field === "string"
														? (JSON.parse(searchParams.get(filter.field) as string) &&
																JSON.parse(searchParams.get(filter.field) as string).gte) ||
														  filter.gte
														: (JSON.parse(searchParams.get(filter.field.rel) as string) &&
																JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f].gte) ||
														  filter.gte
												}
												onChange={(e) => {
													handleFilterDebounce(
														filter.field,
														e.target.value ? { gte: parseInt(e.target.value) } : undefined
													);
													const inp = document.getElementById(`${filter.field}MinInput`) as HTMLInputElement;
													if (inp) {
														inp.value = e.target.value;
													}
												}}
											/>
											<div className="flex gap-10 w-full px-2 text-xs">
												<span>{filter.gte}</span>
												<input
													id={`${filter.field}MinInput`}
													className="input input-sm text-center"
													type="number"
													min={filter.gte}
													max={filter.lte}
													defaultValue={
														typeof filter.field === "string"
															? (JSON.parse(searchParams.get(filter.field) as string) &&
																	JSON.parse(searchParams.get(filter.field) as string).gte) ||
															  filter.gte
															: (JSON.parse(searchParams.get(filter.field.rel) as string) &&
																	JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f].gte) ||
															  filter.gte
													}
													onChange={(e) => {
														handleFilterDebounce(
															filter.field,
															e.target.value ? { gte: parseInt(e.target.value) } : undefined
														);
														const slider = document.getElementById(`${filter.field}MinSlider`) as HTMLInputElement;
														if (slider) {
															slider.value = e.target.value;
														}
													}}
												/>
												<span className="justify-self-end">{filter.lte}</span>
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<h2>Max:</h2>
											<input
												id={`${filter.field}MaxSlider`}
												type="range"
												min={filter.gte}
												max={filter.lte}
												className="range"
												defaultValue={
													typeof filter.field === "string"
														? (JSON.parse(searchParams.get(filter.field) as string) &&
																JSON.parse(searchParams.get(filter.field) as string).lte) ||
														  filter.lte
														: (JSON.parse(searchParams.get(filter.field.rel) as string) &&
																JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f].lte) ||
														  filter.lte
												}
												onChange={(e) => {
													handleFilterDebounce(
														filter.field,
														e.target.value ? { lte: parseInt(e.target.value) } : undefined
													);
													const inp = document.getElementById(`${filter.field}MaxInput`) as HTMLInputElement;
													if (inp) {
														inp.value = e.target.value;
													}
												}}
											/>
											<div className="flex gap-10 w-full px-2 text-xs">
												<span>{filter.gte}</span>
												<input
													id={`${filter.field}MaxInput`}
													className="input input-sm text-center"
													type="number"
													min={filter.gte}
													max={filter.lte}
													defaultValue={
														typeof filter.field === "string"
															? (JSON.parse(searchParams.get(filter.field) as string) &&
																	JSON.parse(searchParams.get(filter.field) as string).lte) ||
															  filter.lte
															: (JSON.parse(searchParams.get(filter.field.rel) as string) &&
																	JSON.parse(searchParams.get(filter.field.rel) as string)[filter.field.f].lte) ||
															  filter.lte
													}
													onChange={(e) => {
														handleFilterDebounce(
															filter.field,
															e.target.value ? { lte: parseInt(e.target.value) } : undefined
														);
														const slider = document.getElementById(`${filter.field}MaxSlider`) as HTMLInputElement;
														if (slider) {
															slider.value = e.target.value;
														}
													}}
												/>
												<span className="justify-self-end">{filter.lte}</span>
											</div>
											<button
												className="btn btn-sm"
												onClick={() => {
													const inpMin = document.getElementById(`${filter.field}MinInput`) as HTMLInputElement;
													if (inpMin) {
														inpMin.value = filter.gte!.toString();
													}
													const sliderMin = document.getElementById(`${filter.field}MinSlider`) as HTMLInputElement;
													if (sliderMin) {
														sliderMin.value = filter.gte!.toString();
													}

													const inpMax = document.getElementById(`${filter.field}MaxInput`) as HTMLInputElement;
													if (inpMax) {
														inpMax.value = filter.lte!.toString();
													}
													const sliderMax = document.getElementById(`${filter.field}MaxSlider`) as HTMLInputElement;
													if (sliderMax) {
														sliderMax.value = filter.lte!.toString();
													}

													handleFilterChange(filter.field, undefined);
												}}
											>
												Clear
											</button>
										</div>
									</div>
								)
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
