"use client";

import LoadingChartCopyButton from "../../LoadingChartCopyButton";
import {
	COMPOSITION_SUNBURST_DEFAULT_INNER_RANK,
	COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK
} from "../../../wrappers/TaxonomyVisualize";
import LoadingSunburst from "../../LoadingSunburst";

export default function LoadingCompositionSunburst() {
	return (
		<div className="relative p-6">
			<div className="w-full flex flex-wrap justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Inner ring:</legend>

					<select className="select" disabled>
						<option>{COMPOSITION_SUNBURST_DEFAULT_INNER_RANK}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Outer ring:</legend>

					<select className="select" disabled>
						<option>{COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK}</option>
					</select>
				</fieldset>

				<LoadingChartCopyButton />
			</div>

			<div className="w-full">
				<div className="text-center text-sm font-semibold mb-4">
					{COMPOSITION_SUNBURST_DEFAULT_INNER_RANK} &gt; {COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK}
				</div>

				<LoadingSunburst />
			</div>

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6" />
			</div>
		</div>
	);
}
