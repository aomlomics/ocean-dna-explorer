import { HEATMAP_DEFAULT_RANK } from "../../wrappers/TaxonomyVisualize";
import LoadingChartCopyButton from "../LoadingChartCopyButton";
import LoadingChart from "../LoadingChart";

const TOP_N = 30;

export default function LoadingTaxaSampleHeatmap() {
	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>

					<select className="select" disabled>
						<option>{HEATMAP_DEFAULT_RANK}</option>
					</select>
				</fieldset>

				<LoadingChartCopyButton />
			</div>

			<p className="text-center text-sm opacity-70 mb-2">
				Showing the {TOP_N} most-prevalent {HEATMAP_DEFAULT_RANK} values. Each row&apos;s colored cells show which
				sample it was detected in
			</p>

			<LoadingChart />

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6" />
			</div>
		</div>
	);
}
