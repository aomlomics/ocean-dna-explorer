import {
	ABUNDANCE_DEFAULT_RANK,
	SAMPLE_ABUNDANCE_DEFAULT_FIELD,
	SAMPLE_ABUNDANCE_DEFAULT_LEGEND_FIELD
} from "../../wrappers/TaxonomyVisualize";
import LoadingChart from "../LoadingChart";
import LoadingChartCopyButton from "../LoadingChartCopyButton";

export default function LoadingSampleTaxaAbundance() {
	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select className="select" disabled>
						<option>{ABUNDANCE_DEFAULT_RANK}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Value:</legend>
					<select className="select" disabled>
						<option>...</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend w-full flex justify-between gap-2">
						<span>X-Axis:</span>
						<label className="label select-none">
							Reverse
							<input className="checkbox checkbox-sm" type="checkbox" disabled />
						</label>
					</legend>
					<select className="select" disabled>
						<option>{SAMPLE_ABUNDANCE_DEFAULT_FIELD}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Color points by:</legend>
					<select className="select" disabled>
						<option>{SAMPLE_ABUNDANCE_DEFAULT_LEGEND_FIELD}</option>
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
