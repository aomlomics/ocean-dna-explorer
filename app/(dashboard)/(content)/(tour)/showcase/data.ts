import { prisma } from "@/app/helpers/prisma";
import type { Taxonomy } from "@/app/generated/prisma/client";

// How many projects to cycle through, and how many taxa to pull per project.
// Keeping these modest so the query stays cheap and the tour feels varied.
const PROJECTS_PER_TOUR = 10;
const ANALYSES_PER_PROJECT = 2;
const ASSIGNMENTS_PER_ANALYSIS = 40;
const TAXA_TO_SHOW_PER_PROJECT = 22;

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

export async function getTourShowcaseProjects(): Promise<ProjectBundle[]> {
	// Only public projects — tour is visible without auth.
	const projects = await prisma.project.findMany({
		where: { isPrivate: false },
		take: PROJECTS_PER_TOUR,
		select: {
			project_id: true,
			project_name: true,
			institution: true,
			project_contact: true,
			assay_type: true,
			projectDescription: true,
			imageFileUrl_ODE: true,
			Samples: {
				take: 350,
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
			taxonomies: sample(Array.from(uniqueTaxa.values()), TAXA_TO_SHOW_PER_PROJECT),
			samples: p.Samples
		};
	});

	// Drop projects with no taxa to show — they'd render an empty slide.
	return bundles.filter((b) => b.taxonomies.length > 0);
}
