import { prisma } from "@/app/helpers/prisma";
import type { Taxonomy } from "@/app/generated/prisma/client";
import ShowcaseClient from "./ShowcaseClient";

// Tour pages are meant to display fresh data each load but don't need
// per-request dynamic rendering. revalidate=0 keeps this fully dynamic,
// which is fine for an admin-driven tour that runs occasionally.
export const revalidate = 0;

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
	taxonomies: Taxonomy[];
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

export default async function ShowcasePage() {
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

	// Flatten + dedupe taxa per project, then pick a random subset.
	// Doing this on the server avoids shipping 40+ taxonomy rows per project
	// to the client just to pick 5.
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
			taxonomies: sample(Array.from(uniqueTaxa.values()), TAXA_TO_SHOW_PER_PROJECT)
		};
	});

	// Drop projects with no taxa to show — they'd render an empty slide.
	const tourable = bundles.filter((b) => b.taxonomies.length > 0);

	if (!tourable.length) {
		return (
			<div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-base-100 text-base-content/60">
				No public projects available to showcase.
			</div>
		);
	}

	return <ShowcaseClient projects={tourable} />;
}
