"use client";

import Image from "next/image";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Taxonomy } from "@/app/generated/prisma/client";
import { ProjectIcon } from "@/app/components/icons";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";
import { matchGbifForPhylopic } from "@/app/components/images/matchGbifForPhylopic";
import DynamicMap from "@/app/components/map/DynamicMap";
import { RanksBySpecificity } from "@/types/objects";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import type { ProjectBundle } from "./data";

const DEFAULT_PROJECT_DURATION_MS = 30_000;
const GRID_CELL_COUNT = 10;
const PREMIUM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const REVEAL_TRANSITION: Transition = { duration: 0.9, ease: PREMIUM_EASE };
type ActiveGridTaxonomy = {
	id: number;
	taxonomy: Taxonomy;
	phylopic: {
		imageUrl: string;
		imageDetails: string;
	};
};

type ShowcaseMapLocation = {
	samp_name: string;
	decimalLatitude: number;
	decimalLongitude: number;
};

function hasCoordinates(sample: ProjectBundle["samples"][number]): sample is ShowcaseMapLocation {
	return typeof sample.decimalLatitude === "number" && typeof sample.decimalLongitude === "number";
}

async function fetchPhyloPicPreview(taxonomy: Taxonomy): Promise<{ imageUrl: string; imageDetails: string } | null> {
	try {
		const match = await matchGbifForPhylopic(taxonomy);
		if (!match?.objectIDs) return null;
		const response = await fetch(
			`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${match.objectIDs}`,
			{ signal: AbortSignal.timeout(4000) }
		);
		if (!response.ok) return null;
		const phyloPic = await response.json();
		const imageUrl = phyloPic?._embedded?.primaryImage?._links?.vectorFile?.href as string | undefined;
		if (!imageUrl) return null;
		const imageDetails =
			phyloPic?._embedded?.primaryImage?._links?.nodes
				?.map((node: { title?: string }) => node.title)
				?.filter((title: string | undefined): title is string => !!title)
				?.join(" | ") ?? "";
		return { imageUrl, imageDetails };
	} catch {
		return null;
	}
}

// Builds a semicolon-free breadcrumb from the individual rank columns.
// The raw `taxonomy` string in the DB is semicolon delimited, but the
// individual rank fields are already parsed — much cleaner source.
function formatTaxonomyPath(t: Taxonomy): string {
	const ranks = [t.kingdom, t.phylum, t.class, t.order, t.family, t.genus, t.species].filter(
		(v): v is string => typeof v === "string" && v.trim().length > 0
	);
	return ranks.join("  ›  ");
}

// Picks the most specific known name for GBIF lookups (species > genus > …).
function mostSpecificName(t: Taxonomy): string {
	for (const rank of RanksBySpecificity) {
		const value = t[rank]?.toString().trim();
		if (value) return value.replace(/_/g, " ");
	}
	return t.taxonomy.split(";").pop()?.replace(/_/g, " ") ?? t.taxonomy;
}

export default function ShowcaseClient({
	projects,
	projectDurationMs = DEFAULT_PROJECT_DURATION_MS
}: {
	projects: ProjectBundle[];
	projectDurationMs?: number;
}) {
	const [projectIdx, setProjectIdx] = useState(0);
	const [gridTaxa, setGridTaxa] = useState<Array<ActiveGridTaxonomy | null>>(() =>
		Array.from({ length: GRID_CELL_COUNT }, () => null)
	);
	const firstProjectPaint = useRef(true);
	const spawnIndex = useRef(0);

	const project = projects[projectIdx];
	const mapLocations = useMemo(
		() => (project?.samples ?? []).filter(hasCoordinates),
		[project?.project_id]
	);

	useEffect(() => {
		if (projects.length <= 1) return;
		const id = window.setInterval(() => {
			firstProjectPaint.current = false;
			setProjectIdx((i) => (i + 1) % projects.length);
		}, projectDurationMs);
		return () => window.clearInterval(id);
	}, [projectDurationMs, projects.length]);

	useEffect(() => {
		const list = project?.taxonomies ?? [];
		spawnIndex.current = 0;
		setGridTaxa(Array.from({ length: GRID_CELL_COUNT }, () => null));
		if (!list.length) return;

		let cancelled = false;
		let timeoutId: number | null = null;
		const tick = () => {
			const slot = Math.floor(Math.random() * GRID_CELL_COUNT);
			const shouldClear = Math.random() < 0.2;

			if (shouldClear) {
				setGridTaxa((current) => {
					if (!current[slot]) return current;
					const next = [...current];
					next[slot] = null;
					return next;
				});
			} else {
				const taxonomy = list[spawnIndex.current % list.length];
				spawnIndex.current += 1;
				const nextId = Date.now() + spawnIndex.current;
				void fetchPhyloPicPreview(taxonomy).then((phylopic) => {
					if (cancelled || !phylopic?.imageUrl) return;
					setGridTaxa((current) => {
						const next = [...current];
						next[slot] = {
							id: nextId,
							taxonomy,
							phylopic
						};
						return next;
					});
				});
			}

			timeoutId = window.setTimeout(tick, 2200 + Math.random() * 2200);
		};
		timeoutId = window.setTimeout(tick, 900);
		return () => {
			cancelled = true;
			if (timeoutId) window.clearTimeout(timeoutId);
		};
	}, [project?.project_id, project?.taxonomies]);

	if (!project) return null;

	const fromLeft = projectIdx % 2 === 0;
	const swapIn = !firstProjectPaint.current;
	const circleDuration = swapIn ? 1.35 : 0.9;

	return (
		<div className="tour-motion-bg relative isolate min-h-screen w-full overflow-hidden bg-linear-to-b from-base-300 via-base-200 to-base-300 text-base-content [html[data-theme='dark']_&]:from-base-300 [html[data-theme='dark']_&]:via-base-300/90 [html[data-theme='dark']_&]:to-base-300">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_18%,oklch(var(--p)/0.16),transparent_46%),radial-gradient(ellipse_at_82%_48%,oklch(var(--s)/0.13),transparent_48%)]" />

			<AnimatePresence mode="wait">
				<motion.section
					key={project.project_id}
					role="group"
					aria-label={project.project_name}
					className="relative z-10 grid h-screen grid-cols-1 gap-6 px-[5vw] py-[5vh] lg:grid-cols-[minmax(0,0.88fr)_minmax(34rem,1.12fr)]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, transition: { duration: 0.45, ease: PREMIUM_EASE } }}
					transition={{ duration: 0.5, ease: PREMIUM_EASE }}
				>
					<div className="flex min-h-0 min-w-0 flex-col justify-center">
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
										<img
											src={project.imageFileUrl_ODE}
											alt=""
											className="h-full w-full rounded-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-primary/25 via-cyan-400/15 to-base-content/10">
											<ProjectIcon className="h-[46%] w-[46%] text-primary/90" />
										</div>
									)}
								</div>
							</motion.div>

							<div className="h-44 w-full overflow-hidden rounded-3xl border-[6px] border-primary/70 bg-base-300/40 shadow-xl sm:h-56 md:max-w-[26rem] xl:h-64">
								<ProjectSamplesMap projectId={project.project_id} locations={mapLocations} />
							</div>
						</div>

						<MaskedReveal delay={0.06}>
							<div className="text-2xl font-semibold leading-tight text-primary sm:text-3xl xl:text-4xl">
								{project.project_id}
							</div>
						</MaskedReveal>

						<MaskedReveal delay={0.14}>
							<h1 className="mt-3 max-w-4xl wrap-break-word text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white drop-shadow-md sm:text-6xl xl:text-7xl">
								{project.project_name}
							</h1>
						</MaskedReveal>

						{project.projectDescription ? (
							<MaskedReveal delay={0.22}>
								<p className="mt-4 max-w-3xl line-clamp-4 text-base leading-relaxed text-base-content/80 sm:text-lg xl:text-xl">
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
								show: { transition: { staggerChildren: 0.06, delayChildren: 0.32 } }
							}}
						>
							{project.institution ? <DetailRow label="Institute" value={project.institution} /> : null}
							<DetailRow label="Contact" value={project.project_contact} />
							<DetailRow label="Assay" value={project.assay_type} />
						</motion.dl>

						<div className="mt-6 flex items-center gap-3">
							<Image
								src="/images/ode_logo_clean.svg"
								alt="Ocean DNA Explorer logo"
								width={48}
								height={48}
								className="h-12 w-12 shrink-0"
							/>
							<p className="text-sm font-semibold tracking-tight text-base-content/90">Ocean DNA Explorer</p>
						</div>

						<div className="mt-6 text-sm font-medium text-base-content/70">
							Showing Project {projectIdx + 1} of {projects.length}
						</div>
					</div>

					<div className="relative min-h-[48vh] lg:min-h-0">
						<div className="grid h-full min-h-[48vh] grid-cols-2 content-start gap-x-8 gap-y-5 lg:min-h-0">
							{Array.from({ length: GRID_CELL_COUNT }, (_, slot) => (
								<TaxonomyGridCell key={slot} cell={gridTaxa[slot]} />
							))}
						</div>
					</div>
				</motion.section>
			</AnimatePresence>
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
			<dt className="text-[10px] font-semibold uppercase tracking-widest text-base-content/50">{label}</dt>
			<dd className="mt-0.5 wrap-break-word text-base-content/90">{value}</dd>
		</motion.div>
	);
}

function TaxonomyGridCell({ cell }: { cell: ActiveGridTaxonomy | null }) {
	const taxonomy = cell?.taxonomy ?? null;
	const formattedPath = taxonomy ? formatTaxonomyPath(taxonomy) : "";
	const fallbackName = taxonomy ? mostSpecificName(taxonomy) : "";

	if (!cell || !taxonomy) {
		return <div className="min-h-20" />;
	}

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				key={cell.id}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.62, ease: PREMIUM_EASE }}
				className="flex min-h-20 items-center gap-3"
			>
				<div
					className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16"
					title={cell.phylopic.imageDetails ? `PhyloPic nodes: ${cell.phylopic.imageDetails}` : undefined}
				>
					<ThemeAwarePhyloPic
						src={cell.phylopic.imageUrl}
						alt="Taxonomy image"
						fill
						className="object-contain"
					/>
				</div>
				<div className="min-w-0">
					<h2 className="line-clamp-2 text-balance text-sm font-semibold leading-tight tracking-tight text-primary drop-shadow-md">
						{fallbackName}
					</h2>
					<p className="mt-1 line-clamp-2 wrap-anywhere text-[10px] leading-snug text-base-content/62">{formattedPath}</p>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

const ProjectSamplesMap = memo(
	function ProjectSamplesMap({ locations }: { projectId: string; locations: ShowcaseMapLocation[] }) {
		if (!locations.length) {
			return <div className="flex h-full items-center justify-center px-3 text-sm text-base-content/55">No sample coordinates.</div>;
		}
		return <DynamicMap locations={locations} table="sample" id="samp_name" cluster clusterRadius={42} />;
	},
	(prev, next) => prev.projectId === next.projectId
);

function MaskedReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
	return (
		<span className="block overflow-hidden">
			<motion.span
				className="block"
				initial={{ y: "100%" }}
				animate={{ y: "0%" }}
				exit={{ y: "-25%" }}
				transition={{ ...REVEAL_TRANSITION, delay }}
			>
				{children}
			</motion.span>
		</span>
	);
}
