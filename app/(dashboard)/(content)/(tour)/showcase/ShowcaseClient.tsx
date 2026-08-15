"use client";

import Image from "next/image";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Taxonomy } from "@/app/generated/prisma/client";
import { ProjectIcon } from "@/app/components/icons";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";
import { matchGbifForPhylopic } from "@/app/components/images/matchGbifForPhylopic";
import DynamicMap from "@/app/components/map/DynamicMap";
import { RanksBySpecificity } from "@/types/objects";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import type { ProjectBundle } from "./data";

const DEFAULT_PROJECT_DURATION_MS = 40_000;
const GRID_CELL_COUNT = 10;
const FAST_START_CELL_COUNT = 6;
const FAST_START_TICK_MS = 55;
const WARMUP_TICK_MS = 220;
const STEADY_TICK_MS = 3000;
const INITIAL_TAXONOMY_DELAY_MS = 120;
const INITIAL_PROJECT_INTRO_DELAY_MS = 950;
const PROJECT_SWAP_INTRO_DELAY_MS = 420;
const MAX_NEW_ENRICHES_PER_PROJECT = 24;
const PREMIUM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const REVEAL_TRANSITION: Transition = { duration: 1.8, ease: PREMIUM_EASE };
const FIRST_PROJECT_CIRCLE_DURATION_S = 6.2;
const SWAP_PROJECT_CIRCLE_DURATION_S = 4.8;

// First-fill typewriter is snappy so the grid can populate without lagging the
// card pop-ins. Steady swaps type slower so each replacement is readable.
const FAST_TYPE = {
	scientific: { delay: 0.04, charMs: 14 },
	common: { delay: 0.18, charMs: 16 },
	path: { delay: 0.3, charMs: 10 }
};
const SLOW_TYPE = {
	scientific: { delay: 0.35, charMs: 120 },
	common: { delay: 1.2, charMs: 145 },
	path: { delay: 1.9, charMs: 130 }
};

type IucnCategoryId = "NE" | "DD" | "LC" | "NT" | "VU" | "EN" | "CR" | "EW" | "EX";

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
	LC: "bg-emerald-500/12 text-emerald-300 border-emerald-400/35",
	NT: "bg-lime-500/12 text-lime-300 border-lime-400/35",
	VU: "bg-amber-500/12 text-amber-300 border-amber-400/35",
	EN: "bg-orange-500/12 text-orange-300 border-orange-400/35",
	CR: "bg-rose-500/12 text-rose-300 border-rose-400/35",
	EW: "bg-rose-500/12 text-rose-300 border-rose-400/35",
	EX: "bg-base-content/12 text-base-content/75 border-base-content/30",
	DD: "bg-base-content/12 text-base-content/70 border-base-content/25",
	NE: "bg-base-content/12 text-base-content/70 border-base-content/25"
};

type ActiveGridTaxonomy = {
	id: number;
	taxonomy: Taxonomy;
	scientificName: string;
	taxonomyPath: string;
	commonName: string | null;
	iucn: IucnCategoryId | null;
	phylopic: {
		imageUrl: string;
		imageDetails: string;
	} | null;
	fastType: boolean;
};

type TaxonomyCardMeta = Omit<ActiveGridTaxonomy, "id" | "fastType">;

type ShowcaseMapLocation = {
	samp_name: string;
	decimalLatitude: number;
	decimalLongitude: number;
};

const taxonomyMetaCache = new Map<string, TaxonomyCardMeta | null>();
const taxonomyMetaInFlight = new Map<string, Promise<TaxonomyCardMeta | null>>();

function hasCoordinates(sample: ProjectBundle["samples"][number]): sample is ShowcaseMapLocation {
	return typeof sample.decimalLatitude === "number" && typeof sample.decimalLongitude === "number";
}

function pickWorstCategory(rows: { threatStatus?: string }[]): IucnCategoryId | null {
	const severity: Record<IucnCategoryId, number> = {
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
	let picked: IucnCategoryId | null = null;
	let worst = -1;
	for (const row of rows) {
		const raw = (row.threatStatus ?? "").trim();
		if (!raw || raw.toUpperCase() === "NOT_APPLICABLE") continue;
		const key = raw.toUpperCase().replace(/\s+/g, "_");
		const category = GBIF_THREAT_TO_CATEGORY[key];
		if (!category) continue;
		const level = severity[category];
		if (level > worst) {
			worst = level;
			picked = category;
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

function getProjectTitleSizeClass(projectName: string): string {
	const length = projectName.trim().length;
	if (length >= 120) return "text-3xl sm:text-4xl xl:text-5xl";
	if (length >= 90) return "text-3xl sm:text-5xl xl:text-6xl";
	return "text-4xl sm:text-6xl xl:text-7xl";
}

function trimCommonName(commonName: string | null, scientificName: string) {
	if (!commonName) return null;
	const cleaned = commonName.trim();
	if (!cleaned) return null;
	return cleaned.toLowerCase() === scientificName.toLowerCase() ? null : cleaned;
}

// Builds a semicolon-free breadcrumb from the individual rank columns.
function formatTaxonomyPath(t: Taxonomy): string {
	const ranks = [t.kingdom, t.phylum, t.class, t.order, t.family, t.genus, t.species].filter(
		(v): v is string => typeof v === "string" && v.trim().length > 0
	);
	return ranks.join("  ›  ");
}

// Picks the most specific known name for display.
function mostSpecificName(t: Taxonomy): string {
	for (const rank of RanksBySpecificity) {
		const value = t[rank]?.toString().trim();
		if (value) return value.replace(/_/g, " ");
	}
	return t.taxonomy.split(";").pop()?.replace(/_/g, " ") ?? t.taxonomy;
}

async function fetchTaxonomyMeta(taxonomy: Taxonomy): Promise<TaxonomyCardMeta | null> {
	const cacheKey = taxonomy.taxonomy;
	if (taxonomyMetaCache.has(cacheKey)) return taxonomyMetaCache.get(cacheKey) ?? null;
	const inFlight = taxonomyMetaInFlight.get(cacheKey);
	if (inFlight) return inFlight;

	const request = (async () => {
		const scientificName = mostSpecificName(taxonomy);
		const taxonomyPath = formatTaxonomyPath(taxonomy);

		try {
			const match = await matchGbifForPhylopic(taxonomy);
			if (!match?.objectIDs) {
				return {
					taxonomy,
					scientificName,
					taxonomyPath,
					commonName: null,
					iucn: null,
					phylopic: null
				};
			}

			const [phyloPicRes, commonNameRes, iucnRes] = await Promise.allSettled([
				fetch(
					`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${match.objectIDs}`,
					{ signal: AbortSignal.timeout(4000) }
				),
				fetch(`https://api.gbif.org/v1/species/${match.taxonKey}/vernacularNames?limit=80`, {
					signal: AbortSignal.timeout(4000)
				}),
				fetch(`https://api.gbif.org/v1/species/${match.taxonKey}/distributions?limit=200`, {
					signal: AbortSignal.timeout(4000)
				})
			]);

			let phylopic: { imageUrl: string; imageDetails: string } | null = null;
			if (phyloPicRes.status === "fulfilled" && phyloPicRes.value.ok) {
				const phyloPic = await phyloPicRes.value.json();
				const imageUrl = phyloPic?._embedded?.primaryImage?._links?.vectorFile?.href as string | undefined;
				if (imageUrl) {
					const imageDetails =
						phyloPic?._embedded?.primaryImage?._links?.nodes
							?.map((node: { title?: string }) => node.title)
							?.filter((title: string | undefined): title is string => !!title)
							?.join(" | ") ?? "";
					phylopic = { imageUrl, imageDetails };
				}
			}

			let commonName: string | null = null;
			if (commonNameRes.status === "fulfilled" && commonNameRes.value.ok) {
				const json = (await commonNameRes.value.json()) as {
					results?: {
						vernacularName?: string;
						language?: string;
						country?: string;
						preferred?: boolean;
						isPreferredName?: boolean;
					}[];
				};
				const rows = Array.isArray(json?.results) ? json.results : [];
				const englishRows = rows.filter((row) => isEnglishLanguage(row.language) && row.vernacularName?.trim());
				if (englishRows.length) {
					englishRows.sort((a, b) => {
						const scoreDiff = scoreEnglishVernacular(b) - scoreEnglishVernacular(a);
						if (scoreDiff !== 0) return scoreDiff;
						return (a.vernacularName ?? "").localeCompare(b.vernacularName ?? "");
					});
					commonName = englishRows[0]?.vernacularName?.trim() ?? null;
				}
			}

			let iucn: IucnCategoryId | null = null;
			if (iucnRes.status === "fulfilled" && iucnRes.value.ok) {
				const json = (await iucnRes.value.json()) as { results?: { threatStatus?: string }[] };
				const rows = Array.isArray(json?.results) ? json.results : [];
				iucn = pickWorstCategory(rows);
			}

			return {
				taxonomy,
				scientificName,
				taxonomyPath,
				commonName: trimCommonName(commonName, scientificName),
				iucn,
				phylopic
			};
		} catch {
			return {
				taxonomy,
				scientificName,
				taxonomyPath,
				commonName: null,
				iucn: null,
				phylopic: null
			};
		}
	})();

	taxonomyMetaInFlight.set(cacheKey, request);
	const resolved = await request;
	taxonomyMetaInFlight.delete(cacheKey);
	taxonomyMetaCache.set(cacheKey, resolved);
	return resolved;
}

function buildFallbackTaxonomyMeta(taxonomy: Taxonomy): TaxonomyCardMeta {
	const scientificName = mostSpecificName(taxonomy);
	return {
		taxonomy,
		scientificName,
		taxonomyPath: formatTaxonomyPath(taxonomy),
		commonName: null,
		iucn: null,
		phylopic: null
	};
}

// useLayoutEffect warns when it runs during server rendering. This is a client
// component, but Next still server-renders it for the initial HTML, so we fall
// back to useEffect on the server to silence that warning while keeping the
// flicker-free, pre-paint measurement on the client.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Shrinks the left-hand info column just enough to fit the available height, so
// the project id / title / description / details are never clipped no matter how
// long the project name is. We scale the whole content block with a transform
// (cheap, and keeps text + logo + map proportional) instead of juggling
// per-element font sizes. A transform doesn't change layout, so reading
// scrollHeight still reports the natural, unscaled height we measure against —
// which also means our own scaling can't trigger a ResizeObserver feedback loop.
function useFitColumnScale(dependency: string | undefined) {
	const availableRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useIsomorphicLayoutEffect(() => {
		const available = availableRef.current;
		const content = contentRef.current;
		if (!available || !content) return;

		const measure = () => {
			const availableHeight = available.clientHeight;
			const naturalHeight = content.scrollHeight;
			if (!availableHeight || !naturalHeight) return;
			// Leave a little breathing room so text descenders / borders never kiss
			// the crop edge when viewport math lands on fractional pixels.
			const usableHeight = Math.max(1, availableHeight - 36);
			// The 0.35 floor keeps even a pathological title readable rather than
			// shrinking to nothing; curated tour projects never get close to it.
			const next = naturalHeight > usableHeight ? Math.max(0.35, usableHeight / naturalHeight) : 1;
			setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
		};

		measure();
		// Font loading, image decode, and map layout can change the measured block
		// after first paint. Re-check shortly after mount/swap to keep the bottom
		// metadata rows from clipping.
		const recheck1 = window.setTimeout(measure, 50);
		const recheck2 = window.setTimeout(measure, 220);
		const recheck3 = window.setTimeout(measure, 600);
		const observer = new ResizeObserver(measure);
		observer.observe(available);
		observer.observe(content);
		return () => {
			window.clearTimeout(recheck1);
			window.clearTimeout(recheck2);
			window.clearTimeout(recheck3);
			observer.disconnect();
		};
	}, [dependency]);

	return { availableRef, contentRef, scale };
}

export default function ShowcaseClient({
	projects,
	projectDurationMs = DEFAULT_PROJECT_DURATION_MS
}: {
	projects: ProjectBundle[];
	projectDurationMs?: number;
}) {
	const [projectIdx, setProjectIdx] = useState(0);
	const [gridTaxa, setGridTaxa] = useState<Array<ActiveGridTaxonomy | undefined>>(() =>
		Array.from({ length: GRID_CELL_COUNT })
	);
	const gridRef = useRef<Array<ActiveGridTaxonomy | undefined>>(Array.from({ length: GRID_CELL_COUNT }));
	const [isFirstProjectPaint, setIsFirstProjectPaint] = useState(true);
	const nextTaxonomyIndex = useRef(0);
	const gridItemIdCounter = useRef(0);
	const projectEnrichBudgetUsedRef = useRef(0);

	const project = projects[projectIdx];
	const mapLocations = useMemo(() => (project?.samples ?? []).filter(hasCoordinates), [project?.project_id]);

	useEffect(() => {
		if (projects.length <= 1) return;
		const id = window.setInterval(() => {
			setIsFirstProjectPaint(false);
			setProjectIdx((i) => (i + 1) % projects.length);
		}, projectDurationMs);
		return () => window.clearInterval(id);
	}, [projectDurationMs, projects.length]);

	useEffect(() => {
		const list = project?.taxonomies ?? [];
		gridRef.current = Array.from({ length: GRID_CELL_COUNT });
		setGridTaxa(gridRef.current);
		nextTaxonomyIndex.current = 0;
		gridItemIdCounter.current = 0;
		projectEnrichBudgetUsedRef.current = 0;
		if (!list.length) return;

		let cancelled = false;
		let timeoutId: number | null = null;
		let startDelayId: number | null = null;

		const tick = async () => {
			if (cancelled) return;

			const taxonomyIndex = nextTaxonomyIndex.current;
			const slot = taxonomyIndex % GRID_CELL_COUNT;
			const taxonomy = list[taxonomyIndex % list.length]!;
			nextTaxonomyIndex.current += 1;

			gridItemIdCounter.current += 1;
			const insertedId = gridItemIdCounter.current;
			const fallbackMeta = buildFallbackTaxonomyMeta(taxonomy);
			const cacheKey = taxonomy.taxonomy;
			const cachedMeta = taxonomyMetaCache.get(cacheKey) ?? null;
			const inFlightMeta = taxonomyMetaInFlight.get(cacheKey);
			const canStartNewEnrichment = projectEnrichBudgetUsedRef.current < MAX_NEW_ENRICHES_PER_PROJECT;
			let insertMeta: TaxonomyCardMeta = fallbackMeta;

			if (cachedMeta) {
				insertMeta = cachedMeta;
			} else if (inFlightMeta) {
				const resolved = await inFlightMeta;
				if (cancelled) return;
				insertMeta = resolved ?? fallbackMeta;
			} else if (canStartNewEnrichment) {
				projectEnrichBudgetUsedRef.current += 1;
				const resolved = await fetchTaxonomyMeta(taxonomy);
				if (cancelled) return;
				insertMeta = resolved ?? fallbackMeta;
			}

			const next = [...gridRef.current];
			next[slot] = {
				id: insertedId,
				...insertMeta,
				fastType: taxonomyIndex < GRID_CELL_COUNT
			};
			gridRef.current = next;
			setGridTaxa(next);

			if (cancelled) return;
			const filledCount = nextTaxonomyIndex.current;
			const delayMs =
				filledCount < GRID_CELL_COUNT
					? filledCount < FAST_START_CELL_COUNT
						? FAST_START_TICK_MS
						: WARMUP_TICK_MS
					: STEADY_TICK_MS;
			timeoutId = window.setTimeout(() => void tick(), delayMs);
		};

		const introDelayMs = isFirstProjectPaint ? INITIAL_PROJECT_INTRO_DELAY_MS : PROJECT_SWAP_INTRO_DELAY_MS;
		const taxonomyStartDelayMs = Math.max(INITIAL_TAXONOMY_DELAY_MS, introDelayMs);
		startDelayId = window.setTimeout(() => {
			if (cancelled) return;
			void tick();
		}, taxonomyStartDelayMs);
		return () => {
			cancelled = true;
			if (timeoutId != null) window.clearTimeout(timeoutId);
			if (startDelayId != null) window.clearTimeout(startDelayId);
		};
	}, [project?.project_id, project?.taxonomies]);

	// Auto-fit the left info column so the project id / name are never cut off.
	const { availableRef, contentRef, scale: fitScale } = useFitColumnScale(project?.project_id);

	if (!project) return null;

	const fromLeft = projectIdx % 2 === 0;
	const swapIn = !isFirstProjectPaint;
	const circleDuration = swapIn ? SWAP_PROJECT_CIRCLE_DURATION_S : FIRST_PROJECT_CIRCLE_DURATION_S;
	const projectTitleSizeClass = getProjectTitleSizeClass(project.project_name);

	return (
		<div className="tour-motion-bg relative isolate min-h-dvh w-full overflow-hidden bg-linear-to-b from-base-300 via-base-200 to-base-300 text-base-content [html[data-theme='dark']_&]:from-base-300 [html[data-theme='dark']_&]:via-base-300/90 [html[data-theme='dark']_&]:to-base-300">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_18%,oklch(var(--p)/0.16),transparent_46%),radial-gradient(ellipse_at_82%_48%,oklch(var(--s)/0.13),transparent_48%)]" />

			<AnimatePresence mode="wait">
				<motion.section
					key={project.project_id}
					role="group"
					aria-label={project.project_name}
					className="relative z-10 grid h-dvh w-full min-w-0 grid-cols-1 gap-6 px-[5vw] py-[5vh] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, scale: 0.992, transition: { duration: 0.55, ease: PREMIUM_EASE } }}
					transition={{ duration: 1.6, ease: PREMIUM_EASE }}
				>
					<div ref={availableRef} className="flex min-h-0 min-w-0 flex-col justify-start overflow-hidden py-2">
						<div
							ref={contentRef}
							className="flex min-w-0 flex-col"
							style={{ transform: `scale(${fitScale})`, transformOrigin: "left top" }}
						>
							<div className="mb-9 ml-3 flex items-center gap-5">
								<Image
									src="/images/ode_logo_clean.svg"
									alt="Ocean DNA Explorer logo"
									width={96}
									height={96}
									className="h-22 w-22 shrink-0"
								/>
								<p className="text-[1.75rem] font-semibold tracking-tight text-base-content/92 sm:text-[2.2rem]">
									Ocean DNA Explorer
								</p>
							</div>

							<div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start">
								<motion.div
									className="relative w-fit"
									initial={
										swapIn
											? {
													x: fromLeft ? "-50vw" : "50vw",
													rotate: fromLeft ? -52 : 52,
													scale: 0.68,
													opacity: 0
												}
											: { x: "-14vw", rotate: -16, scale: 0.9, opacity: 0 }
									}
									animate={{ x: 0, rotate: 0, scale: 1, opacity: 1 }}
									transition={{ duration: circleDuration, ease: PREMIUM_EASE }}
								>
									<div className="relative aspect-square h-44 overflow-hidden rounded-full border-[6px] border-primary bg-base-300 sm:h-56 xl:h-64">
										{project.imageFileUrl_ODE ? (
											// eslint-disable-next-line @next/next/no-img-element -- ODE image URLs are dynamic user uploads.
											<img src={project.imageFileUrl_ODE} alt="" className="h-full w-full rounded-full object-cover" />
										) : (
											<div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-primary/25 via-cyan-400/15 to-base-content/10">
												<ProjectIcon className="h-[46%] w-[46%] text-primary/90" />
											</div>
										)}
									</div>
								</motion.div>

								<motion.div
									className="h-44 w-full overflow-hidden rounded-3xl border-[6px] border-primary bg-base-300/40 shadow-xl sm:h-56 md:max-w-104 xl:h-64"
									initial={swapIn ? { x: fromLeft ? "-36vw" : "36vw", opacity: 0 } : { x: "-12vw", opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									transition={{ duration: circleDuration, ease: PREMIUM_EASE, delay: 0.08 }}
								>
									<div className="showcase-map-minimal pointer-events-none h-full w-full">
										<ProjectSamplesMap projectId={project.project_id} locations={mapLocations} />
									</div>
								</motion.div>
							</div>

							<MaskedReveal delay={0.06}>
								<div className="text-2xl font-semibold leading-tight text-primary sm:text-3xl xl:text-4xl">
									{project.project_id}
								</div>
							</MaskedReveal>

							<MaskedReveal delay={0.14}>
								<h1
									className={`mt-3 max-w-4xl wrap-break-word pb-[0.08em] font-semibold leading-[1.08] tracking-[-0.03em] text-white drop-shadow-md ${projectTitleSizeClass}`}
								>
									{project.project_name}
								</h1>
							</MaskedReveal>

							{project.projectDescription ? (
								<MaskedReveal delay={0.22}>
									<p className="mt-4 max-w-3xl line-clamp-4 text-base leading-relaxed text-base-content sm:text-lg xl:text-xl">
										{project.projectDescription}
									</p>
								</MaskedReveal>
							) : null}

							<motion.dl
								className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-base-content/75"
								initial="hidden"
								animate="show"
								variants={{
									hidden: {},
									show: { transition: { staggerChildren: 0.12, delayChildren: 0.7 } }
								}}
							>
								{project.institution ? <DetailRow label="Institute" value={project.institution} /> : null}
								<DetailRow label="Contact" value={project.project_contact} />
							</motion.dl>
						</div>
					</div>

					<div className="relative flex min-h-[56vh] min-w-0 items-center justify-center lg:min-h-0">
						<div className="grid h-full min-h-[56vh] w-full min-w-0 grid-cols-2 grid-rows-5 place-content-center gap-x-10 gap-y-5 lg:min-h-0">
							{Array.from({ length: GRID_CELL_COUNT }, (_, slot) => (
								<TaxonomyGridCell key={slot} cell={gridTaxa[slot]} />
							))}
						</div>
					</div>
				</motion.section>
			</AnimatePresence>
			<style jsx global>{`
				.showcase-map-minimal .leaflet-control {
					display: none !important;
				}

				.showcase-map-minimal .leaflet-control-attribution {
					display: block !important;
				}
			`}</style>
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 14 },
				show: { opacity: 1, y: 0, transition: REVEAL_TRANSITION }
			}}
			className="min-w-0"
		>
			<dt className="text-[10px] font-semibold uppercase tracking-widest text-primary">{label}</dt>
			<dd className="mt-0.5 wrap-break-word text-white/80">{value}</dd>
		</motion.div>
	);
}

function TaxonomyGridCell({ cell }: { cell: ActiveGridTaxonomy | undefined }) {
	if (!cell) {
		return <div className="min-h-28" />;
	}

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={cell.id}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { duration: 0.24, ease: PREMIUM_EASE } }}
				transition={{ duration: 0.55, ease: PREMIUM_EASE }}
				className="flex min-h-32 items-center gap-4 px-2 py-1"
			>
				<motion.div
					className="relative h-20 w-20 shrink-0 sm:h-22 sm:w-22"
					title={cell.phylopic?.imageDetails ? `PhyloPic nodes: ${cell.phylopic.imageDetails}` : undefined}
					initial={{ opacity: 0, scale: 0.94 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.65, ease: PREMIUM_EASE }}
				>
					{cell.phylopic?.imageUrl ? (
						<ThemeAwarePhyloPic src={cell.phylopic.imageUrl} alt="Taxonomy image" className="object-contain" />
					) : (
						<div className="flex h-full w-full items-center justify-center text-4xl font-semibold leading-none text-primary/95">
							?
						</div>
					)}
				</motion.div>

				<div className="min-w-0 pt-0.5">
					<div className="flex items-start gap-2">
						<TypewriterText
							key={`${cell.id}-scientific`}
							text={cell.scientificName}
							className="line-clamp-2 text-balance text-[22px] font-semibold leading-tight tracking-tight text-primary drop-shadow-md"
							delay={cell.fastType ? FAST_TYPE.scientific.delay : SLOW_TYPE.scientific.delay}
							charMs={cell.fastType ? FAST_TYPE.scientific.charMs : SLOW_TYPE.scientific.charMs}
						/>
						{cell.iucn ? (
							<span
								className={[
									"shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
									IUCN_CLASS[cell.iucn]
								].join(" ")}
								title={`IUCN Red List status (via GBIF): ${IUCN_LABEL[cell.iucn]}`}
							>
								IUCN {cell.iucn}
							</span>
						) : null}
					</div>

					<TypewriterText
						key={`${cell.id}-common`}
						text={cell.commonName ?? "No common name found"}
						className="mt-0.5 line-clamp-1 text-[16px] font-medium text-base-content/72"
						delay={cell.fastType ? FAST_TYPE.common.delay : SLOW_TYPE.common.delay}
						charMs={cell.fastType ? FAST_TYPE.common.charMs : SLOW_TYPE.common.charMs}
					/>
					<TypewriterText
						key={`${cell.id}-taxonomy`}
						text={cell.taxonomyPath}
						className="mt-1 line-clamp-2 wrap-anywhere text-[12px] leading-snug text-base-content/58"
						delay={cell.fastType ? FAST_TYPE.path.delay : SLOW_TYPE.path.delay}
						charMs={cell.fastType ? FAST_TYPE.path.charMs : SLOW_TYPE.path.charMs}
					/>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

function TypewriterText({
	text,
	className,
	delay,
	charMs
}: {
	text: string;
	className?: string;
	delay?: number;
	charMs?: number;
}) {
	const [visibleChars, setVisibleChars] = useState(0);
	const animationKey = `${text}\0${delay ?? ""}\0${charMs ?? ""}`;
	const [prevAnimationKey, setPrevAnimationKey] = useState(animationKey);

	if (animationKey !== prevAnimationKey) {
		setPrevAnimationKey(animationKey);
		setVisibleChars(0);
	}

	useEffect(() => {
		const startDelayMs = Math.max(0, Math.round((delay ?? 0) * 1000));
		const perCharMs = Math.max(8, charMs ?? 14);
		let timer: number | null = null;

		const run = () => {
			setVisibleChars((current) => {
				if (current >= text.length) return current;
				timer = window.setTimeout(run, perCharMs);
				return current + 1;
			});
		};

		timer = window.setTimeout(run, startDelayMs);
		return () => {
			if (timer != null) window.clearTimeout(timer);
		};
	}, [text, delay, charMs]);

	const typedText = text.slice(0, visibleChars);
	return (
		<span className={`relative block ${className ?? ""}`}>
			{/* Reserve final layout height so the text block does not jump when typing completes. */}
			<span className="invisible">{text || "\u00A0"}</span>
			<span className="absolute inset-0">{typedText || "\u00A0"}</span>
		</span>
	);
}

const ProjectSamplesMap = memo(
	function ProjectSamplesMap({ locations }: { projectId: string; locations: ShowcaseMapLocation[] }) {
		if (!locations.length) {
			return (
				<div className="flex h-full items-center justify-center px-3 text-sm text-base-content/55">
					No sample coordinates.
				</div>
			);
		}
		return <DynamicMap locations={locations} cluster clusterRadius={42} table="sample" id="samp_name" disableSearch />;
	},
	(prev, next) => prev.projectId === next.projectId
);

function MaskedReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
	return (
		<div className="overflow-hidden">
			<motion.div
				initial={{ y: "100%" }}
				animate={{ y: "0%" }}
				exit={{ y: "-25%" }}
				transition={{ ...REVEAL_TRANSITION, delay }}
			>
				{children}
			</motion.div>
		</div>
	);
}
