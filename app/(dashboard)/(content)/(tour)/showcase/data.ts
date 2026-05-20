import { prisma } from "@/app/helpers/prisma";
import type { Taxonomy } from "@/app/generated/prisma/client";

// How many projects to cycle through, and how many taxa to pull per project.
// Keeping these modest so the query stays cheap and the tour feels varied.
const PROJECTS_PER_TOUR = 10;
const ANALYSES_PER_PROJECT = 4;
const ASSIGNMENTS_PER_ANALYSIS = 80;
const DEFAULT_TAXA_TO_SHOW_PER_PROJECT = 48;
const MIN_TAXA_TO_SHOW_PER_PROJECT = 12;
const MAX_TAXA_TO_SHOW_PER_PROJECT = 120;
const SAMPLE_ROWS_PER_PROJECT = 900;
const MAP_SAMPLES_TO_SHOW = 240;

export type ProjectBundle = {
	project_id: string;
	project_name: string;
	institution: string | null;
	project_contact: string;
	assay_type: string;
	projectDescription: string | null;
	imageFileUrl_ODE: string | null;
	taxonomies: Taxonomy[];
	samples: {
		samp_name: string;
		decimalLatitude: number | null;
		decimalLongitude: number | null;
	}[];
};

// Stable shuffle helper. Uses Math.random once on the server; each page
// load gets a fresh mix of projects/taxa, which is exactly what we want
// for an idle loop that shouldn't look the same every time.
function sample<T>(arr: T[], count: number): T[] {
	if (arr.length <= count) return arr.slice();
	const copy = arr.slice();
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, count);
}

function hasCoordinates<T extends { decimalLatitude: number | null; decimalLongitude: number | null }>(
	sample: T
): sample is T & { decimalLatitude: number; decimalLongitude: number } {
	return typeof sample.decimalLatitude === "number" && typeof sample.decimalLongitude === "number";
}

function coordinateBucket(lat: number, lng: number) {
	// Coarse buckets keep nearby points together so one hotspot does not monopolize the map.
	const latBucket = Math.floor((lat + 90) / 5);
	const lngBucket = Math.floor((lng + 180) / 5);
	return `${latBucket}:${lngBucket}`;
}

function buildDiverseMapSamples<T extends { decimalLatitude: number | null; decimalLongitude: number | null }>(
	samples: T[],
	maxCount: number
): T[] {
	if (samples.length <= maxCount) return samples.slice();
	const withCoords = samples.filter(hasCoordinates);
	if (withCoords.length <= maxCount) return withCoords;

	const buckets = new Map<string, T[]>();
	for (const row of withCoords) {
		const key = coordinateBucket(row.decimalLatitude, row.decimalLongitude);
		const existing = buckets.get(key);
		if (existing) {
			existing.push(row);
		} else {
			buckets.set(key, [row]);
		}
	}

	const bucketEntries = sample(Array.from(buckets.entries()), buckets.size).map(([_, rows]) => sample(rows, rows.length));
	const picked: T[] = [];
	let cursor = 0;
	while (picked.length < maxCount) {
		let addedThisPass = false;
		for (const rows of bucketEntries) {
			if (cursor < rows.length) {
				picked.push(rows[cursor]);
				addedThisPass = true;
				if (picked.length >= maxCount) break;
			}
		}
		if (!addedThisPass) break;
		cursor += 1;
	}
	return picked;
}

function clampTaxaPerProject(value: number | undefined) {
	if (!value || !Number.isFinite(value)) return DEFAULT_TAXA_TO_SHOW_PER_PROJECT;
	return Math.max(MIN_TAXA_TO_SHOW_PER_PROJECT, Math.min(MAX_TAXA_TO_SHOW_PER_PROJECT, Math.floor(value)));
}

export async function getTourShowcaseProjects(options?: {
	selectedProjectIds?: string[];
	taxaPerProject?: number;
}): Promise<ProjectBundle[]> {
	const selectedProjectIds = options?.selectedProjectIds;
	const taxaPerProject = clampTaxaPerProject(options?.taxaPerProject);
	const sanitizedProjectIds = Array.from(
		new Set((selectedProjectIds ?? []).map((id) => id.trim()).filter((id) => id.length > 0))
	);

	// Only public projects — tour is visible without auth.
	const projects = await prisma.project.findMany({
		where:
			sanitizedProjectIds.length > 0
				? {
						isPrivate: false,
						project_id: { in: sanitizedProjectIds }
					}
				: { isPrivate: false },
		...(sanitizedProjectIds.length > 0 ? {} : { take: PROJECTS_PER_TOUR }),
		select: {
			project_id: true,
			project_name: true,
			institution: true,
			project_contact: true,
			assay_type: true,
			projectDescription: true,
			imageFileUrl_ODE: true,
			Samples: {
				take: SAMPLE_ROWS_PER_PROJECT,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			},
			Analyses: {
				take: ANALYSES_PER_PROJECT,
				where: { isPrivate: false },
				select: {
					Assignments: {
						take: ASSIGNMENTS_PER_ANALYSIS,
						select: {
							Taxonomy: true
						}
					}
				}
			}
		}
	});

	const bundles: ProjectBundle[] = projects.map((p) => {
		const uniqueTaxa = new Map<string, Taxonomy>();
		for (const analysis of p.Analyses) {
			for (const assignment of analysis.Assignments) {
				if (!uniqueTaxa.has(assignment.Taxonomy.taxonomy)) {
					uniqueTaxa.set(assignment.Taxonomy.taxonomy, assignment.Taxonomy);
				}
			}
		}
		return {
			project_id: p.project_id,
			project_name: p.project_name,
			institution: p.institution,
			project_contact: p.project_contact,
			assay_type: p.assay_type,
			projectDescription: p.projectDescription,
			imageFileUrl_ODE: p.imageFileUrl_ODE,
			taxonomies: sample(Array.from(uniqueTaxa.values()), taxaPerProject),
			samples: buildDiverseMapSamples(p.Samples, MAP_SAMPLES_TO_SHOW)
		};
	});

	// Drop projects with no taxa to show — they'd render an empty slide.
	return bundles.filter((b) => b.taxonomies.length > 0);
}
