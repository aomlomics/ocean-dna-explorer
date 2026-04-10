import Link from "next/link";
import PhyloPicClient from "../../images/PhyloPicClient";
import { Taxonomy } from "@/app/generated/prisma/client";
import { useEffect, useMemo, useState } from "react";
import { RanksBySpecificity } from "@/types/objects";

const commonNameCache = new Map<string, string | null>();
const COMMON_NAME_CACHE_VERSION = "en-v2";

function getBestRank(item: Taxonomy): { rank: (typeof RanksBySpecificity)[number]; label: string; value: string } | null {
	for (const rank of RanksBySpecificity) {
		const value = item[rank]?.toString().trim();
		if (value) {
			return {
				rank,
				label: rank[0].toUpperCase() + rank.slice(1),
				value: value.replace(/_/g, " ")
			};
		}
	}
	return null;
}

function asGbifName(item: Taxonomy): string {
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

async function resolveGbifCommonName(item: Taxonomy): Promise<string | null> {
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

		const matchRes = await fetch(matchUrl.toString());
		if (!matchRes.ok) return null;
		const matchJson = (await matchRes.json()) as {
			usageKey?: number;
			speciesKey?: number;
			acceptedUsageKey?: number;
		};

		const key = matchJson.usageKey ?? matchJson.speciesKey ?? matchJson.acceptedUsageKey;
		if (!key) return null;

		const vnRes = await fetch(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=80`);
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

export default function TaxaGridItem({ item, showCommonName = true }: { item: Taxonomy; showCommonName?: boolean }) {
	const bestRank = useMemo(() => getBestRank(item), [item]);
	const [commonName, setCommonName] = useState<string | null>(null);
	const cacheKey = useMemo(() => `${COMMON_NAME_CACHE_VERSION}:${asGbifName(item)}`, [item]);

	useEffect(() => {
		if (!showCommonName) return;
		if (!cacheKey) return;
		if (commonNameCache.has(cacheKey)) {
			setCommonName(commonNameCache.get(cacheKey) ?? null);
			return;
		}

		let cancelled = false;
		resolveGbifCommonName(item).then((name) => {
			if (cancelled) return;
			commonNameCache.set(cacheKey, name);
			setCommonName(name);
		});
		return () => {
			cancelled = true;
		};
	}, [cacheKey, item, showCommonName]);

	return (
		<Link
			href={`/explore/taxonomy/${encodeURIComponent(item.taxonomy)}`}
			key={item.taxonomy}
			className="card bg-base-200 hover:bg-base-300 transition-colors duration-200 aspect-square overflow-hidden"
		>
			<div className="card-body p-2 lg:p-3 gap-0">
				<div
					className="tooltip tooltip-primary w-full wrap-break-word before:w-full! before:bg-base-100 before:text-base-content before:border before:border-base-300 mb-2"
					data-tip={item.taxonomy}
				>
					{bestRank ? (
						<div className="flex flex-col gap-0.5">
							<p className="text-primary text-xs font-medium leading-4 h-4">{bestRank.label}:</p>
							<p className="wrap-break-word text-sm leading-4">{bestRank.value}</p>
							{showCommonName ? (
								<p className="text-xs text-base-content/85 min-h-4 leading-4">
									{commonName ? commonName : "No common name found"}
								</p>
							) : null}
						</div>
					) : (
						<p className="text-sm text-error">Error: no taxonomy rank found</p>
					)}
				</div>

				<div className="grow min-h-0 border-t pt-2">
					<PhyloPicClient taxonomy={item} />
				</div>
			</div>
		</Link>
	);
}
