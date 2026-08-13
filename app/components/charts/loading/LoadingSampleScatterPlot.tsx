import { DEFAULT_LEGEND_FIELD, DEFAULT_X_FIELD, DEFAULT_Y_FIELD } from "../wrappers/SampleVisualize";
import LoadingChart from "./LoadingChart";
import LoadingChartCopyButton from "./LoadingChartCopyButton";

export default function LoadingSampleScatterPlot() {
	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5">
				<div className="flex justify-center items-center gap-2">
					<fieldset className="fieldset">
						<legend className="fieldset-legend w-full flex justify-between gap-2">
							<span>X-Axis:</span>
							<label className="label select-none">
								Reverse
								<input className="checkbox checkbox-sm" type="checkbox" disabled />
							</label>
						</legend>
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
						className="w-8 h-8 mt-7 text-primary/40"
					>
						<path fill="currentColor" d="M21 7.5L8 7.5M21 7.5L16.6667 3M21 7.5L16.6667 12" />
						<path fill="currentColor" d="M4 16.5L17 16.5M4 16.5L8.33333 21M4 16.5L8.33333 12" />
					</svg>

					<fieldset className="fieldset">
						<legend className="fieldset-legend w-full flex justify-between gap-2">
							<span>Y-Axis:</span>
							<label className="label select-none">
								Reverse
								<input className="checkbox checkbox-sm" type="checkbox" disabled />
							</label>
						</legend>
						<select className="select" disabled>
							<option>{DEFAULT_Y_FIELD}</option>
						</select>
					</fieldset>
				</div>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select className="select" disabled>
						<option>{DEFAULT_LEGEND_FIELD}</option>
					</select>
				</fieldset>

				<button className="btn mt-7" disabled>
					Reset Zoom
				</button>

				<LoadingChartCopyButton />
			</div>

			<LoadingChart />

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6"></span>
			</div>
		</div>
	);
}
