"use client";

import { useEffect, useState } from "react";

function IucnLogoMark({ compact = false }: { compact?: boolean }) {
	const [failed, setFailed] = useState(false);
	if (failed) {
		return <span className="text-sm font-bold uppercase tracking-wide text-base-content/60">IUCN Red List</span>;
	}
	return (
		// eslint-disable-next-line @next/next/no-img-element -- local public asset
		<img
			src="/images/iucn_redlist_logo.webp"
			alt="IUCN Red List"
			className={`w-auto shrink-0 object-contain object-left opacity-95 ${compact ? "h-9 max-w-28" : "h-14 max-w-40 sm:h-16"}`}
			onError={() => setFailed(true)}
		/>
	);
}

const FETCH_MS = 7000;

/**
 * Category strip left → right follows IUCN Red List ordering. Colors are conventional
 * approximations (Tailwind) to the usual Red List palette, not exact brand hex values.
 */
// Colors approximate the conventional IUCN Red List palette.
const SCALE = [
	{ id: "NE", short: "NE", line: "NOT EVALUATED", bg: "bg-[#9CA3AF]", text: "text-neutral-900" },
	{ id: "DD", short: "DD", line: "DATA DEFICIENT", bg: "bg-[#6B7280]", text: "text-white" },
	{ id: "LC", short: "LC", line: "LEAST CONCERN", bg: "bg-[#2E7D32]", text: "text-white" },
	{ id: "NT", short: "NT", line: "NEAR THREATENED", bg: "bg-[#C0CA33]", text: "text-neutral-900" },
	{ id: "VU", short: "VU", line: "VULNERABLE", bg: "bg-[#FBC02D]", text: "text-neutral-900" },
	{ id: "EN", short: "EN", line: "ENDANGERED", bg: "bg-[#FB8C00]", text: "text-white" },
	{ id: "CR", short: "CR", line: "CRITICALLY ENDANGERED", bg: "bg-[#E53935]", text: "text-white" },
	{ id: "EW", short: "EW", line: "EXTINCT IN THE WILD", bg: "bg-[#424242]", text: "text-white" },
	{ id: "EX", short: "EX", line: "EXTINCT", bg: "bg-[#111827]", text: "text-white" }
] as const;

type CategoryId = (typeof SCALE)[number]["id"];

function severityIndex(id: CategoryId): number {
	const i = SCALE.findIndex((s) => s.id === id);
	return i >= 0 ? i : -1;
}

/** GBIF `distributions[].threatStatus` vocabulary (aligned with IUCN categories). */
const GBIF_THREAT_TO_CATEGORY: Record<string, CategoryId> = {
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

/** Fallback when GBIF conservation prose mentions a category but distributions lack IUCN rows. */
const PHRASES: { re: RegExp; id: CategoryId }[] = [
	{ re: /critically endangered/i, id: "CR" },
	{ re: /extinct in the wild/i, id: "EW" },
	{ re: /\bextinct\b(?!\s+in\s+the\s+wild)/i, id: "EX" },
	{ re: /\bendangered\b/i, id: "EN" },
	{ re: /\bvulnerable\b/i, id: "VU" },
	{ re: /near threatened/i, id: "NT" },
	{ re: /\bleast concern\b/i, id: "LC" },
	{ re: /data deficient/i, id: "DD" },
	{ re: /not\s+evaluated/i, id: "NE" }
];

function worstCategoryFromText(text: string): CategoryId | null {
	let best: CategoryId | null = null;
	let worstSev = -1;
	for (const { re, id } of PHRASES) {
		if (!re.test(text)) continue;
		const sev = severityIndex(id);
		if (sev >= 0 && sev > worstSev) {
			worstSev = sev;
			best = id;
		}
	}
	return best;
}

function parseIucnFromGbifDescriptions(
	descriptions: { type?: string; language?: string; description?: string }[]
): CategoryId | null {
	const conservation = descriptions.filter((d) => (d.type ?? "").toLowerCase() === "conservation");
	const englishFirst = [
		...conservation.filter((d) => (d.language ?? "").toLowerCase().startsWith("en")),
		...conservation
	];
	const text = englishFirst.map((d) => d.description ?? "").join("\n");
	if (!/iucn/i.test(text)) return null;

	const chunks = text.split(/(?<=[.!?])\s+|\n+/);
	const redListChunk = chunks.find((c) => /iucn\s+red\s+list/i.test(c));
	const classifiedChunk = chunks.find((c) => /\bclassified\s+as\b/i.test(c) && /iucn/i.test(c));
	const focus = redListChunk ?? classifiedChunk;
	return worstCategoryFromText(focus ?? text);
}

type DistRow = { threatStatus?: string; source?: string };

function isIucnRedListSource(source: string | undefined): boolean {
	const s = (source ?? "").toLowerCase();
	if (!s.includes("iucn")) return false;
	return /\bred\s*list\b/i.test(s) || /\bredlist\b/i.test(s) || /threatened\s+species/i.test(s);
}

function categoryFromThreatRows(rows: DistRow[]): CategoryId | null {
	let worstSev = -1;
	let picked: CategoryId | null = null;
	for (const r of rows) {
		const t = (r.threatStatus ?? "").trim();
		if (!t || t.toUpperCase() === "NOT_APPLICABLE") continue;
		const raw = t.toUpperCase().replace(/\s+/g, "_");
		const id = GBIF_THREAT_TO_CATEGORY[raw];
		if (!id) continue;
		const sev = severityIndex(id);
		if (sev > worstSev) {
			worstSev = sev;
			picked = id;
		}
	}
	return picked;
}

/** Prefer rows whose source names the IUCN Red List in GBIF (wording varies by dataset). */
function categoryFromIucnNamedDistributions(results: DistRow[]): CategoryId | null {
	const iucnRows = results.filter((r) => {
		const t = (r.threatStatus ?? "").trim();
		if (!t || t.toUpperCase() === "NOT_APPLICABLE") return false;
		return isIucnRedListSource(r.source);
	});
	return categoryFromThreatRows(iucnRows);
}

/** Any GBIF distribution with a mapped threatStatus (regional / other checklists). */
function categoryFromOtherDistributions(results: DistRow[]): CategoryId | null {
	return categoryFromThreatRows(results);
}

async function resolveBackboneSpeciesKeyForGbif(initialKey: number | string, signal?: AbortSignal): Promise<number> {
	const k = Number(initialKey);
	if (!Number.isFinite(k)) return k;
	const res = await fetch(`https://api.gbif.org/v1/species/${k}`, { signal });
	if (!res.ok) return k;
	const d = (await res.json()) as { nubKey?: number; key?: number };
	if (d.nubKey != null) return Number(d.nubKey);
	if (d.key != null) return Number(d.key);
	return k;
}

type Props = { taxonKey: number | string; className?: string; compact?: boolean };

type SourceKind = "iucn_distribution" | "distribution_other" | "description" | null;

export default function GbifIucnStatus({ taxonKey, className = "", compact = false }: Props) {
	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState<CategoryId | null>(null);
	const [sourceKind, setSourceKind] = useState<SourceKind>(null);

	useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();
		const t = setTimeout(() => controller.abort(), FETCH_MS);

		async function run() {
			setLoading(true);
			setCategory(null);
			setSourceKind(null);
			try {
				const lookupKey = await resolveBackboneSpeciesKeyForGbif(taxonKey, controller.signal);
				if (cancelled) return;

				const [distRes, descRes] = await Promise.all([
					fetch(`https://api.gbif.org/v1/species/${lookupKey}/distributions?limit=200`, {
						signal: controller.signal
					}),
					fetch(`https://api.gbif.org/v1/species/${lookupKey}/descriptions?limit=80`, {
						signal: controller.signal
					})
				]);
				clearTimeout(t);
				if (cancelled) return;

				let fromIucnDist: CategoryId | null = null;
				let fromOtherDist: CategoryId | null = null;
				if (distRes.ok) {
					const distData = (await distRes.json()) as { results?: DistRow[] };
					const rows = Array.isArray(distData?.results) ? distData.results : [];
					fromIucnDist = categoryFromIucnNamedDistributions(rows);
					if (!fromIucnDist) {
						fromOtherDist = categoryFromOtherDistributions(rows);
					}
				}

				let fromDesc: CategoryId | null = null;
				if (descRes.ok) {
					const descData = (await descRes.json()) as {
						results?: { type?: string; language?: string; description?: string }[];
					};
					const results = Array.isArray(descData?.results) ? descData.results : [];
					fromDesc = parseIucnFromGbifDescriptions(results);
				}

				const chosen: CategoryId | null = fromIucnDist ?? fromOtherDist ?? fromDesc;
				const kind: SourceKind = fromIucnDist
					? "iucn_distribution"
					: fromOtherDist
						? "distribution_other"
						: fromDesc
							? "description"
							: null;
				if (!cancelled) {
					setCategory(chosen);
					setSourceKind(kind);
				}
			} catch {
				clearTimeout(t);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
			clearTimeout(t);
			controller.abort();
		};
	}, [taxonKey]);

	if (loading) {
		return (
			<div
				className={`flex w-full items-center justify-center ${compact ? "min-h-16 py-3" : "min-h-28 py-6"} ${className}`}
				aria-busy="true"
			>
				<span className={`loading loading-spinner text-base-content/50 ${compact ? "loading-md" : "loading-lg"}`} />
			</div>
		);
	}

	const activeIndex = category != null ? SCALE.findIndex((s) => s.id === category) : -1;
	const active = category != null ? SCALE[activeIndex] : null;

	const sourceLine =
		sourceKind === "iucn_distribution"
			? "Threat status from a GBIF distribution row sourced from the IUCN Red List."
			: sourceKind === "distribution_other"
				? "Threat status from another GBIF distribution source (regional or national checklist — not necessarily the global IUCN assessment)."
				: sourceKind === "description"
					? "Fallback: detected in GBIF conservation description text (less reliable)."
					: null;

	const supportBlock = (
		<>
			IUCN Red List status is retrieved from <span className="font-medium text-base-content/65">GBIF</span> and is often
			missing for a given taxonomy.
			{sourceLine ? <> {sourceLine}</> : null} Official assessments:{" "}
			<a
				href="https://www.iucnredlist.org/"
				className="font-medium text-primary hover:underline"
				target="_blank"
				rel="noreferrer"
			>
				iucnredlist.org
			</a>
			.
		</>
	);

	return (
		<div className={`w-full ${compact ? "space-y-2" : "space-y-3"} ${className}`}>
			<div className={`flex items-start justify-start ${compact ? "gap-2" : "gap-3"}`}>
				<div className="shrink-0">
					<IucnLogoMark compact={compact} />
				</div>
				<div className="min-w-0 flex-1 space-y-1.5">
					{active ? (
						<p
							className={`inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg font-semibold leading-snug ${compact ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-base sm:text-lg"} ${active.bg} ${active.text}`}
						>
							<span className="font-black tracking-tight">{active.short}</span>
							<span className={`opacity-90 ${active.text}`}>·</span>
							<span className="font-semibold uppercase">{active.line}</span>
						</p>
					) : (
						<p className={`leading-snug text-base-content/65 ${compact ? "text-xs" : "text-sm"}`}>
							No IUCN category found in GBIF for this taxon.
						</p>
					)}
					{compact ? null : <p className="text-xs leading-relaxed text-base-content/55">{supportBlock}</p>}
				</div>
			</div>

			<div className="grid w-full grid-cols-9 gap-0.5">
				{SCALE.map((cell, i) => {
					const isActive = i === activeIndex;
					return (
						<div
							key={cell.id}
							className={`relative flex flex-col items-center justify-center rounded-sm px-1 text-center sm:rounded-none ${compact ? "min-h-9 py-1.5" : "min-h-14 py-2.5"} ${cell.bg} ${
								isActive
									? "z-10 opacity-100 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.92),0_0_0_1px_rgba(0,0,0,0.25)]"
									: "opacity-85"
							}`}
							title={cell.line}
						>
							<span className={`font-black leading-none ${compact ? "text-[10px]" : "text-xs sm:text-sm"} ${cell.text}`}>
								{cell.short}
							</span>
							{compact ? null : (
								<span
									className={`mt-1 hidden text-[7px] font-bold uppercase leading-tight opacity-95 sm:block sm:text-[8px] ${cell.text}`}
								>
									{cell.line}
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
