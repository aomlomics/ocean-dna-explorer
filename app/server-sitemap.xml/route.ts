import { getServerSideSitemap } from "next-sitemap";
import { prisma } from "../helpers/prisma";

export async function GET(request: Request) {
	const paths = [];

	//projects
	const projects = await prisma.project.findMany({
		select: {
			project_id: true
		}
	});
	paths.push(...projects.map((proj) => ({ loc: `/explore/project/${proj.project_id}` })));

	//samples
	const samples = await prisma.sample.findMany({
		select: {
			samp_name: true
		}
	});
	paths.push(...samples.map((samp) => ({ loc: `/explore/sample/${samp.samp_name}` })));

	//assays
	const assays = await prisma.assay.findMany({
		select: {
			assay_name: true
		}
	});
	paths.push(...assays.map((a) => ({ loc: `/explore/assay/${a.assay_name}` })));

	//analyses
	const analyses = await prisma.analysis.findMany({
		select: {
			analysis_run_name: true
		}
	});
	paths.push(...analyses.map((a) => ({ loc: `/explore/analysis/${a.analysis_run_name}` })));

	//features
	const features = await prisma.feature.findMany({
		select: {
			featureid: true
		}
	});
	paths.push(...features.map((feat) => ({ loc: `/explore/feature/${feat.featureid}` })));

	//taxonomies
	const taxonomies = await prisma.taxonomy.findMany({
		select: {
			taxonomy: true
		}
	});
	paths.push(...taxonomies.map((taxa) => ({ loc: `/explore/taxonomy/${taxa.taxonomy}` })));

	return getServerSideSitemap(paths);
}
