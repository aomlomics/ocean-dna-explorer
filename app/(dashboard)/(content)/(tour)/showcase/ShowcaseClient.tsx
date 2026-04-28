"use client";

import { useEffect, useMemo, useState } from "react";
import type { Taxonomy } from "@/app/generated/prisma/client";
import PhyloPicClient from "@/app/components/images/PhyloPicClient";
import { ProjectIcon } from "@/app/components/icons";
import type { ProjectBundle } from "./page";

const SLIDE_DURATION_MS = 22000;
const TAXON_STREAM_MS = 1200;
const TAXON_LIFETIME_MS = 9400;

const TAXON_SLOTS = [
	{ top: "10%", left: "52%" },
	{ top: "14%", left: "66%" },
	{ top: "8%", left: "80%" },
	{ top: "24%", left: "90%" },
	{ top: "36%", left: "74%" },
	{ top: "42%", left: "92%" },
	{ top: "56%", left: "84%" },
	{ top: "66%", left: "92%" },
	{ top: "74%", left: "76%" },
	{ top: "84%", left: "88%" },
	{ top: "78%", left: "60%" },
	{ top: "60%", left: "52%" }
];

// Maps GBIF-style threat status strings to display info. GBIF returns both
// short codes (LC, EN) and longer forms (LEAST_CONCERN). We normalize both.
const IUCN_INFO: Record<string, { label: string; className: string }> = {
	LC: { label: "Least Concern", className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
	LEAST_CONCERN: { label: "Least Concern", className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
	NT: { label: "Near Threatened", className: "border-lime-500/30 text-lime-600 bg-lime-500/10" },
	NEAR_THREATENED: { label: "Near Threatened", className: "border-lime-500/30 text-lime-600 bg-lime-500/10" },
	VU: { label: "Vulnerable", className: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
	VULNERABLE: { label: "Vulnerable", className: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
	EN: { label: "Endangered", className: "border-orange-500/30 text-orange-500 bg-orange-500/10" },
	ENDANGERED: { label: "Endangered", className: "border-orange-500/30 text-orange-500 bg-orange-500/10" },
	CR: { label: "Critically Endangered", className: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
	CRITICALLY_ENDANGERED: {
		label: "Critically Endangered",
		className: "border-rose-500/30 text-rose-500 bg-rose-500/10"
	},
	EW: { label: "Extinct in the Wild", className: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
	EXTINCT_IN_THE_WILD: { label: "Extinct in the Wild", className: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
	EX: { label: "Extinct", className: "border-base-content/30 text-base-content/70 bg-base-content/10" },
	EXTINCT: { label: "Extinct", className: "border-base-content/30 text-base-content/70 bg-base-content/10" },
	DD: { label: "Data Deficient", className: "border-base-content/20 text-base-content/60 bg-base-content/10" },
	DATA_DEFICIENT: { label: "Data Deficient", className: "border-base-content/20 text-base-content/60 bg-base-content/10" }
};

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
function leastCommonName(t: Taxonomy): string {
	return t.species || t.genus || t.family || t.order || t.class || t.phylum || t.kingdom || "";
}

type Enrichment = { commonName: string | null; threatStatus: string | null };
type ActiveTaxon = { token: string; taxonomy: Taxonomy; slot: number; startedAt: number };

// Single GBIF fetch that returns both common name and threat status.
// Mirrors the approach already used in TaxaGridItem for consistency.
async function fetchGbifEnrichment(name: string): Promise<Enrichment> {
	try {
		const suggestRes = await fetch(
			`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(name)}&limit=1`,
			{ signal: AbortSignal.timeout(5000) }
		);
		const suggest = await suggestRes.json();
		const key = Array.isArray(suggest) && suggest.length > 0 ? suggest[0]?.key : null;
		if (!key) return { commonName: null, threatStatus: null };

		const [vnRes, speciesRes] = await Promise.all([
			fetch(`https://api.gbif.org/v1/species/${key}/vernacularNames?limit=50`, {
				signal: AbortSignal.timeout(5000)
			}),
			fetch(`https://api.gbif.org/v1/species/${key}`, { signal: AbortSignal.timeout(5000) })
		]);

		let commonName: string | null = null;
		if (vnRes.ok) {
			const vnJson = (await vnRes.json()) as {
				results?: { vernacularName?: string; language?: string; country?: string; preferred?: boolean }[];
			};
			// Prefer English + preferred + US (matches existing TaxaGridItem heuristic).
			const englishRows = (vnJson.results ?? []).filter(
				(r) => (r.language?.toLowerCase() === "en" || r.language?.toLowerCase() === "eng") && r.vernacularName
			);
			englishRows.sort((a, b) => {
				const aScore = (a.preferred ? 10 : 0) + (a.country === "US" ? 3 : 0);
				const bScore = (b.preferred ? 10 : 0) + (b.country === "US" ? 3 : 0);
				return bScore - aScore;
			});
			commonName = englishRows[0]?.vernacularName?.trim() ?? null;
		}

		let threatStatus: string | null = null;
		if (speciesRes.ok) {
			const speciesJson = (await speciesRes.json()) as { threatStatuses?: string[] };
			if (Array.isArray(speciesJson.threatStatuses) && speciesJson.threatStatuses.length) {
				threatStatus = speciesJson.threatStatuses[0];
			}
		}

		return { commonName, threatStatus };
	} catch {
		return { commonName: null, threatStatus: null };
	}
}

export default function ShowcaseClient({ projects }: { projects: ProjectBundle[] }) {
	const [idx, setIdx] = useState(0);
	const [activeTaxa, setActiveTaxa] = useState<ActiveTaxon[]>([]);

	useEffect(() => {
		if (projects.length <= 1) return;
		const id = window.setInterval(() => {
			setIdx((i) => (i + 1) % projects.length);
		}, SLIDE_DURATION_MS);
		return () => window.clearInterval(id);
	}, [projects.length]);

	const project = projects[idx];
	if (!project) return null;

	useEffect(() => {
		setActiveTaxa([]);
	}, [project.project_id]);

	useEffect(() => {
		const id = window.setInterval(() => {
			setActiveTaxa((prev) => {
				const now = Date.now();
				const alive = prev.filter((p) => now - p.startedAt < TAXON_LIFETIME_MS);
				const occupied = new Set(alive.map((p) => p.slot));
				const freeSlots = TAXON_SLOTS.map((_, i) => i).filter((i) => !occupied.has(i));
				if (!freeSlots.length || !project.taxonomies.length) return alive;

				const slot = freeSlots[Math.floor(Math.random() * freeSlots.length)];
				const taxonomy = project.taxonomies[Math.floor(Math.random() * project.taxonomies.length)];
				const token = `${project.project_id}-${taxonomy.taxonomy}-${now}-${slot}`;
				return [...alive, { token, taxonomy, slot, startedAt: now }];
			});
		}, TAXON_STREAM_MS);

		return () => window.clearInterval(id);
	}, [project.project_id, project.taxonomies]);

	return (
		<div className="tour-motion-bg relative isolate min-h-screen w-full overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-base-300/50">

			<div
				key={`details-${idx}`}
				className="showcase-details relative z-10 max-w-xl p-8 md:max-w-[41%] md:p-12"
			>
				<div className="flex items-center gap-3 text-primary">
					<ProjectIcon className="h-11 w-11 opacity-80" />
					<span className="text-[11px] font-semibold uppercase tracking-widest">
						Project · {project.project_id}
					</span>
				</div>

				<h1 className="mt-3 text-3xl font-semibold leading-tight text-primary md:text-4xl">
					{project.project_name}
				</h1>

				<dl className="mt-6 grid grid-cols-1 gap-4 text-sm">
					{project.institution && <DetailRow label="Institute" value={project.institution} />}
					<DetailRow label="Project Contact" value={project.project_contact} />
					<DetailRow label="Assay Type" value={project.assay_type} />
				</dl>

				{project.projectDescription && (
					<p className="mt-6 max-w-xl text-base-content/80 leading-relaxed line-clamp-6">
						{project.projectDescription}
					</p>
				)}

				<div className="mt-8 flex items-center gap-2 text-xs text-base-content/50">
					<span className="inline-block h-1 w-8 rounded-full bg-primary/40" />
					<span>
						Showcasing {idx + 1} of {projects.length}
					</span>
				</div>
			</div>

			<div className="absolute inset-0 pointer-events-none">
				{activeTaxa.map((taxon) => (
					<div
						key={taxon.token}
						className="showcase-taxon-stream absolute"
						style={{
							top: TAXON_SLOTS[taxon.slot].top,
							left: TAXON_SLOTS[taxon.slot].left,
							animationDuration: `${TAXON_LIFETIME_MS}ms`
						}}
					>
						<TaxonCard taxonomy={taxon.taxonomy} />
					</div>
				))}
			</div>
		</div>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-[10px] font-semibold uppercase tracking-widest text-base-content/55">{label}</dt>
			<dd className="mt-0.5 text-base-content/90">{value}</dd>
		</div>
	);
}

function TaxonCard({ taxonomy }: { taxonomy: Taxonomy }) {
	const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
	const lookupName = useMemo(() => leastCommonName(taxonomy), [taxonomy]);
	const formattedPath = useMemo(() => formatTaxonomyPath(taxonomy), [taxonomy]);

	useEffect(() => {
		if (!lookupName) return;
		let cancelled = false;
		fetchGbifEnrichment(lookupName).then((e) => {
			if (!cancelled) setEnrichment(e);
		});
		return () => {
			cancelled = true;
		};
	}, [lookupName]);

	const iucn = enrichment?.threatStatus ? IUCN_INFO[enrichment.threatStatus.toUpperCase()] ?? null : null;

	return (
		<div className="pointer-events-none flex items-center gap-2">
			<div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
				<PhyloPicClient taxonomy={taxonomy} />
			</div>
			<div className="max-w-[245px] text-left text-primary/95 [text-shadow:0_0_14px_rgba(0,0,0,0.35)]">
				<div className="mt-0.5 text-xs leading-snug line-clamp-2">{formattedPath}</div>
				{enrichment?.commonName && (
					<div className="mt-1 text-sm font-semibold leading-tight first-letter:uppercase">
						{enrichment.commonName}
					</div>
				)}
				{iucn && (
					<span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${iucn.className}`}>
						<span className="opacity-70">IUCN</span>
						<span aria-hidden="true" className="opacity-40">
							·
						</span>
						<span>{iucn.label}</span>
					</span>
				)}
			</div>
		</div>
	);
}
