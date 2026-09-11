import type { TaxonomicRank } from "@/types/globals";
import type { AssignsByFeatureid, TaxonomiesByName } from "../../wrappers/TaxonomyVisualize";

export const TOP_N = 25;

export function aggregateByRank(
	assignsByFeatureid: AssignsByFeatureid,
	taxonomiesByName: TaxonomiesByName,
	rank: TaxonomicRank
) {
	const totals = new Map<string, number>();
	let grandTotal = 0;

	for (const assign of Object.values(assignsByFeatureid)) {
		const label = taxonomiesByName[assign.taxonomy]![rank];

		if (label) {
			for (const occ of assign.Occurrences) {
				if (occ.organismQuantity) {
					totals.set(label, (totals.get(label) ?? 0) + occ.organismQuantity);
					grandTotal += occ.organismQuantity;
				}
			}
		}
	}

	return { totals, grandTotal };
}
