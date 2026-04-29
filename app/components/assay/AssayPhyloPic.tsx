import { prisma } from "@/app/helpers/prisma";
import ThemeAwarePhyloPic from "@/app/components/images/ThemeAwarePhyloPic";

export default async function AssayPhyloPic({ assay_name }: { assay_name: string }) {
	// Sum organismQuantity per (analysis_run_name, featureid)
	const occurrenceSums = await prisma.occurrence.groupBy({
		by: ["analysis_run_name", "featureid"],
		where: { Analysis: { assay_name } },
		_sum: { organismQuantity: true }
	});

	// Fetch taxonomy rank data for the same (analysis_run_name, featureid)
	const assignments = await prisma.assignment.findMany({
		where: { Analysis: { assay_name } },
		select: {
			analysis_run_name: true,
			featureid: true,
			Taxonomy: { select: { family: true, order: true, class: true } }
		}
	});
	if (!assignments.length) {
		return (
			<div className="h-full w-full flex items-center justify-center text-center text-base-content/60 font-bold text-sm leading-none">
				?
			</div>
		);
	}

	const assignByKey = new Map<string, { family: string | null; order: string | null; class: string | null }>();
	for (const a of assignments) {
		assignByKey.set(`${a.analysis_run_name}|${a.featureid}`, {
			family: a.Taxonomy.family || null,
			order: a.Taxonomy.order || null,
			class: a.Taxonomy.class || null
		});
	}

	// Build totals (abundance) per rank
	const familyTotals = new Map<string, number>();
	const orderTotals = new Map<string, number>();
	const classTotals = new Map<string, number>();
	for (const row of occurrenceSums) {
		const key = `${row.analysis_run_name}|${row.featureid}`;
		const tax = assignByKey.get(key);
		if (!tax) continue;
		const total = row._sum.organismQuantity || 0;
		if (tax.family) {
			familyTotals.set(tax.family, (familyTotals.get(tax.family) || 0) + total);
		} else if (tax.order) {
			orderTotals.set(tax.order, (orderTotals.get(tax.order) || 0) + total);
		} else if (tax.class) {
			classTotals.set(tax.class, (classTotals.get(tax.class) || 0) + total);
		}
	}

	// Build counts (prevalence) per rank
	const familyCounts = new Map<string, number>();
	const orderCounts = new Map<string, number>();
	const classCounts = new Map<string, number>();
	for (const a of assignments) {
		const tax = a.Taxonomy;
		if (tax.family) {
			familyCounts.set(tax.family, (familyCounts.get(tax.family) || 0) + 1);
		} else if (tax.order) {
			orderCounts.set(tax.order, (orderCounts.get(tax.order) || 0) + 1);
		} else if (tax.class) {
			classCounts.set(tax.class, (classCounts.get(tax.class) || 0) + 1);
		}
	}

	function getSortedKeys(map: Map<string, number>) {
		return Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([name]) => name);
	}

	const abundanceCandidates = [
		...getSortedKeys(familyTotals).map((name) => ({ rank: "family" as const, name })),
		...getSortedKeys(orderTotals).map((name) => ({ rank: "order" as const, name })),
		...getSortedKeys(classTotals).map((name) => ({ rank: "class" as const, name }))
	];

	const prevalenceCandidates = [
		...getSortedKeys(familyCounts).map((name) => ({ rank: "family" as const, name })),
		...getSortedKeys(orderCounts).map((name) => ({ rank: "order" as const, name })),
		...getSortedKeys(classCounts).map((name) => ({ rank: "class" as const, name }))
	];

	const candidates = [...abundanceCandidates, ...prevalenceCandidates];

	// Try candidates in order until one resolves to a PhyloPic image
	const tried = new Set<string>();
	for (const candidate of candidates) {
		const key = `${candidate.rank}|${candidate.name}`;
		if (tried.has(key)) continue;
		tried.add(key);

		const gbifTaxaRes = await fetch(`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(candidate.name)}`);
		const gbifTaxa = await gbifTaxaRes.json();
		const gbifTaxonomy = gbifTaxa.filter((taxa: Record<string, any>) => taxa.rank?.toLowerCase() === candidate.rank)[0];
		if (!gbifTaxonomy) continue;

		const objectIDs =
			`${gbifTaxonomy.speciesKey ? gbifTaxonomy.speciesKey + "," : ""}` +
			`${gbifTaxonomy.genusKey ? gbifTaxonomy.genusKey + "," : ""}` +
			`${gbifTaxonomy.familyKey ? gbifTaxonomy.familyKey + "," : ""}` +
			`${gbifTaxonomy.orderKey ? gbifTaxonomy.orderKey + "," : ""}` +
			`${gbifTaxonomy.classKey ? gbifTaxonomy.classKey + "," : ""}` +
			`${gbifTaxonomy.phylumKey ? gbifTaxonomy.phylumKey + "," : ""}` +
			`${gbifTaxonomy.kingdomKey ? gbifTaxonomy.kingdomKey : ""}`;

		const phyloPicRes = await fetch(
			`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`
		);
		const phyloPic = await phyloPicRes.json();
		if (phyloPic.errors || !phyloPic._embedded?.primaryImage?._links?.vectorFile?.href) continue;

		const imageUrl = phyloPic._embedded.primaryImage._links.vectorFile.href as string;
		return (
			<div className="w-full h-full relative">
				<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" fill className="object-contain" />
			</div>
		);
	}

	return (
		<div className="h-full w-full flex items-center justify-center text-center text-base-content/60 font-bold text-sm leading-none">
			?
		</div>
	);
}
