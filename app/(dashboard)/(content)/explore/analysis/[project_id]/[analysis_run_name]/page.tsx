import { trustedPrisma } from "@/app/helpers/prisma";
import Link from "next/link";
import MapComponent from "@/app/components/map/Map";
import Table from "@/app/components/paginated/table/Table";
import DataDisplay from "@/app/components/explore/DataDisplay";
import EditHistory from "@/app/components/explore/EditHistory";
import TableMetadata from "@/types/tableMetadata";
import AssaysCard from "@/app/components/assay/AssaysCard";
import type { AnalysisModel } from "@/app/generated/prisma/models/Analysis";
import AnalysisTag from "@/app/components/tags/AnalysisTag";
import StatCard from "@/app/components/explore/StatCard";
import { EyeIcon, FishIcon, LocationIcon } from "@/app/components/icons";
import TaxaGrid from "@/app/components/paginated/grid/TaxaGrid";
import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import TaxonomyVisualize from "@/app/components/charts/wrappers/TaxonomyVisualize";
import { TaxonomicRanks } from "@/types/objects";
import LoadingAlphaDiversityDisplay from "@/app/components/charts/loading/LoadingAlphaDiversityDisplay";
import LoadingTaxaBarChart from "@/app/components/charts/loading/taxonomy/LoadingTaxaBarChart";
import { Suspense, type ReactNode } from "react";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { AnalysisFileDownloads, type DownloadFile } from "@/app/components/explore/ProjectFileDownloads";
import { notFound, redirect } from "next/navigation";
import { decodeRouteParams } from "@/app/helpers/utils";
import { getBlobSizes } from "@/app/helpers/getBlobSizes";
import { exploreUrl } from "@/app/helpers/utils";
import type { Metadata } from "next";
import type { TaxonomicRank } from "@/types/globals";
import { FIRST_TAXONOMY_VISUALIZE_TAB, TAXONOMY_VISUALIZE_TABS } from "@/app/components/charts/taxonomy/tabs";

export async function generateMetadata({
	params
}: {
	params: Promise<{ project_id: string; analysis_run_name: string }>;
}): Promise<Metadata> {
	const { project_id, analysis_run_name } = await decodeRouteParams(params);

	const analysis = await trustedPrisma.analysis.findUnique({
		where: {
			project_id_analysis_run_name: {
				project_id,
				analysis_run_name
			}
		},
		select: {
			assay_name: true
		}
	});

	if (analysis) {
		return {
			title: `${analysis_run_name} | ${TableMetadata.analysis.plural}`,
			description: `Explore the results of the ${analysis_run_name} analysis in the ${project_id} project, including associated samples, occurrences, taxonomic assignments, and diversity metrics using the ${analysis.assay_name} assay.`
		};
	} else {
		return {
			title: "Analysis not found"
		};
	}
}

const dataExplorerTabBase =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

function AnalysisDownloadsSkeleton() {
	return (
		<div className="relative z-raised flex flex-wrap items-center gap-3" aria-hidden>
			<div className="inline-flex items-center gap-3 rounded-lg bg-base-200 px-4 py-2">
				<span className="skeleton h-8 w-8 shrink-0 rounded" />
				<span className="flex flex-col gap-1">
					<span className="skeleton h-4 w-48" />
					<span className="skeleton h-3 w-14" />
				</span>
			</div>
		</div>
	);
}

async function AnalysisDownloadsBlock({ files }: { files: DownloadFile[] }) {
	const sizeByUrl = await getBlobSizes(files.map((f) => f.href));
	return (
		<div className="relative z-raised">
			<AnalysisFileDownloads files={files} sizeByUrl={sizeByUrl} />
		</div>
	);
}

export default async function Project_id_Analysis_run_name({
	params,
	searchParams
}: {
	params: Promise<{ project_id: string; analysis_run_name: string }>;
	searchParams: Promise<{ view?: string | string[] }>;
}) {
	const { project_id, analysis_run_name } = await decodeRouteParams(params);

	const { view } = await searchParams;
	if (view !== undefined) {
		redirect(exploreUrl({ table: "analysis", project_id, analysis_run_name }));
	}

	const analysis = await trustedPrisma.analysis.findUnique({
		where: {
			project_id_analysis_run_name: {
				project_id,
				analysis_run_name
			}
		},
		include: {
			_count: {
				select: {
					Occurrences: true,
					Assignments: true
				}
			},
			Assay: {
				select: {
					target_gene: true
				}
			},
			Tags: true,
			AlphaDiversities: {
				include: {
					AlphaDiversityIndexes: {
						select: {
							index: true,
							Library: {
								select: {
									Sample: true
								}
							}
						}
					}
				}
			}
		}
	});
	if (!analysis) notFound();
	const { _count, editHistory, Assay, Tags, AlphaDiversities, ...justAnalysis } = analysis;

	const analysisFiles = [
		{ label: "analysisMetadata", href: analysis.analysisMetadataFileUrl_ODE },
		{ label: "asv", href: analysis.asvFileUrl_ODE },
		{ label: "occurrence", href: analysis.occurrenceFileUrl_ODE }
	].filter((f) => Boolean(f.href));

	return (
		<div id="analysis" className="space-y-6">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="link link-primary link-hover">
							Projects
						</Link>
					</li>
					<li>
						<Link href={exploreUrl({ table: "project", project_id })} className="link link-primary link-hover">
							{project_id}
						</Link>
					</li>
					<li>
						<Link href={`/explore/analysis`} className="link link-primary link-hover">
							Analyses
						</Link>
					</li>
					<li>{analysis_run_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.analysis.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">{analysis_run_name}</h1>
					</TitleHoverTooltip>
					<EditHistory editHistory={editHistory} />
					{analysis.trusted && <div className="badge badge-primary text-neutral-content p-3 select-none">Trusted</div>}
					{Tags.map((t) => (
						<AnalysisTag key={t.tagName} tag={t} />
					))}
				</div>
				<p className="text-lg text-base-content/70">
					Part of the{" "}
					<Link href={exploreUrl({ table: "project", project_id })} className="link link-primary link-hover">
						{project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<Suspense fallback={<AnalysisDownloadsSkeleton />}>
				<AnalysisDownloadsBlock files={analysisFiles} />
			</Suspense>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left side content */}
				<div className="lg:col-span-2 space-y-6">
					<MapComponent
						query={async () =>
							await trustedPrisma.sample.findMany({
								where: {
									Libraries: {
										some: {
											Analyses: {
												some: {
													project_id,
													analysis_run_name
												}
											}
										}
									}
								}
							})
						}
						where={{ analysis_run_name }}
						cluster
						draw
						className="w-full h-110"
						legend
						legendOmit={["project_id"]}
						defaultLegendField="expedition_id"
					/>

					{/* Analysis Information */}
					<div className="bg-base-200 rounded-xl p-6">
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Analysis Information</h2>
						<div className="h-75 overflow-y-auto">
							<DataDisplay
								table="analysis"
								data={justAnalysis}
								omit={["project_id", "analysis_run_name", "assay_name"]}
							/>
						</div>
					</div>
				</div>

				{/* Right side content */}
				<div className="space-y-8">
					{/* Stats */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Analysis at a Glance</h2>
						<div className="grid grid-cols-2 gap-4">
							<StatCard
								title="Occurrences"
								value={_count.Occurrences}
								icon={<EyeIcon />}
								link={`/search?table=occurrence&advanced=[["analysis_run_name","equals","${analysis_run_name}"]]`}
								tooltip="View as Search"
							/>

							<StatCard
								title="Assignments"
								value={_count.Assignments}
								icon={<FishIcon />}
								link={`/search?table=assignment&advanced=[["analysis_run_name","equals","${analysis_run_name}"]]`}
								tooltip="View as Search"
							/>

							<StatCard
								title="Samples"
								query={async () =>
									await trustedPrisma.sample.count({
										where: {
											Libraries: {
												some: {
													Analyses: {
														some: {
															project_id,
															analysis_run_name
														}
													}
												}
											}
										}
									})
								}
								icon={<LocationIcon />}
								link={`/search?table=sample&advanced=[["analysis","analysis_run_name","equals","${analysis_run_name}"]]`}
								tooltip="View as Search"
							/>
						</div>
					</div>

					{/* Assay Card */}
					<AssaysCard
						title="Assays used in this Analysis"
						assays={[{ assay_name: analysis.assay_name, target_gene: Assay.target_gene }]}
					/>
				</div>
			</div>

			{/* Data Explorer */}
			<div id="dataExplorer" className="mt-12">
				<h2 className="text-2xl font-semibold text-base-content/90 mb-3 mt-1">Data Explorer</h2>
				<div role="tablist" className="tabs bg-transparent gap-2 flex-wrap p-0">
					<input
						type="radio"
						name="dataTabs"
						role="tab"
						className="tab tab-disabled border-none px-0 bg-transparent text-sm font-medium normal-case tracking-normal text-base-content cursor-default"
						aria-label="Tables:"
						disabled
					/>

					<input
						type="radio"
						defaultChecked
						name="dataTabs"
						role="tab"
						className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
						aria-label="Taxonomies"
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<TaxaGrid analysis_run_name={analysis_run_name} />
					</div>

					<input
						type="radio"
						name="dataTabs"
						role="tab"
						className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
						aria-label="Assignments"
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<Table table="assignment" where={{ analysis_run_name }} defaultTake={20} />
					</div>

					<input
						type="radio"
						name="dataTabs"
						role="tab"
						className="tab tab-disabled border-none pl-4 pr-0 bg-transparent text-sm font-medium normal-case tracking-normal text-base-content cursor-default"
						aria-label="Charts:"
						disabled
					/>

					<input
						type="radio"
						name="dataTabs"
						role="tab"
						className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
						aria-label="Taxonomy"
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<Suspense fallback={<LoadingTaxonomyVisualizeSuspense />}>
							<TaxonomyVisualizeSuspense project_id={project_id} analysis_run_name={analysis_run_name} />
						</Suspense>
					</div>

					<input
						type="radio"
						name="dataTabs"
						role="tab"
						className={`tab border-none ${dataExplorerTabBase} bg-base-200/90 text-base-content hover:bg-base-300 checked:bg-primary checked:text-primary-content checked:shadow-md checked:hover:bg-primary checked:hover:brightness-95`}
						aria-label="Alpha Diversity"
					/>
					<div role="tabpanel" className="tab-content w-full mt-2">
						<Suspense fallback={<LoadingAlphaDiversityDisplay />}>
							<AlphaDiversityDisplay alphaDiversities={AlphaDiversities} sameAnalysis />
						</Suspense>
					</div>
				</div>
			</div>
		</div>
	);
}

async function TaxonomyVisualizeSuspense({
	project_id,
	analysis_run_name
}: {
	project_id: AnalysisModel["project_id"];
	analysis_run_name: AnalysisModel["analysis_run_name"];
}) {
	const analysis = await trustedPrisma.analysis.findUnique({
		where: {
			project_id_analysis_run_name: {
				project_id,
				analysis_run_name
			}
		},
		select: {
			Assignments: {
				select: {
					featureid: true,
					taxonomy: true,
					percent_id: true,
					Occurrences: {
						select: {
							organismQuantity: true,
							Library: {
								select: {
									id: true
								}
							}
						}
					}
				}
			},
			Taxonomies: {
				select: TaxonomicRanks.reduce(
					(acc, rank) => ({
						...acc,
						[rank]: true
					}),
					{ taxonomy: true } as Record<TaxonomicRank, true> & {
						taxonomy: true;
					}
				)
			},
			Libraries: {
				select: {
					id: true,
					lib_id: true,
					Sample: true
				}
			}
		}
	});

	if (!analysis) {
		return <></>;
	}

	const assignsByFeatureid = Object.fromEntries(analysis.Assignments.map((a) => [a.featureid, a]));
	const taxonomiesByName = Object.fromEntries(analysis.Taxonomies.map((taxonomy) => [taxonomy.taxonomy, taxonomy]));
	const libsWithSampleById = new Map(analysis.Libraries.map((lib) => [lib.id, { ...lib, Sample: lib.Sample }]));

	return (
		<TaxonomyVisualize
			assignsByFeatureid={assignsByFeatureid}
			taxonomiesByName={taxonomiesByName}
			libsWithSampleById={libsWithSampleById}
		/>
	);
}

function LoadingTaxonomyVisualizeSuspense() {
	const currentTab = FIRST_TAXONOMY_VISUALIZE_TAB;

	function getTab(
		route: keyof typeof TAXONOMY_VISUALIZE_TABS,
		t: (typeof TAXONOMY_VISUALIZE_TABS)[keyof typeof TAXONOMY_VISUALIZE_TABS],
		i: number
	) {
		return (
			<button
				key={route}
				disabled
				className={`btn ${currentTab[i] === route ? "btn-primary text-primary-content" : "text-base-content"}`}
			>
				{t.title}
			</button>
		);
	}

	const tabRows: ReactNode[][] = [Object.entries(TAXONOMY_VISUALIZE_TABS).map(([route, t]) => getTab(route, t, 0))];

	//show nested tabs if they exist for currently selected tab
	let curr = TAXONOMY_VISUALIZE_TABS[currentTab[0]!]!;
	let parentPath = [currentTab[0]!];
	let i = 1;
	while (curr.tabs) {
		tabRows.push(Object.entries(curr.tabs).map(([route, t]) => getTab(route, t, 0)));

		const selectedRoute = currentTab[i]!;
		curr = curr.tabs[selectedRoute]!;
		parentPath = [...parentPath, selectedRoute];
		i++;
	}

	return (
		<>
			<div className="flex flex-col items-center gap-2">
				{tabRows.map((row, i) => (
					<div key={i} className="flex justify-center gap-2">
						{row}
					</div>
				))}
			</div>

			<LoadingTaxaBarChart />
		</>
	);
}
