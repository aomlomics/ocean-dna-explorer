import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import { limitGbif } from "@/app/helpers/limitedFetch";
import { RanksBySpecificity } from "@/types/objects";

export function getBestRank(
	item: TaxonomyModel
): { rank: (typeof RanksBySpecificity)[number]; label: string; value: string } | null {
	for (const rank of RanksBySpecificity) {
		const value = item[rank]?.toString().trim();
		if (value) {
			return {
				rank,
				label: rank.charAt(0).toUpperCase() + rank.slice(1),
				value: value.replace(/_/g, " ")
			};
		}
	}
	return null;
}

export function asGbifName(item: TaxonomyModel): string {
	const best = getBestRank(item);
	return best?.value || item.taxonomy.split(";").pop()?.replace(/_/g, " ") || item.taxonomy;
}

function isEnglishLanguage(language: string | undefined): boolean {
	const lang = (language ?? "").trim().toLowerCase();
	if (!lang) return false;
	if (lang === "en" || lang === "eng" || lang === "english") return true;
	return lang.startsWith("en-") || lang.startsWith("en_") || lang.startsWith("eng-") || lang.startsWith("eng_");
}

function scoreEnglishVernacular(row: {
	vernacularName?: string;
	country?: string;
	preferred?: boolean;
	isPreferredName?: boolean;
}) {
	const name = row.vernacularName?.trim() ?? "";
	if (!name) return -Infinity;
	let score = 0;
	if (row.preferred || row.isPreferredName) score += 40;
	if (["US", "GB", "CA", "AU", "NZ"].includes((row.country ?? "").toUpperCase())) score += 25;
	if (/^[A-Za-z][A-Za-z\s-]*$/.test(name)) score += 5;
	return score;
}

const commonNameCache = new Map<string, Promise<string | null>>();

/** Same English common name the explore taxonomy cards show. */
export function resolveGbifCommonName(item: TaxonomyModel): Promise<string | null> {
	const key = item.taxonomy;
	const cached = commonNameCache.get(key);
	if (cached) return cached;

	const pending = resolveGbifCommonNameUncached(item);
	commonNameCache.set(key, pending);
	return pending;
}

async function resolveGbifCommonNameUncached(item: TaxonomyModel): Promise<string | null> {
	const best = getBestRank(item);
	const name = asGbifName(item);
	if (!name) return null;
	const rank = (best?.rank ?? "species").toUpperCase();

	try {
		const matchUrl = new URL("https://api.gbif.org/v1/species/match");
		matchUrl.searchParams.set("name", name);
		matchUrl.searchParams.set("rank", rank);
		if (item.kingdom) matchUrl.searchParams.set("kingdom", item.kingdom);
		if (item.phylum) matchUrl.searchParams.set("phylum", item.phylum);
		if (item.class) matchUrl.searchParams.set("class", item.class);
		if (item.order) matchUrl.searchParams.set("order", item.order);
		if (item.family) matchUrl.searchParams.set("family", item.family);
		if (item.genus) matchUrl.searchParams.set("genus", item.genus);

		const matchRes = await limitGbif(() => fetch(matchUrl.toString()));
		if (!matchRes.ok) return null;
		const matchJson = (await matchRes.json()) as {
			usageKey?: number;
			speciesKey?: number;
			acceptedUsageKey?: number;
		};

		const key = matchJson.usageKey ?? matchJson.speciesKey ?? matchJson.acceptedUsageKey;
		if (!key) return null;

		const vnRes = await limitGbif(() => fetch(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=80`));
		if (!vnRes.ok) return null;
		const vnJson = (await vnRes.json()) as {
			results?: {
				vernacularName?: string;
				language?: string;
				country?: string;
				preferred?: boolean;
				isPreferredName?: boolean;
			}[];
		};
		const rows = Array.isArray(vnJson.results) ? vnJson.results : [];
		const englishRows = rows.filter((r) => isEnglishLanguage(r.language) && r.vernacularName?.trim());
		if (!englishRows.length) return null;

		englishRows.sort((a, b) => {
			const scoreDiff = scoreEnglishVernacular(b) - scoreEnglishVernacular(a);
			if (scoreDiff !== 0) return scoreDiff;
			return (a.vernacularName ?? "").localeCompare(b.vernacularName ?? "");
		});
		return englishRows[0]?.vernacularName?.trim() || null;
	} catch {
		return null;
	}
}
