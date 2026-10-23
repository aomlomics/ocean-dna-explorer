"use client";

import Image from "next/image";
import Link from "next/link";
import { PhotoIcon } from "@/app/components/icons";
import { exploreUrl } from "@/app/helpers/utils";
import { useEffect, useMemo, useState } from "react";
import { MasonryPhotoAlbum, type Photo, type RenderImageContext, type RenderImageProps } from "react-photo-album";
import "react-photo-album/masonry.css";
import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import type { AttributionModel, ImageModel } from "@/app/generated/prismaImages/models";

export type SpotlightWithImage = TaxonomySpotlightModel & {
	Image?: ImageModel & { Attribution: AttributionModel | null };
};

function cleanAttributionValue(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

const DEFAULT_IMAGE_SRC = "/images/featured_organisms/lanternfish.webp";

const IUCN_BADGE_CLASS: Record<string, string> = {
	"Least Concern": "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
	"Near Threatened": "border-lime-500/30 bg-lime-500/10 text-lime-600",
	Vulnerable: "border-amber-500/30 bg-amber-500/10 text-amber-600",
	Endangered: "border-orange-500/30 bg-orange-500/10 text-orange-600",
	"Critically Endangered": "border-rose-500/30 bg-rose-500/10 text-rose-600",
	"Data Deficient": "border-base-content/20 bg-base-content/10 text-base-content/70",
	"Not Evaluated": "border-base-content/20 bg-base-content/10 text-base-content/70"
};

/** GBIF `distributions[].threatStatus` vocabulary, ordered from least to most severe. */
const GBIF_THREAT_LABELS: [string, string][] = [
	["NOT_EVALUATED", "Not Evaluated"],
	["DATA_DEFICIENT", "Data Deficient"],
	["LEAST_CONCERN", "Least Concern"],
	["NEAR_THREATENED", "Near Threatened"],
	["VULNERABLE", "Vulnerable"],
	["ENDANGERED", "Endangered"],
	["CRITICALLY_ENDANGERED", "Critically Endangered"],
	["EXTINCT_IN_THE_WILD", "Extinct in the Wild"],
	["EXTINCT", "Extinct"]
];

const gbifCommonNameCache = new Map<number, string | null>();
const gbifKeyByNameCache = new Map<string, number | null>();

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
}): number {
	const name = row.vernacularName?.trim() ?? "";
	if (!name) return -Infinity;
	let score = 0;
	if (row.preferred || row.isPreferredName) score += 40;
	if (["US", "GB", "CA", "AU", "NZ"].includes((row.country ?? "").toUpperCase())) score += 25;
	if (/^[A-Za-z][A-Za-z\s-]*$/.test(name)) score += 5;
	return score;
}

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
		const json = (await res.json()) as { usageKey?: number; speciesKey?: number; acceptedUsageKey?: number };
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

/** Returns the most severe IUCN category GBIF reports for the taxon, or null if none. */
async function fetchGbifIucnStatus(taxonKey: number): Promise<string | null> {
	try {
		const res = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/distributions?limit=200`);
		if (!res.ok) return null;
		const json = (await res.json()) as { results?: { threatStatus?: string }[] };
		const statuses = new Set(
			(json.results ?? []).map((r) => (r.threatStatus ?? "").trim().toUpperCase().replace(/\s+/g, "_"))
		);
		const worst = GBIF_THREAT_LABELS.findLast(([status]) => statuses.has(status));
		return worst ? worst[1] : null;
	} catch {
		return null;
	}
}

/** Scientific name is the last rank of the taxonomy path (e.g. "...;Mola;Mola_mola;" -> "Mola mola"). */
function getScientificName(taxonomy: string): string {
	const lastRank = taxonomy.split(";").findLast((rank) => rank.trim());
	return lastRank?.trim().replace(/_/g, " ") || taxonomy;
}

/**
 * react-photo-album photo shape, extended with the full spotlight so a click
 * handler can recover the original data object from the clicked photo.
 */
type OrganismPhoto = Photo & { spotlight: SpotlightWithImage };

type PhotoSize = { width: number; height: number };

/**
 * Map spotlight data into the photo format the library accepts. The Image table
 * has no intrinsic image dimensions, so each tile starts as a square 800x800 and
 * switches to its measured size once the image has loaded in the browser.
 */
function toOrganismPhotos(spotlights: SpotlightWithImage[], sizesById: Record<number, PhotoSize>): OrganismPhoto[] {
	return spotlights.map((spotlight) => ({
		key: String(spotlight.id),
		src: spotlight.imageFileUrl_ODE || DEFAULT_IMAGE_SRC,
		width: sizesById[spotlight.id]?.width ?? 800,
		height: sizesById[spotlight.id]?.height ?? 800,
		alt: spotlight.commonName?.trim() || getScientificName(spotlight.taxonomy),
		spotlight
	}));
}

// Responsive masonry column count, driven by the library's measured container width.
// The grid now lives in a 2/3-width column, so we lean toward more, smaller tiles.
function masonryColumns(containerWidth: number): number {
	if (containerWidth < 400) return 2;
	if (containerWidth < 600) return 3;
	if (containerWidth < 900) return 4;
	return 5;
}

export default function FeaturedOrganisms({ spotlights }: { spotlights: SpotlightWithImage[] }) {
	// `null` until the user picks a tile; the detail panel falls back to `activeOrganism` below.
	const [selectedOrganism, setSelectedOrganism] = useState<SpotlightWithImage | null>(null);
	const [gbifCommonNamesById, setGbifCommonNamesById] = useState<Record<number, string>>({});
	const [sizesById, setSizesById] = useState<Record<number, PhotoSize>>({});

	// Map the spotlight data into react-photo-album's photo shape.
	const photos = useMemo(() => toOrganismPhotos(spotlights, sizesById), [spotlights, sizesById]);

	// Pick a random default once on the client so the detail panel is never empty.
	// Must be an effect: Math.random() during render fails the purity lint, and during SSR
	// it would mismatch the server HTML and the browser HTML.
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setSelectedOrganism((current) => current ?? spotlights[Math.floor(Math.random() * spotlights.length)]!);
	}, []);

	// The spotlight shown in the detail panel. Falls back to the first entry during the
	// brief pre-mount window before the random default is applied.
	const activeOrganism = selectedOrganism ?? spotlights[0]!;

	useEffect(() => {
		let cancelled = false;

		async function loadMissingCommonNames() {
			const targets = spotlights.filter((spotlight) => {
				const hasLocalCommonName = Boolean(spotlight.commonName?.trim());
				const alreadyLoaded = Boolean(gbifCommonNamesById[spotlight.id]);
				return !hasLocalCommonName && !alreadyLoaded;
			});
			if (!targets.length) return;

			const resolvedEntries = await Promise.all(
				targets.map(async (spotlight): Promise<[number, string | null]> => {
					const taxonKey = await resolveGbifTaxonKeyFromName(getScientificName(spotlight.taxonomy));
					if (!taxonKey) return [spotlight.id, null];
					if (gbifCommonNameCache.has(taxonKey)) {
						return [spotlight.id, gbifCommonNameCache.get(taxonKey) ?? null];
					}
					const gbifName = await fetchGbifCommonName(taxonKey);
					gbifCommonNameCache.set(taxonKey, gbifName);
					return [spotlight.id, gbifName];
				})
			);

			if (cancelled) return;
			setGbifCommonNamesById((prev) => {
				const next = { ...prev };
				let changed = false;
				for (const [id, commonName] of resolvedEntries) {
					if (commonName?.trim()) {
						const normalized = commonName.trim();
						if (next[id] !== normalized) {
							next[id] = normalized;
							changed = true;
						}
					}
				}
				return changed ? next : prev;
			});
		}

		void loadMissingCommonNames();
		return () => {
			cancelled = true;
		};
	}, [gbifCommonNamesById]);

	function getDisplayCommonName(spotlight: SpotlightWithImage): string {
		const local = spotlight.commonName?.trim();
		if (local) return local;
		const fromGbif = gbifCommonNamesById[spotlight.id]?.trim();
		if (fromGbif) return fromGbif;
		return getScientificName(spotlight.taxonomy);
	}

	// Custom image renderer: inject the native Next.js Image into each masonry slot.
	// react-photo-album measures and sizes every tile for us, so we render the Image
	// with `fill` inside a relative, aspect-ratio box and let it cover the slot.
	function renderOrganismImage(
		{ alt, sizes }: RenderImageProps,
		{ photo, width, height }: RenderImageContext<OrganismPhoto>
	) {
		const isSelected = photo.spotlight.id === activeOrganism.id;
		const label = getDisplayCommonName(photo.spotlight);
		return (
			<div
				className={[
					"relative overflow-hidden rounded-xl bg-base-100/80",
					isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-base-200" : ""
				].join(" ")}
				style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
			>
				<Image
					src={photo.src}
					alt={alt ?? ""}
					fill
					sizes={sizes}
					className="object-cover object-center"
					onLoad={(e) => {
						const id = photo.spotlight.id;
						const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
						setSizesById((prev) => (prev[id] ? prev : { ...prev, [id]: { width, height } }));
					}}
				/>
				{/* Always-visible common name across the bottom of every grid tile. */}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-2 pb-1.5 pt-6">
					<p className="truncate text-center text-xs font-semibold text-white">{label}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 lg:flex-row">
			{/* Left: the trading card, centered against the fixed-height photo grid. */}
			<div className="lg:w-1/3 lg:self-center">
				<SelectedOrganismCard
					key={activeOrganism.id}
					spotlight={activeOrganism}
					resolvedCommonName={getDisplayCommonName(activeOrganism)}
				/>
			</div>

			{/* Right: the masonry grid (master list). */}
			<div className="lg:w-2/3">
				<div className="rounded-2xl bg-base-200 p-3 shadow-sm md:p-4">
					{/* Padding on all sides leaves room for the selected tile's ring, which the scroll box would otherwise clip. */}
					<div className="h-[75vh] overflow-y-auto p-1">
						<MasonryPhotoAlbum
							photos={photos}
							columns={masonryColumns}
							spacing={12}
							sizes={{
								size: "calc(100vw - 2rem)",
								sizes: [{ viewport: "(min-width: 1024px)", size: "60vw" }]
							}}
							render={{ image: renderOrganismImage }}
							onClick={({ photo }) => setSelectedOrganism(photo.spotlight)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function SelectedOrganismCard({
	spotlight,
	resolvedCommonName
}: {
	spotlight: SpotlightWithImage;
	resolvedCommonName: string;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	// `undefined` while the GBIF lookup is in flight.
	const [iucnStatus, setIucnStatus] = useState<string>();
	const commonName = resolvedCommonName;
	const scientificName = getScientificName(spotlight.taxonomy);
	const imageSrc = spotlight.imageFileUrl_ODE || DEFAULT_IMAGE_SRC;
	const imageAttribution = getImageAttributionDetails(spotlight);
	const taxonomyHref = exploreUrl({ table: "taxonomy", taxonomy: spotlight.taxonomy });

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const taxonKey = await resolveGbifTaxonKeyFromName(scientificName);
			const status = taxonKey ? await fetchGbifIucnStatus(taxonKey) : null;
			if (!cancelled) setIucnStatus(status ?? "Not Evaluated");
		})();
		return () => {
			cancelled = true;
		};
	}, [scientificName]);

	return (
		<div className="flex flex-col items-center">
			{/*
			 * daisyUI hover-3d tilts its first child using the 8 empty hover-zone divs layered on top,
			 * so nothing inside the card face can be clickable, hoverable, or scrollable.
			 */}
			<div className="hover-3d z-2 w-full">
				{/*
				 * The trading-card look is built from stacked frames: outer stock border ->
				 * inner frame -> art frame -> text-box frame, plus gradient "gloss" overlays.
				 */}
				<div className="relative w-full overflow-hidden rounded-2xl border-[5px] border-primary/75 bg-linear-to-br from-base-200/82 via-base-100/92 to-base-200/80 p-2 shadow-[0_14px_45px_-12px_rgba(0,0,0,0.6)] sm:p-2.5">
					{/* Holo-like shading in ODE blues only (no white), kept subtle. */}
					<div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(125%_76%_at_50%_-4%,rgba(100,171,220,0.14),transparent_52%),radial-gradient(120%_70%_at_8%_0%,rgba(35,61,127,0.11),transparent_55%),radial-gradient(95%_70%_at_92%_8%,rgba(14,165,233,0.09),transparent_58%),radial-gradient(78%_60%_at_85%_96%,rgba(100,171,220,0.1),transparent_60%)]" />
					<div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,transparent_0%,rgba(35,61,127,0.05)_30%,transparent_52%,rgba(100,171,220,0.08)_78%,rgba(56,189,248,0.08)_92%,transparent_100%)] opacity-55" />

					{/* Centered top notch tab, connected to top border. */}
					<div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-px">
						<div className="bg-primary/75 p-0.5 [clip-path:polygon(0_0,100%_0,100%_76%,92%_100%,8%_100%,0_76%)]">
							<div className="bg-base-200/92 px-5 py-px [clip-path:polygon(0_0,100%_0,100%_76%,92%_100%,8%_100%,0_76%)]">
								<span className="text-[11px] font-semibold text-primary/90">oceandnaexplorer.org</span>
							</div>
						</div>
					</div>

					{/* Inner frame (the card's second line). */}
					<div className="relative z-10 flex flex-col gap-2.5 rounded-xl p-3 pt-6 sm:p-3.5 sm:pt-6">
						{/* Header: name + scientific name (left), ODE logo emblem (right). */}
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<h3 className="truncate text-xl font-extrabold leading-tight text-base-content sm:text-2xl">
									{commonName}
								</h3>
								<p className="mt-0.5 truncate text-sm italic leading-snug text-base-content/60">{scientificName}</p>
							</div>
							<Image
								src="/images/ode_logo_clean.svg"
								alt=""
								width={40}
								height={40}
								className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
							/>
						</div>

						{/* Card art window (framed + beveled; kept short so the text box breathes). */}
						<div className="relative aspect-3/2 w-full overflow-hidden rounded-lg border-2 border-primary/75 bg-base-300/40 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
							{imageFailed ? (
								<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-sky-900/70 to-indigo-900/70 text-5xl font-semibold text-white/85">
									{commonName.charAt(0).toUpperCase()}
								</div>
							) : (
								<Image
									src={imageSrc}
									alt={commonName}
									fill
									sizes="(max-width: 1024px) 100vw, 420px"
									className="object-cover object-center"
									onError={() => setImageFailed(true)}
								/>
							)}
						</div>

						{/* IUCN status strip. */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-base-content/60">IUCN status</span>
							<span
								className={[
									"inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
									IUCN_BADGE_CLASS[iucnStatus ?? ""] ?? IUCN_BADGE_CLASS["Not Evaluated"]
								].join(" ")}
							>
								{iucnStatus ?? "Loading..."}
							</span>
						</div>

						{/* Description box (the "attack text" area). Fixed height + clamp so every card is the same size. */}
						<div className="rounded-lg border border-base-content/10 bg-base-100/60 p-3">
							<p className="line-clamp-6 h-34 text-sm leading-relaxed text-base-content/85">{spotlight.description}</p>
						</div>

						{/* Footer: source project + reserved QR spot. */}
						<div className="flex items-center justify-between gap-2 border-t border-base-content/10 pt-2">
							<span className="truncate text-xs text-base-content/60">
								Project: <span className="font-semibold text-base-content/80">{spotlight.project_id}</span>
							</span>
							{/* QR code placeholder: taxonomy-page QR link will render here later. */}
						</div>
					</div>
				</div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>

			{/* Photo credit lives outside the card face because hover-3d blocks hovering inside it. */}
			<div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3">
				<Link href={taxonomyHref} className="btn btn-primary btn-sm">
					View taxonomy
				</Link>
				<ImageAttributionIcon attribution={imageAttribution} fallbackTitle={commonName} />
			</div>
		</div>
	);
}

type ImageAttributionDetails = {
	title?: string;
	names?: string;
	institution?: string;
	attributionUrl?: string;
	imageSourceUrl?: string;
	licenseName?: string;
	licenseUrl?: string;
	location?: string;
	imageName?: string;
	legacyText?: string;
	isMissing?: boolean;
};

function getImageAttributionDetails(spotlight: SpotlightWithImage): ImageAttributionDetails {
	const image = spotlight.Image;
	const attribution = image?.Attribution;
	const details: ImageAttributionDetails = {
		title: cleanAttributionValue(attribution?.attributionTitle),
		names: cleanAttributionValue(attribution?.attributionNames.join(", ")),
		institution: cleanAttributionValue(attribution?.attributionInstitution ?? undefined),
		attributionUrl: cleanAttributionValue(attribution?.attributionUrl ?? undefined),
		licenseName: cleanAttributionValue(image?.license ?? undefined),
		location: cleanAttributionValue(image?.location ?? undefined),
		imageName: cleanAttributionValue(image?.name ?? undefined)
	};
	const hasStructuredValues = Object.values(details).some(Boolean);
	if (hasStructuredValues) {
		return details;
	}
	return {
		legacyText: "Attribution details coming soon.",
		isMissing: true
	};
}

function ImageAttributionIcon({
	attribution,
	fallbackTitle
}: {
	attribution: ImageAttributionDetails;
	fallbackTitle: string;
}) {
	const [hover, setHover] = useState(false);
	const combinedCredit = [attribution.names, attribution.institution].filter(Boolean).join(" - ");
	const licenseText = attribution.licenseName ?? attribution.licenseUrl;
	const headline = attribution.imageName ?? attribution.title ?? fallbackTitle;

	return (
		<div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
			<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-base-100/70 border-2 border-primary backdrop-blur flex items-center justify-center shadow-sm">
				<PhotoIcon />
			</div>
			{hover ? (
				<div className="absolute z-20 bottom-full right-0 w-72 max-w-[86vw] rounded-lg border border-base-200 bg-base-100/95 p-2.5 text-xs text-base-content shadow-lg backdrop-blur">
					<div className="space-y-1.5 wrap-break-word">
						<p className="font-semibold">{headline}</p>
						{attribution.title ? <p>{attribution.title}</p> : null}
						{combinedCredit ? <p>{combinedCredit}</p> : null}
						{attribution.location ? <p>{attribution.location}</p> : null}
						{attribution.attributionUrl ? (
							<p>
								<a
									className="link link-primary break-all"
									href={attribution.attributionUrl}
									target="_blank"
									rel="noreferrer"
								>
									{attribution.attributionUrl}
								</a>
							</p>
						) : null}
						{attribution.imageSourceUrl ? (
							<p>
								<a
									className="link link-primary break-all"
									href={attribution.imageSourceUrl}
									target="_blank"
									rel="noreferrer"
								>
									{attribution.imageSourceUrl}
								</a>
							</p>
						) : null}
						{licenseText ? (
							<p>
								{attribution.licenseUrl ? (
									<a
										className="link link-primary break-all"
										href={attribution.licenseUrl}
										target="_blank"
										rel="noreferrer"
									>
										{licenseText}
									</a>
								) : (
									licenseText
								)}
							</p>
						) : null}
						{attribution.legacyText ? (
							<p className={attribution.isMissing ? "text-base-content/70 italic" : undefined}>
								{attribution.legacyText}
							</p>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
