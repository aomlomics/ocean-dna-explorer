import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import { RanksBySpecificity } from "@/types/objects";

/**
 * GBIF backbone match used by PhyloPicClient + taxonomy page (species suggest + rank filter).
 * Rank values from Opal often use underscores or spaces; we normalize for GBIF suggest like the pre-PhyloPic server path.
 */
export type GbifPhylopicMatch = {
	record: Record<string, unknown>;
	objectIDs: string;
	rankMatched: string;
	taxonKey: number;
	mediaTaxonKey: number;
};

function buildObjectIds(gbifTaxonomy: Record<string, any>): string {
	return (
		`${gbifTaxonomy.speciesKey ? gbifTaxonomy.speciesKey + "," : ""}` +
		`${gbifTaxonomy.genusKey ? gbifTaxonomy.genusKey + "," : ""}` +
		`${gbifTaxonomy.familyKey ? gbifTaxonomy.familyKey + "," : ""}` +
		`${gbifTaxonomy.orderKey ? gbifTaxonomy.orderKey + "," : ""}` +
		`${gbifTaxonomy.classKey ? gbifTaxonomy.classKey + "," : ""}` +
		`${gbifTaxonomy.phylumKey ? gbifTaxonomy.phylumKey + "," : ""}` +
		`${gbifTaxonomy.kingdomKey ? gbifTaxonomy.kingdomKey : ""}`
	);
}

function normName(s: string): string {
	return s.toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Opal rank field is usable for GBIF suggest (letters, digits, underscore, space, period, hyphen).
 */
function isPlausibleRankValue(raw: string): boolean {
	return /^[a-zA-Z0-9][a-zA-Z0-9_\s.'-]*$/i.test(raw);
}

/**
 * Among several ACCEPTED hits at the same rank, pick the one whose canonical / scientific name matches the query.
 */
function pickAcceptedForRank(
	candidates: Record<string, any>[],
	rank: string,
	suggestQuery: string
): Record<string, any> | null {
	const filtered = candidates.filter(
		(t) => (t.rank ?? "").toString().toLowerCase() === rank && t.status === "ACCEPTED"
	);
	if (!filtered.length) return null;
	if (filtered.length === 1) return filtered[0]!;

	const q = normName(suggestQuery);
	const byCanon = filtered.filter((t) => normName((t.canonicalName ?? "").toString()) === q);
	if (byCanon.length === 1) return byCanon[0]!;

	const bySci = filtered.filter((t) => normName((t.scientificName ?? "").toString()) === q);
	if (bySci.length === 1) return bySci[0]!;

	const byCanonPrefix = filtered.filter((t) => {
		const c = normName((t.canonicalName ?? "").toString());
		return c === q || c.startsWith(`${q} `) || q.startsWith(`${c} `);
	});
	if (byCanonPrefix.length === 1) return byCanonPrefix[0]!;

	if (rank === "species" && q.includes(" ")) {
		const parts = q.split(" ").filter(Boolean);
		if (parts.length >= 2) {
			const g = parts[0];
			const epithet = parts[parts.length - 1];
			const byGenusEpithet = filtered.filter((t) => {
				const tg = normName((t.genus ?? "").toString());
				const sp = normName((t.specificEpithet ?? "").toString());
				return tg === g && sp === epithet;
			});
			if (byGenusEpithet.length === 1) return byGenusEpithet[0]!;
		}
	}

	return null;
}

export async function matchGbifForPhylopic(taxonomy: TaxonomyModel): Promise<GbifPhylopicMatch | null> {
	let gbifTaxonomy: Record<string, any> | undefined;
	let rankMatched = "";

	try {
		for (const rank of RanksBySpecificity) {
			const rawRank = taxonomy[rank]?.toString().trim();
			if (!rawRank || !isPlausibleRankValue(rawRank)) continue;

			const suggestQuery = rawRank.replace(/_/g, " ").replace(/\s+/g, " ").trim();
			const gbifTaxaRes = await fetch(`https://api.gbif.org/v1/species/suggest?q=${suggestQuery}`);
			const gbifTaxa = await gbifTaxaRes.json();
			if (!Array.isArray(gbifTaxa)) continue;

			const picked = pickAcceptedForRank(gbifTaxa, rank, suggestQuery);
			if (picked) {
				gbifTaxonomy = picked;
				rankMatched = rank;
				break;
			}
		}
	} catch {
		return null;
	}

	if (!gbifTaxonomy) return null;

	const taxonKeyRaw = gbifTaxonomy.key ?? gbifTaxonomy.nubKey;
	if (taxonKeyRaw == null) return null;

	const taxonKey = Number(taxonKeyRaw);
	const objectIDs = buildObjectIds(gbifTaxonomy);
	const mediaTaxonKey = Number(gbifTaxonomy.nubKey ?? taxonKey);

	return {
		record: gbifTaxonomy,
		objectIDs,
		rankMatched,
		taxonKey,
		mediaTaxonKey
	};
}
