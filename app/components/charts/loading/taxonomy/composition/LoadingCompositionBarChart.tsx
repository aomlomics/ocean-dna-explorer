import { COMPOSITION_BAR_DEFAULT_RANK } from "../../../wrappers/TaxonomyVisualize";
import LoadingChartCopyButton from "../../LoadingChartCopyButton";
import LoadingChart from "../../LoadingChart";

export default function LoadingCompositionBarChart() {
	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>

					<select className="select" disabled>
						<option>{COMPOSITION_BAR_DEFAULT_RANK}</option>
					</select>
				</fieldset>

				<LoadingChartCopyButton />
			</div>

			<LoadingChart />

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6" />
			</div>
		</div>
	);
}
