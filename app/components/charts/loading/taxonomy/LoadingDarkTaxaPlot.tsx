import {
	DARK_TAXA_DEFAULT_INNER_RANK,
	DARK_TAXA_DEFAULT_OUTER_RANK,
	DARK_TAXA_DEFAULT_THRESHOLD
} from "../../wrappers/TaxonomyVisualize";
import LoadingSunburst from "../LoadingSunburst";

export default function LoadingDarkTaxaPlot() {
	return (
		<div className="relative p-6 flex flex-col items-center gap-5">
			<div className="flex justify-center items-center gap-5">
				<fieldset className="fieldset w-80">
					<legend className="fieldset-legend">
						Dark taxa threshold:
						<label className="input input-sm px-2 w-15">
							<input type="number" value={DARK_TAXA_DEFAULT_THRESHOLD} disabled />
						</label>
					</legend>

					<input type="range" min="0" max="100" value={DARK_TAXA_DEFAULT_THRESHOLD} className="range" disabled />

					<div className="flex justify-between px-2.5 text-xs">
						<span>0%</span>
						<span>25%</span>
						<span>50%</span>
						<span>75%</span>
						<span>100%</span>
					</div>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Inner ring:</legend>

					<select className="select" disabled>
						<option>{DARK_TAXA_DEFAULT_INNER_RANK}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Outer ring:</legend>

					<select className="select" disabled>
						<option>{DARK_TAXA_DEFAULT_OUTER_RANK}</option>
					</select>
				</fieldset>
			</div>

			<LoadingSunburst />

			<div className="overflow-x-auto mt-6 self-stretch max-h-100">
				<table className="table">
					<thead>
						<tr>
							<th>Taxonomy</th>
							<th># Features</th>
							<th># Samples</th>
							<th>Relative Abundance</th>
							<th>% Identity Distribution</th>
						</tr>
					</thead>

					<tbody>
						{Array.from({ length: 8 }, (_, index) => (
							<tr key={index}>
								<td>
									<div className="h-4 w-36 bg-base-content/20 rounded" />
								</td>
								<td>
									<div className="h-4 w-10 bg-base-content/20 rounded" />
								</td>
								<td>
									<div className="h-4 w-10 bg-base-content/20 rounded" />
								</td>
								<td>
									<div className="h-4 w-16 bg-base-content/20 rounded" />
								</td>
								<td>
									<div className="h-9 w-35 bg-base-content/20 rounded" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6" />
			</div>
		</div>
	);
}
