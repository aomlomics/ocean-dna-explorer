"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { FilterValue, handleFilterChange, RangeFilterConfig } from "../filterHelpers";

export default function RangeFilter({ filter }: { filter: RangeFilterConfig }) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const handleFilterDebounce = useDebouncedCallback(
		(field: string | { rel: string; f: string }, value: FilterValue) => {
			handleFilterChange(field, value, searchParams, router);
		},
		100
	);

	return (
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
						handleFilterDebounce(filter.field, e.target.value ? { gte: parseInt(e.target.value) } : undefined);
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
							handleFilterDebounce(filter.field, e.target.value ? { gte: parseInt(e.target.value) } : undefined);
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
						handleFilterDebounce(filter.field, e.target.value ? { lte: parseInt(e.target.value) } : undefined);
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
							handleFilterDebounce(filter.field, e.target.value ? { lte: parseInt(e.target.value) } : undefined);
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
							inpMin.value = filter.gte.toString();
						}
						const sliderMin = document.getElementById(`${filter.field}MinSlider`) as HTMLInputElement;
						if (sliderMin) {
							sliderMin.value = filter.gte.toString();
						}

						const inpMax = document.getElementById(`${filter.field}MaxInput`) as HTMLInputElement;
						if (inpMax) {
							inpMax.value = filter.lte.toString();
						}
						const sliderMax = document.getElementById(`${filter.field}MaxSlider`) as HTMLInputElement;
						if (sliderMax) {
							sliderMax.value = filter.lte.toString();
						}

						handleFilterChange(filter.field, undefined, searchParams, router);
					}}
				>
					Clear
				</button>
			</div>
		</div>
	);
}
