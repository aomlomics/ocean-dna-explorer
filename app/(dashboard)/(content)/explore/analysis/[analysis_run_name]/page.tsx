import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import DataDisplay from "@/app/components/DataDisplay";
import EditHistory from "@/app/components/EditHistory";
import TableMetadata from "@/types/tableMetadata";
import AssaysCard from "@/app/components/assay/AssaysCard";
import { Analysis } from "@/app/generated/prisma/client";
import AnalysisTag from "@/app/components/tags/AnalysisTag";
import StatCard from "@/app/components/explore/StatCard";
import { EyeIcon, FishIcon, LocationIcon } from "@/app/components/icons";
import TaxaGrid from "@/app/components/paginated/grid/TaxaGrid";
import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import TaxonomyVisualize from "@/app/components/charts/wrappers/TaxonomyVisualize";
import { TaxonomicRanks } from "@/types/objects";
import LoadingAlphaDiversityDisplay from "@/app/components/charts/loading/LoadingAlphaDiversityDisplay";
import LoadingTaxonomyVisualize from "@/app/components/charts/loading/LoadingTaxonomyVisualize";

export default async function Analysis_run_name({
	params
}: {
	params: Promise<{ analysis_run_name: Analysis["analysis_run_name"] }>;
}) {
	let { analysis_run_name } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);

	const analysis = await prisma.analysis.findUnique({
		where: {
			analysis_run_name: analysis_run_name
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
	if (!analysis) return <>Analysis not found</>;
	const { _count: _, editHistory: __, Assay: ___, Tags: ____, AlphaDiversities: _____, ...justAnalysis } = analysis;

	return (
		<div id="analysis" className="space-y-6">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={`/explore/project/${analysis.project_id}`} className="text-primary hover:text-primary-focus">
							{analysis.project_id}
						</Link>
					</li>
					<li>
						<Link href={`/explore/analysis`} className="text-primary hover:text-primary-focus">
							Analyses
						</Link>
					</li>
					<li>{analysis_run_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-secondary tooltip-right before:text-primary-content"
						data-tip={TableMetadata.analysis.description}
					>
						{analysis_run_name}
					</h1>
					<EditHistory editHistory={analysis.editHistory} />
					{analysis.isPrivate && <div className="badge badge-ghost p-3 select-none">Private</div>}
					{analysis.trusted && <div className="badge badge-primary p-3 select-none">Trusted</div>}
					{analysis.Tags.map((t) => (
						<AnalysisTag key={t.tagName} tag={t} />
					))}
				</div>
				<p className="text-lg text-base-content/70">
					Part of the{" "}
					<Link href={`/explore/project/${analysis.project_id}`} className="text-primary hover:text-primary-focus">
						{analysis.project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left side content */}
				<div className="lg:col-span-2 space-y-6">
					<Map
						query={async () =>
							await prisma.sample.findMany({
								where: {
									Libraries: {
										some: {
											Occurrences: {
												some: {
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
								value={analysis._count.Occurrences}
								icon={<EyeIcon />}
								link={`/search?table=occurrence&advanced=[["analysis_run_name","equals","${analysis_run_name}"]]`}
								tooltip="View as Search"
							/>

							<StatCard
								title="Assignments"
								value={analysis._count.Assignments}
								icon={<FishIcon />}
								link={`/search?table=assignment&advanced=[["analysis_run_name","equals","${analysis_run_name}"]]`}
								tooltip="View as Search"
							/>

							<StatCard
								title="Samples"
								query={async () =>
									await prisma.sample.count({
										where: {
											Libraries: {
												some: {
													Occurrences: {
														some: {
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
					assays={[{ assay_name: analysis.assay_name, target_gene: analysis.Assay.target_gene }]}
				/>
				</div>
			</div>

			{/* Data Explorer */}
			<div id="dataExplorer" className="mt-8">
				<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Data Explorer</h2>
				<div role="tablist" className="tabs tabs-lifted">
					<input type="radio" name="dataTabs" role="tab" className="tab pr-2" aria-label="Tables:" disabled />

					<input type="radio" defaultChecked name="dataTabs" role="tab" className="tab px-2" aria-label="Taxa" />
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box">
						<TaxaGrid analysis_run_name={analysis_run_name} />
					</div>

					<input type="radio" name="dataTabs" role="tab" className="tab px-2" aria-label="Assignments" />
					<div role="tabpanel" className="tab-content w-full border-base-300 rounded-lg">
						<Table table="assignment" where={{ analysis_run_name }} defaultTake={20} />
					</div>

					<input type="radio" name="dataTabs" role="tab" className="tab pl-6 pr-2" aria-label="Visualize:" disabled />

					<input type="radio" name="dataTabs" role="tab" className="tab px-2" aria-label="Taxonomy" />
					<div role="tabpanel" className="tab-content w-full border-base-300 rounded-lg">
						<Suspense fallback={<LoadingTaxonomyVisualize />}>
							<TaxonomyVisualizeSuspense analysis_run_name={analysis_run_name} />
						</Suspense>
					</div>

					<input type="radio" name="dataTabs" role="tab" className="tab px-2" aria-label="Alpha Diversity" />
					<div role="tabpanel" className="tab-content w-full border-base-300 rounded-lg">
						<Suspense fallback={<LoadingAlphaDiversityDisplay />}>
							<AlphaDiversityDisplay alphaDiversities={analysis.AlphaDiversities} sameAnalysis />
						</Suspense>
					</div>
				</div>
			</div>
		</div>
	);
}

async function TaxonomyVisualizeSuspense({ analysis_run_name }: { analysis_run_name: Analysis["analysis_run_name"] }) {
	const { occurrences, assignments, taxonomies, samples } = await prisma.$transaction(
		async (tx) => {
			const occurrences = await prisma.occurrence.findMany({
				where: {
					analysis_run_name
				},
				select: {
					lib_id: true,
					featureid: true,
					organismQuantity: true
				}
			});

			const assignments = await prisma.assignment.findMany({
				where: {
					analysis_run_name
				},
				select: {
					featureid: true,
					Taxonomy: {
						select: {
							id: true
						}
					}
				}
			});

			const taxonomies = await prisma.taxonomy.findMany({
				where: {
					Assignments: {
						some: {
							analysis_run_name
						}
					}
				},
				select: TaxonomicRanks.reduce((acc, rank) => ({ ...acc, [rank]: true }), { id: true } as Record<
					(typeof TaxonomicRanks)[number],
					true
				> & { id: true })
			});

			const samples = await prisma.sample.findMany({
				where: {
					Libraries: {
						some: {
							Occurrences: {
								some: {
									analysis_run_name
								}
							}
						}
					}
				},
				include: {
					Libraries: {
						select: {
							lib_id: true
						}
					}
				}
			});

			return { occurrences, assignments, taxonomies, samples };
		},
		{
			timeout: 3 * 60 * 1000
		}
	);

	return (
		<TaxonomyVisualize occurrences={occurrences} assignments={assignments} taxonomies={taxonomies} samples={samples} />
	);
}
