import { Assignment, Library, Occurrence, Sample, Taxonomy } from "@/app/generated/prisma/client";
import { TaxonomicRanks } from "@/types/objects";

export type Rank = (typeof TaxonomicRanks)[number];

export type OccsByFeatureid = Record<
	Occurrence["featureid"],
	{
		lib_id: Occurrence["lib_id"];
		featureid: Occurrence["featureid"];
		organismQuantity: Occurrence["organismQuantity"];
	}[]
>;

export type TaxaAssignment = {
	featureid: Assignment["featureid"];
	percent_id?: Assignment["percent_id"];
	Taxonomy: { id: Taxonomy["id"] };
};

export type TaxonomiesById = Record<Taxonomy["id"], Record<Rank, string | null>>;

const UNASSIGNED = "Unassigned";

function rankValue(taxonomiesById: TaxonomiesById, taxonomyId: number, rank: Rank) {
	return taxonomiesById[taxonomyId]?.[rank] || UNASSIGNED;
}

/** Total organismQuantity summed across every occurrence, grouped by one taxonomic rank. */
export function aggregateByRank(
	occsByFeatureid: OccsByFeatureid,
	assignments: TaxaAssignment[],
	taxonomiesById: TaxonomiesById,
	rank: Rank
) {
	const totals = new Map<string, number>();
	let grandTotal = 0;

	for (const assign of assignments) {
		const occs = occsByFeatureid[assign.featureid];
		if (!occs) continue;

		const label = rankValue(taxonomiesById, assign.Taxonomy.id, rank);
		for (const occ of occs) {
			totals.set(label, (totals.get(label) ?? 0) + occ.organismQuantity);
			grandTotal += occ.organismQuantity;
		}
	}

	return { totals, grandTotal };
}

/** Total organismQuantity summed by two nested taxonomic ranks (e.g. phylum > family). */
export function aggregateByTwoRanks(
	occsByFeatureid: OccsByFeatureid,
	assignments: TaxaAssignment[],
	taxonomiesById: TaxonomiesById,
	parentRank: Rank,
	childRank: Rank
) {
	const totals = new Map<string, Map<string, number>>(); // parent -> child -> value

	for (const assign of assignments) {
		const occs = occsByFeatureid[assign.featureid];
		if (!occs) continue;

		const parent = rankValue(taxonomiesById, assign.Taxonomy.id, parentRank);
		const child = rankValue(taxonomiesById, assign.Taxonomy.id, childRank);

		if (!totals.has(parent)) totals.set(parent, new Map());
		const childMap = totals.get(parent)!;

		for (const occ of occs) {
			childMap.set(child, (childMap.get(child) ?? 0) + occ.organismQuantity);
		}
	}

	return totals;
}

/** For each rank value, the distinct set of sample ids (not library ids) it was detected in. */
export function sampleSetsByRank(
	occsByFeatureid: OccsByFeatureid,
	assignments: TaxaAssignment[],
	taxonomiesById: TaxonomiesById,
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>,
	rank: Rank
) {
	const sets = new Map<string, Set<Sample["id"]>>();

	for (const assign of assignments) {
		const occs = occsByFeatureid[assign.featureid];
		if (!occs) continue;

		const label = rankValue(taxonomiesById, assign.Taxonomy.id, rank);
		if (!sets.has(label)) sets.set(label, new Set());
		const set = sets.get(label)!;

		for (const occ of occs) {
			if (occ.organismQuantity > 0) {
				set.add(sampleIdsByLibId[occ.lib_id]);
			}
		}
	}

	return sets;
}

/** label -> sampleId -> summed quantity, for a taxa-by-sample abundance matrix (heatmap). */
export function matrixByRankAndSample(
	occsByFeatureid: OccsByFeatureid,
	assignments: TaxaAssignment[],
	taxonomiesById: TaxonomiesById,
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>,
	rank: Rank
) {
	const matrix = new Map<string, Map<Sample["id"], number>>();

	for (const assign of assignments) {
		const occs = occsByFeatureid[assign.featureid];
		if (!occs) continue;

		const label = rankValue(taxonomiesById, assign.Taxonomy.id, rank);
		if (!matrix.has(label)) matrix.set(label, new Map());
		const row = matrix.get(label)!;

		for (const occ of occs) {
			const sampleId = sampleIdsByLibId[occ.lib_id];
			row.set(sampleId, (row.get(sampleId) ?? 0) + occ.organismQuantity);
		}
	}

	return matrix;
}

/** Per full Taxonomy id: distinct features, distinct samples, summed quantity, and every percent_id seen. */
export function perTaxonomyStats(
	occsByFeatureid: OccsByFeatureid,
	assignments: TaxaAssignment[],
	sampleIdsByLibId: Record<Library["lib_id"], Sample["id"]>
) {
	const stats = new Map<
		Taxonomy["id"],
		{ features: Set<string>; samples: Set<Sample["id"]>; quantity: number; percentIds: number[] }
	>();

	for (const assign of assignments) {
		const taxonomyId = assign.Taxonomy.id;
		if (!stats.has(taxonomyId)) {
			stats.set(taxonomyId, { features: new Set(), samples: new Set(), quantity: 0, percentIds: [] });
		}
		const entry = stats.get(taxonomyId)!;
		entry.features.add(assign.featureid);
		if (assign.percent_id != null) entry.percentIds.push(assign.percent_id);

		const occs = occsByFeatureid[assign.featureid];
		if (!occs) continue;
		for (const occ of occs) {
			if (occ.organismQuantity > 0) {
				entry.samples.add(sampleIdsByLibId[occ.lib_id]);
				entry.quantity += occ.organismQuantity;
			}
		}
	}

	return stats;
}
