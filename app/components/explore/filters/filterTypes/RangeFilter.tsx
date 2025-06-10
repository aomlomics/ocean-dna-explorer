"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { FilterValue, handleFilterChange, RangeFilterConfig } from "../filterHelpers";

export default function RangeFilter({ config }: { config: RangeFilterConfig }) {
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
					id={`${config.field}MinSlider`}
					type="range"
					min={config.gte}
					max={config.lte}
					className="range"
					defaultValue={
						typeof config.field === "string"
							? (JSON.parse(searchParams.get(config.field) as string) &&
									JSON.parse(searchParams.get(config.field) as string).gte) ||
							  config.gte
							: (JSON.parse(searchParams.get(config.field.rel) as string) &&
									JSON.parse(searchParams.get(config.field.rel) as string)[config.field.f].gte) ||
							  config.gte
					}
					onChange={(e) => {
						handleFilterDebounce(config.field, e.target.value ? { gte: parseInt(e.target.value) } : undefined);
						const inp = document.getElementById(`${config.field}MinInput`) as HTMLInputElement;
						if (inp) {
							inp.value = e.target.value;
						}
					}}
				/>
				<div className="flex gap-10 w-full px-2 text-xs">
					<span>{config.gte}</span>
					<input
						id={`${config.field}MinInput`}
						className="input input-sm text-center"
						type="number"
						min={config.gte}
						max={config.lte}
						defaultValue={
							typeof config.field === "string"
								? (JSON.parse(searchParams.get(config.field) as string) &&
										JSON.parse(searchParams.get(config.field) as string).gte) ||
								  config.gte
								: (JSON.parse(searchParams.get(config.field.rel) as string) &&
										JSON.parse(searchParams.get(config.field.rel) as string)[config.field.f].gte) ||
								  config.gte
						}
						onChange={(e) => {
							handleFilterDebounce(config.field, e.target.value ? { gte: parseInt(e.target.value) } : undefined);
							const slider = document.getElementById(`${config.field}MinSlider`) as HTMLInputElement;
							if (slider) {
								slider.value = e.target.value;
							}
						}}
					/>
					<span className="justify-self-end">{config.lte}</span>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<h2>Max:</h2>
				<input
					id={`${config.field}MaxSlider`}
					type="range"
					min={config.gte}
					max={config.lte}
					className="range"
					defaultValue={
						typeof config.field === "string"
							? (JSON.parse(searchParams.get(config.field) as string) &&
									JSON.parse(searchParams.get(config.field) as string).lte) ||
							  config.lte
							: (JSON.parse(searchParams.get(config.field.rel) as string) &&
									JSON.parse(searchParams.get(config.field.rel) as string)[config.field.f].lte) ||
							  config.lte
					}
					onChange={(e) => {
						handleFilterDebounce(config.field, e.target.value ? { lte: parseInt(e.target.value) } : undefined);
						const inp = document.getElementById(`${config.field}MaxInput`) as HTMLInputElement;
						if (inp) {
							inp.value = e.target.value;
						}
					}}
				/>
				<div className="flex gap-10 w-full px-2 text-xs">
					<span>{config.gte}</span>
					<input
						id={`${config.field}MaxInput`}
						className="input input-sm text-center"
						type="number"
						min={config.gte}
						max={config.lte}
						defaultValue={
							typeof config.field === "string"
								? (JSON.parse(searchParams.get(config.field) as string) &&
										JSON.parse(searchParams.get(config.field) as string).lte) ||
								  config.lte
								: (JSON.parse(searchParams.get(config.field.rel) as string) &&
										JSON.parse(searchParams.get(config.field.rel) as string)[config.field.f].lte) ||
								  config.lte
						}
						onChange={(e) => {
							handleFilterDebounce(config.field, e.target.value ? { lte: parseInt(e.target.value) } : undefined);
							const slider = document.getElementById(`${config.field}MaxSlider`) as HTMLInputElement;
							if (slider) {
								slider.value = e.target.value;
							}
						}}
					/>
					<span className="justify-self-end">{config.lte}</span>
				</div>
				<button
					className="btn btn-sm"
					onClick={() => {
						const inpMin = document.getElementById(`${config.field}MinInput`) as HTMLInputElement;
						if (inpMin) {
							inpMin.value = config.gte.toString();
						}
						const sliderMin = document.getElementById(`${config.field}MinSlider`) as HTMLInputElement;
						if (sliderMin) {
							sliderMin.value = config.gte.toString();
						}

						const inpMax = document.getElementById(`${config.field}MaxInput`) as HTMLInputElement;
						if (inpMax) {
							inpMax.value = config.lte.toString();
						}
						const sliderMax = document.getElementById(`${config.field}MaxSlider`) as HTMLInputElement;
						if (sliderMax) {
							sliderMax.value = config.lte.toString();
						}

						handleFilterChange(config.field, undefined, searchParams, router);
					}}
				>
					Clear
				</button>
			</div>
		</div>
	);
}
