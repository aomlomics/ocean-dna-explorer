"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ImagePreviewModal from "../ImagePreviewModal";
import {
	FEATURED_ORGANISM_GROUPS,
	FEATURED_ORGANISMS,
	type FeaturedOrganism,
	type FeaturedOrganismGroup
} from "./featuredOrganisms";

type Props = {
	/**
	 * Optional override (useful for testing). Defaults to `FEATURED_ORGANISMS`.
	 */
	organisms?: FeaturedOrganism[];
};

const tabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

type IucnCategoryId = "NE" | "DD" | "LC" | "NT" | "VU" | "EN" | "CR" | "EW" | "EX";

const IUCN_LABEL: Record<IucnCategoryId, string> = {
	NE: "Not Evaluated",
	DD: "Data Deficient",
	LC: "Least Concern",
	NT: "Near Threatened",
	VU: "Vulnerable",
	EN: "Endangered",
	CR: "Critically Endangered",
	EW: "Extinct in the Wild",
	EX: "Extinct"
};

const IUCN_CLASS: Record<IucnCategoryId, string> = {
	LC: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
	NT: "bg-lime-500/10 text-lime-600 border-lime-500/20",
	VU: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	EN: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	CR: "bg-rose-500/10 text-rose-500 border-rose-500/20",
	EW: "bg-rose-500/10 text-rose-500 border-rose-500/20",
	EX: "bg-base-content/10 text-base-content/70 border-base-content/20",
	DD: "bg-base-content/10 text-base-content/60 border-base-content/15",
	NE: "bg-base-content/10 text-base-content/60 border-base-content/15"
};

/** GBIF `distributions[].threatStatus` vocabulary (aligned with IUCN categories). */
const GBIF_THREAT_TO_CATEGORY: Record<string, IucnCategoryId> = {
	NOT_EVALUATED: "NE",
	DATA_DEFICIENT: "DD",
	LEAST_CONCERN: "LC",
	NEAR_THREATENED: "NT",
	VULNERABLE: "VU",
	ENDANGERED: "EN",
	CRITICALLY_ENDANGERED: "CR",
	EXTINCT_IN_THE_WILD: "EW",
	EXTINCT: "EX"
};

const IUCN_SEVERITY: Record<IucnCategoryId, number> = {
	NE: 0,
	DD: 1,
	LC: 2,
	NT: 3,
	VU: 4,
	EN: 5,
	CR: 6,
	EW: 7,
	EX: 8
};

function pickWorstCategory(rows: { threatStatus?: string }[]): IucnCategoryId | null {
	let picked: IucnCategoryId | null = null;
	let worst = -1;
	for (const r of rows) {
		const raw = (r.threatStatus ?? "").trim();
		if (!raw || raw.toUpperCase() === "NOT_APPLICABLE") continue;
		const key = raw.toUpperCase().replace(/\s+/g, "_");
		const id = GBIF_THREAT_TO_CATEGORY[key];
		if (!id) continue;
		const sev = IUCN_SEVERITY[id];
		if (sev > worst) {
			worst = sev;
			picked = id;
		}
	}
	return picked;
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

const commonNameCache = new Map<number, string | null>();
const iucnCache = new Map<number, IucnCategoryId | null>();
const gbifKeyByNameCache = new Map<string, number | null>();

async function resolveGbifTaxonKeyFromName(name: string): Promise<number | null> {
	const key = name.trim();
	if (!key) return null;
	if (gbifKeyByNameCache.has(key)) return gbifKeyByNameCache.get(key) ?? null;
	try {
		const matchUrl = new URL("https://api.gbif.org/v1/species/match");
		matchUrl.searchParams.set("name", key);
		const res = await fetch(matchUrl.toString());
		if (!res.ok) {
			gbifKeyByNameCache.set(key, null);
			return null;
		}
		const json = (await res.json()) as {
			usageKey?: number;
			speciesKey?: number;
			acceptedUsageKey?: number;
			confidence?: number;
		};
		const resolved = json.usageKey ?? json.speciesKey ?? json.acceptedUsageKey ?? null;
		const numeric = resolved != null ? Number(resolved) : null;
		const out = Number.isFinite(numeric) ? (numeric as number) : null;
		gbifKeyByNameCache.set(key, out);
		return out;
	} catch {
		gbifKeyByNameCache.set(key, null);
		return null;
	}
}

async function fetchGbifCommonName(taxonKey: number): Promise<string | null> {
	try {
		const res = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/vernacularNames?limit=80`);
		if (!res.ok) return null;
		const json = (await res.json()) as {
			results?: {
				vernacularName?: string;
				language?: string;
				country?: string;
				preferred?: boolean;
				isPreferredName?: boolean;
			}[];
		};
		const rows = Array.isArray(json?.results) ? json.results : [];
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

async function fetchGbifIucnCategory(taxonKey: number): Promise<IucnCategoryId | null> {
	try {
		const res = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/distributions?limit=200`);
		if (!res.ok) return null;
		const json = (await res.json()) as { results?: { threatStatus?: string }[] };
		const rows = Array.isArray(json?.results) ? json.results : [];
		return pickWorstCategory(rows);
	} catch {
		return null;
	}
}

export default function FeaturedOrganismsGrid({ organisms }: Props) {
	const all = organisms ?? FEATURED_ORGANISMS;
	const [activeGroup, setActiveGroup] = useState<FeaturedOrganismGroup>(FEATURED_ORGANISM_GROUPS[0]!.id);
	const groupOrganisms = useMemo(() => all.filter((o) => o.group === activeGroup).slice(0, 6), [all, activeGroup]);

	return (
		<div className="space-y-4">
			<nav
				className="flex min-w-0 flex-wrap content-center items-center gap-2 sm:gap-2"
				aria-label="Featured organism groups"
			>
				{FEATURED_ORGANISM_GROUPS.map((g) => {
					const active = g.id === activeGroup;
					return (
						<button
							key={g.id}
							type="button"
							onClick={() => setActiveGroup(g.id)}
							className={`${tabBase} ${
								active
									? "bg-primary text-primary-content shadow-md"
									: "bg-base-200/90 text-base-content hover:bg-base-300 active:brightness-95"
							}`}
							aria-current={active ? "true" : undefined}
						>
							{g.label}
						</button>
					);
				})}
			</nav>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 max-w-7xl mx-auto">
				{groupOrganisms.length ? (
					groupOrganisms.map((o) => <FeaturedOrganismCard key={o.id} organism={o} />)
				) : (
					<div className="col-span-full text-sm text-base-content/60 bg-base-200 rounded-lg p-4">
						No featured organisms added for this group yet.
					</div>
				)}
			</div>
		</div>
	);
}

function FeaturedOrganismCard({ organism }: { organism: FeaturedOrganism }) {
	const initialTaxonKey = organism.gbifTaxonKey;
	const [taxonKey, setTaxonKey] = useState<number | null>(initialTaxonKey ?? null);
	const [commonName, setCommonName] = useState<string | null>(null);
	const [iucn, setIucn] = useState<IucnCategoryId | null>(null);
	const [loadingMeta, setLoadingMeta] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	const iucnLabel = iucn ? IUCN_LABEL[iucn] : null;
	const viewHref = organism.taxonomyString
		? `/explore/taxonomy/${encodeURIComponent(organism.taxonomyString)}`
		: "/explore/taxonomy";
	const imageSrc = organism.imageSrc ?? "";

	useEffect(() => {
		let cancelled = false;

		async function run() {
			setLoadingMeta(true);

			let key = initialTaxonKey ?? taxonKey;
			if (!key) {
				key = await resolveGbifTaxonKeyFromName(organism.taxonomyName);
			}
			if (cancelled) return;
			setTaxonKey(key ?? null);

			if (!key) {
				setCommonName(null);
				setIucn(null);
				setLoadingMeta(false);
				return;
			}

			if (commonNameCache.has(key)) {
				setCommonName(commonNameCache.get(key) ?? null);
			}
			if (iucnCache.has(key)) {
				setIucn(iucnCache.get(key) ?? null);
			}
			if (commonNameCache.has(key) && iucnCache.has(key)) {
				setLoadingMeta(false);
				return;
			}

			const [cn, cat] = await Promise.all([fetchGbifCommonName(key), fetchGbifIucnCategory(key)]);
			if (cancelled) return;
			commonNameCache.set(key, cn);
			iucnCache.set(key, cat);
			setCommonName(cn);
			setIucn(cat);
			setLoadingMeta(false);
		}

		void run();
		return () => {
			cancelled = true;
		};
		// Intentionally tied to the organism identity.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [organism.id]);

	return (
		<div className="relative bg-base-200 rounded-2xl overflow-visible shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_6px_18px_-12px_rgba(0,0,0,0.45),0_1px_3px_-1px_rgba(0,0,0,0.18)]">
			<div className="relative w-full overflow-hidden rounded-t-2xl bg-base-300/40 aspect-16/10">
				{imageSrc ? (
					<button
						type="button"
						className="absolute inset-0 z-10 block cursor-zoom-in"
						onClick={() => setPreviewOpen(true)}
						aria-label={`Open full-size image for ${organism.taxonomyName}`}
					>
						<Image
							src={imageSrc}
							alt={organism.taxonomyName}
							fill
							className="object-cover object-center"
							sizes="(max-width: 1024px) 100vw, 33vw"
						/>
					</button>
				) : (
					<div
						className="absolute inset-0"
						style={{
							background:
								"radial-gradient(circle at 25% 25%, rgba(125,186,229,0.35), transparent 55%), radial-gradient(circle at 75% 80%, rgba(35,61,127,0.5), transparent 60%), linear-gradient(135deg, #0f1a33 0%, #1a2f63 100%)"
						}}
					/>
				)}

				{organism.imageAttribution ? <InlineAttributionBadge attribution={organism.imageAttribution} /> : null}
			</div>
			{imageSrc ? (
				<ImagePreviewModal
					isOpen={previewOpen}
					onClose={() => setPreviewOpen(false)}
					src={imageSrc}
					alt={organism.taxonomyName}
				/>
			) : null}

			<div className="p-5 sm:p-6 flex flex-col gap-2.5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h4 className="text-lg sm:text-xl font-semibold text-base-content leading-tight italic line-clamp-2 px-0.5 -mx-0.5">
							{organism.taxonomyName}
						</h4>
						<p className="text-sm text-base-content/75 leading-snug">
							{taxonKey
								? commonName
									? commonName
									: loadingMeta
										? "Loading common name..."
										: "No common name found???"
								: loadingMeta
									? "Loading common name..."
									: "No common name found???"}
						</p>
					</div>

					{iucn ? (
						<span
							className={[
								"shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
								IUCN_CLASS[iucn]
							].join(" ")}
							title="IUCN Red List status (via GBIF)"
						>
							<span className="opacity-70 font-semibold tracking-wider">IUCN</span>
							<span aria-hidden="true" className="opacity-40">
								·
							</span>
							<span>{iucnLabel}</span>
						</span>
					) : (
						<span className="shrink-0 text-[11px] text-base-content/60">
							{loadingMeta ? "Loading IUCN..." : "IUCN unavailable"}
						</span>
					)}
				</div>

				<p className="text-sm text-base-content/65 leading-relaxed line-clamp-5">{organism.description}</p>

				<div className="pt-2 flex justify-end">
					<Link href={viewHref} className="btn btn-sm btn-primary">
						View taxonomy
					</Link>
				</div>
			</div>
		</div>
	);
}

function InlineAttributionBadge({ attribution }: { attribution: string }) {
	const [hover, setHover] = useState(false);
	return (
		<div
			className="absolute right-2 top-2 z-50"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div className="relative">
				<div className="w-9 h-9 rounded-full bg-base-100/70 border border-base-200 backdrop-blur flex items-center justify-center shadow-sm">
					<span className="block w-5 h-5 bg-primary mask-[url('/images/icons/photo_icon.svg')] mask-contain mask-no-repeat mask-center [-webkit-mask-image:url('/images/icons/photo_icon.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]" />
				</div>
				{hover ? (
					<div className="absolute top-full right-0 mt-2 p-3 rounded-lg shadow-lg bg-base-100/90 backdrop-blur text-base-content max-w-[85vw] sm:max-w-sm w-72 border border-base-200">
						<div className="text-xs sm:text-sm space-y-0.5 wrap-break-word">
							<p>
								<span className="text-base-content/70">Attribution:</span>{" "}
								<span className="text-base-content font-medium">{attribution}</span>
							</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
