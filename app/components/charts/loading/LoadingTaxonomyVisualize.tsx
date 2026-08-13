import { DEFAULT_RANK } from "../wrappers/TaxonomyVisualize";
import LoadingChartCopyButton from "./LoadingChartCopyButton";
import InfoButton from "../../InfoButton";
import { RankPlurals } from "@/types/objects";
import LoadingChart from "./LoadingChart";

export default function LoadingTaxonomyVisualize() {
	return (
		<div className="relative p-6">
			<div className="w-full flex justify-center items-center gap-5 mb-2">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Taxonomic Rank:</legend>
					<select className="select" disabled>
						<option>{DEFAULT_RANK}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Display as:</legend>
					<select className="select" disabled>
						<option value="absolute">Absolute Counts</option>
						<option value="relative">Relative Abundance (%)</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Average by:</legend>
					<select className="select" disabled>
						<option>lib_id</option>
					</select>
				</fieldset>

				<button className="btn mt-7" disabled>
					Reset Zoom
				</button>

				<LoadingChartCopyButton />
			</div>

			<div className="w-full flex justify-center items-center gap-5">
				<div className="flex gap-1">
					<InfoButton text="" type="warning" />

					<div className="dropdown dropdown-end">
						<button className="btn" disabled>
							0/0 {RankPlurals[DEFAULT_RANK]}
						</button>
					</div>
				</div>

				<div className="dropdown dropdown-end">
					<button className="btn" disabled>
						0/0 lib_id values
					</button>
				</div>
			</div>

			<LoadingChart />

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6"></span>
			</div>
		</div>
	);
}
