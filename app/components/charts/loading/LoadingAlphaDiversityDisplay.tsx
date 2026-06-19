import InfoButton from "../../InfoButton";
import BoxWhiskerPlot from "../BoxWhiskerPlot";
import { DEFAULT_HUE_FIELD, DEFAULT_X_FIELD } from "../wrappers/AlphaDiversityDisplay";
import LoadingChartCopyButton from "./LoadingChartCopyButton";

export default function LoadingAlphaDiversityDisplay() {
	const defaultHue = DEFAULT_HUE_FIELD.length ? DEFAULT_HUE_FIELD : "No hue";

	return (
		<div className="relative p-6 flex flex-col gap-2">
			<div className="w-full grid grid-cols-3 gap-5 items-center">
				<fieldset className="fieldset justify-self-end">
					<legend className="fieldset-legend">Metric:</legend>
					<select className="select" disabled>
						<option>...</option>
					</select>
				</fieldset>

				<div className="grid grid-cols-[1fr_auto_1fr] gap-3 justify-self-center items-center">
					<fieldset className="fieldset justify-self-end">
						<legend className="fieldset-legend">X Field:</legend>
						<select className="select" disabled>
							<option>{DEFAULT_X_FIELD}</option>
						</select>
					</fieldset>

					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						xmlns="http://www.w3.org/2000/svg"
						className="w-8 h-8 mt-7 text-primary/40 justify-self-center"
					>
						<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
						<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
					</svg>

					<fieldset className="fieldset justify-self-start">
						<legend className="fieldset-legend">Hue Field:</legend>
						<select className="select" disabled>
							<option>{defaultHue}</option>
						</select>
					</fieldset>
				</div>

				<LoadingChartCopyButton className="justify-self-start" />
			</div>

			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<label className="label select-none">
						<input type="checkbox" className="checkbox" />
						Show Points
					</label>
				</fieldset>

				<div className="flex gap-1">
					<InfoButton infoText="" type="warning" />

					<div className="dropdown dropdown-end">
						<button className="btn" disabled>
							0/0 {defaultHue} values
						</button>
					</div>
				</div>
			</div>

			<BoxWhiskerPlot data={{ datasets: [] }} />

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6"></span>
			</div>
		</div>
	);
}
