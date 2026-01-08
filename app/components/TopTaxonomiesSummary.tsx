import Link from "next/link";
import { publicPrisma } from "@/app/helpers/prisma";
import { Taxonomy } from "@/app/generated/prisma/client";
import PhyloPicClient from "@/app/components/images/PhyloPicClient";

type TopProjectInfo = {
	project_id: string;
	count: number;
	percent: number;
};

type TopTaxonomyRow = {
	taxonomy: string;
	count: number;
	taxonomyRecord: Taxonomy | null;
	topProject: TopProjectInfo | null;
};

function getDisplayName(t: Taxonomy | null, taxonomyFallback: string) {
	if (!t) return taxonomyFallback.split(";").filter(Boolean).pop()?.trim() || taxonomyFallback || "Unknown";
	return (
		t.species ||
		t.genus ||
		t.family ||
		t.order ||
		t.class ||
		t.phylum ||
		t.kingdom ||
		t.domain ||
		t.taxonomy.split(";").filter(Boolean).pop()?.trim() ||
		t.taxonomy ||
		"Unknown"
	);
}

export default async function TopTaxonomiesSummary({
	take = 10,
	highlightTop = 3
}: {
	take?: number;
	highlightTop?: number;
}) {
	const topTaxonomies = await publicPrisma.assignment.groupBy({
		by: ["taxonomy"],
		_count: { _all: true },
		orderBy: { _count: { taxonomy: "desc" } },
		take
	});

	if (!topTaxonomies.length) {
		return (
			<div className="bg-base-200 rounded-lg p-6 flex items-center justify-center text-base-content/70">
				No taxonomy data available yet.
			</div>
		);
	}

	const taxonomyStrings = topTaxonomies.map((t) => t.taxonomy);
	const taxonomyRecords = await publicPrisma.taxonomy.findMany({
		where: { taxonomy: { in: taxonomyStrings } }
	});
	const taxonomyByString = new Map<string, Taxonomy>(taxonomyRecords.map((t) => [t.taxonomy, t]));

	const highlightTaxonomies = taxonomyStrings.slice(0, Math.min(highlightTop, taxonomyStrings.length));
	let topProjectByTaxonomy = new Map<string, TopProjectInfo>();

	if (highlightTaxonomies.length) {
		const taxonomyByAnalysis = await publicPrisma.assignment.groupBy({
			by: ["taxonomy", "analysis_run_name"],
			where: { taxonomy: { in: highlightTaxonomies } },
			_count: { _all: true }
		});

		const analysisRunNames = [...new Set(taxonomyByAnalysis.map((row) => row.analysis_run_name))];
		const analyses = await publicPrisma.analysis.findMany({
			where: { analysis_run_name: { in: analysisRunNames } },
			select: { analysis_run_name: true, project_id: true }
		});
		const analysisToProject = new Map<string, string>(analyses.map((a) => [a.analysis_run_name, a.project_id]));

		const countsByTaxonomyByProject = new Map<string, Map<string, number>>();
		for (const row of taxonomyByAnalysis) {
			const projectId = analysisToProject.get(row.analysis_run_name);
			if (!projectId) continue;
			const mapForTax = countsByTaxonomyByProject.get(row.taxonomy) ?? new Map<string, number>();
			mapForTax.set(projectId, (mapForTax.get(projectId) ?? 0) + row._count._all);
			countsByTaxonomyByProject.set(row.taxonomy, mapForTax);
		}

		const totalCountByTaxonomy = new Map<string, number>(topTaxonomies.map((t) => [t.taxonomy, t._count._all]));
		for (const taxonomy of highlightTaxonomies) {
			const countsByProject = countsByTaxonomyByProject.get(taxonomy);
			if (!countsByProject || !countsByProject.size) continue;
			const sorted = [...countsByProject.entries()].sort((a, b) => b[1] - a[1]);
			const [project_id, count] = sorted[0];
			const total = totalCountByTaxonomy.get(taxonomy) ?? 0;
			const percent = total ? (count / total) * 100 : 0;
			topProjectByTaxonomy.set(taxonomy, { project_id, count, percent });
		}
	}

	const rows: TopTaxonomyRow[] = topTaxonomies.map((t) => ({
		taxonomy: t.taxonomy,
		count: t._count._all,
		taxonomyRecord: taxonomyByString.get(t.taxonomy) ?? null,
		topProject: topProjectByTaxonomy.get(t.taxonomy) ?? null
	}));

	return (
		<div className="bg-base-200 rounded-lg shadow-sm p-5">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h3 className="text-lg font-semibold text-base-content/90">Top Taxonomies</h3>
					<p className="text-xs text-base-content/60">Across all assignments</p>
				</div>
				<Link href="/explore/taxonomy" className="text-sm text-primary hover:text-primary-focus">
					Explore
				</Link>
			</div>

			<div className="space-y-3">
				{rows.slice(0, Math.min(highlightTop, rows.length)).map((row) => {
					const name = getDisplayName(row.taxonomyRecord, row.taxonomy);
					return (
						<Link
							key={row.taxonomy}
							href={`/explore/taxonomy/${encodeURIComponent(row.taxonomy)}`}
							className="block rounded-xl bg-base-100/40 hover:bg-base-100/60 border border-base-300/40 hover:border-primary/40 transition-colors"
						>
							<div className="p-4 flex items-center gap-4">
								<div className="w-14 h-14 rounded-lg bg-gradient-to-br from-base-200 to-base-300 shadow-sm overflow-hidden flex items-center justify-center">
									<div className="relative w-10 h-10">
										{row.taxonomyRecord ? (
											<PhyloPicClient taxonomy={row.taxonomyRecord} />
										) : (
											<div className="w-full h-full flex items-center justify-center text-base-content/60 text-xs">
												No Image
											</div>
										)}
									</div>
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-4">
										<p className="font-medium text-base-content truncate">{name}</p>
										<p className="font-semibold text-primary whitespace-nowrap">{row.count.toLocaleString()}</p>
									</div>
									{row.topProject ? (
										<div className="text-xs text-base-content/70 mt-1">
											<span className="font-semibold text-base-content/80">Within top project </span>
											<span className="text-primary">{row.topProject.project_id}</span>{" "}
											<span className="text-base-content/60">
												({row.topProject.percent.toFixed(1)}%, {row.topProject.count.toLocaleString()} assignments)
											</span>
										</div>
									) : (
										<p className="text-xs text-base-content/60 mt-1">Explore this taxonomy to see where it appears most.</p>
									)}
								</div>
							</div>
						</Link>
					);
				})}

				{rows.length > highlightTop ? (
					<div className="pt-2">
						<div className="max-h-[280px] overflow-y-auto pr-1 space-y-2">
							{rows.slice(highlightTop).map((row) => {
								const name = getDisplayName(row.taxonomyRecord, row.taxonomy);
								return (
									<Link
										key={row.taxonomy}
										href={`/explore/taxonomy/${encodeURIComponent(row.taxonomy)}`}
										className="flex items-center justify-between gap-3 rounded-lg bg-base-100/30 hover:bg-base-100/50 border border-base-300/30 hover:border-primary/30 px-3 py-2 transition-colors"
									>
										<div className="min-w-0 flex items-center gap-3">
											<div className="w-10 h-10 rounded-md bg-gradient-to-br from-base-200 to-base-300 overflow-hidden flex items-center justify-center">
												<div className="relative w-7 h-7">
													{row.taxonomyRecord ? (
														<PhyloPicClient taxonomy={row.taxonomyRecord} />
													) : (
														<div className="w-full h-full flex items-center justify-center text-base-content/60 text-[0.65rem]">
															No Image
														</div>
													)}
												</div>
											</div>
											<p className="text-sm text-base-content/90 truncate">{name}</p>
										</div>
										<p className="text-sm font-semibold text-primary whitespace-nowrap">{row.count.toLocaleString()}</p>
									</Link>
								);
							})}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}


