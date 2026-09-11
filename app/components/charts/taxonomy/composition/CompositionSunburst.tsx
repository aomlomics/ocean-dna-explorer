"use client";

import { useRef, useState } from "react";
import {
	COMPOSITION_SUNBURST_DEFAULT_INNER_RANK,
	COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK,
	type AssignsByFeatureid,
	type TaxonomiesByName
} from "../../wrappers/TaxonomyVisualize";
import type { Chart as ChartJS } from "chart.js";
import type { TaxonomicRank } from "@/types/globals";
import { TaxonomicRanks } from "@/types/objects";
import ChartCopyButton from "../../ChartCopyButton";
import TaxonomySunburst from "../../custom/TaxonomySunburst";

export default function CompositionSunburst({
	assignsByFeatureid,
	taxonomiesByName
}: {
	assignsByFeatureid: AssignsByFeatureid;
	taxonomiesByName: TaxonomiesByName;
}) {
	const ref = useRef<ChartJS<"doughnut">>(null);

	const [parentRank, setParentRank] = useState(COMPOSITION_SUNBURST_DEFAULT_INNER_RANK);
	const [childRank, setChildRank] = useState(COMPOSITION_SUNBURST_DEFAULT_OUTER_RANK);

	return (
		<div className="flex flex-col items-center">
			<div className="w-full flex justify-center items-center gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Inner ring:</legend>

					<select
						value={parentRank}
						onChange={(e) => {
							const newParent = e.target.value as TaxonomicRank;
							const parentIndex = TaxonomicRanks.indexOf(newParent);
							const childIndex = TaxonomicRanks.indexOf(childRank);

							setParentRank(newParent);

							// Ensure the child rank remains below the parent rank.
							if (childIndex <= parentIndex) {
								setChildRank(TaxonomicRanks[parentIndex + 1] ?? newParent);
							}
						}}
						className="select"
					>
						{TaxonomicRanks.slice(0, -1).map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Outer ring:</legend>

					<select value={childRank} onChange={(e) => setChildRank(e.target.value as TaxonomicRank)} className="select">
						{TaxonomicRanks.slice(TaxonomicRanks.indexOf(parentRank) + 1).map((r) => (
							<option key={r}>{r}</option>
						))}
					</select>
				</fieldset>

				<ChartCopyButton ref={ref} />
			</div>

			<TaxonomySunburst
				ref={ref}
				assignments={Object.values(assignsByFeatureid)}
				taxonomiesByName={taxonomiesByName}
				parentRank={parentRank}
				childRank={childRank}
			/>
		</div>
	);
}
