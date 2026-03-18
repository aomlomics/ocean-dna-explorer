import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import MapComponent from "@/app/components/map/Map";
import TableMetadata from "@/types/tableMetadata";
import { Sample } from "@/app/generated/prisma/client";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import TaxonomyDonutChart from "@/app/components/charts/TaxonomyDonutChart";
import { Suspense } from "react";
import StatCard from "@/app/components/explore/StatCard";
import DropdownCard from "@/app/components/explore/DropdownCard";
import { EyeIcon, AnalysisIcon, AssayIcon, FishIcon, LocationIcon } from "@/app/components/icons";

export default async function Samp_name({ params }: { params: Promise<{ samp_name: Sample["samp_name"] }> }) {
	let { samp_name } = await params;
	samp_name = decodeURIComponent(samp_name);

	const sample = await prisma.sample.findUnique({
		where: {
			samp_name
		},
		include: {
			Assays: {
				select: {
					assay_name: true,
					target_gene: true
				}
			},
			Project: {
				select: {
					isPrivate: true
				}
			}
		}
	});

	if (!sample) return <>Sample not found</>;
	const { Assays: _, Project: __, ...justSample } = sample;

	return (
		<div id="sample" className="space-y-8 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={`/explore/project/${sample.project_id}`} className="text-primary hover:text-primary-focus">
							{sample.project_id}
						</Link>
					</li>
					<li>
						<Link href={`/explore/sample`} className="text-primary hover:text-primary-focus">
							Samples
						</Link>
					</li>
					<li>{samp_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.sample.description}
					>
						{samp_name}
					</h1>
					{sample.Project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					This sample is a part of the{" "}
					<Link href={`/explore/project/${sample.project_id}`} className="text-primary hover:text-primary-focus">
						{sample.project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left column - Map and Assays */}
				<div className="space-y-8">
					<MapComponent locations={[sample]} className="aspect-square" />

					{/* Assays Section */}
					<div id="assays-section" className="target:animate-flash">
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
							Assays used on this Sample ({sample.Assays.length})
						</h2>
						<div className="space-y-2">
							{sample.Assays.map((assay) => (
								<div key={assay.assay_name} className="flex items-center gap-4 p-4 rounded-lg">
									<div className="w-16 h-16 shrink-0 rounded-lg bg-linear-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
										<div className="relative w-12 h-12">
											<Suspense>
												<AssayPhyloPic assay_name={assay.assay_name} />
											</Suspense>
										</div>
									</div>
									<div>
										<h3 className="font-bold text-lg text-base-content">{assay.target_gene}</h3>
										<p className="text-base-content/70">{assay.assay_name}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right column - Stats and Information */}
				<div className="lg:col-span-2 space-y-8">
					{/* Stats Grid */}
					<div className="grid grid-cols-3 gap-4">
						<StatCard
							title="Occurrences"
							query={async () =>
								(
									await prisma.occurrence.findMany({
										where: {
											Library: {
												samp_name
											}
										},
										select: {
											featureid: true
										}
									})
								).length
							}
							icon={<EyeIcon />}
							link={`/search?table=occurrence&advanced=[["sample","samp_name","equals","${samp_name}"]]`}
							layout="horizontal"
							tooltip="View as Search"
						/>

						<DropdownCard
							table="analysis"
							icon={<AnalysisIcon />}
							query={async () =>
								await prisma.analysis.findMany({
									where: {
										Occurrences: {
											some: {
												Library: {
													samp_name
												}
											}
										}
									},
									select: {
										analysis_run_name: true
									}
								})
							}
						/>

						<DropdownCard table="assay" items={sample.Assays} icon={<AssayIcon />} />

						<StatCard
							title="Taxonomies"
							query={async () =>
								(
									await prisma.taxonomy.findMany({
										where: {
											Assignments: {
												some: {
													Occurrences: {
														some: {
															Library: {
																samp_name
															}
														}
													}
												}
											}
										},
										select: {
											taxonomy: true
										}
									})
								).length
							}
							icon={<FishIcon />}
							link={`/search?table=taxonomy&advanced=[["sample","samp_name","equals","${samp_name}"]]`}
							layout="horizontal"
							tooltip="View as Search"
						/>
						<StatCard
							title="Location"
							latitude={sample.decimalLatitude}
							longitude={sample.decimalLongitude}
							icon={<LocationIcon />}
						/>
						<div className="bg-base-200 p-4 rounded-lg"></div>
					</div>

					{/* Sample Information */}
					<div className="bg-base-200 rounded-xl p-6">
						<h2 className="text-xl font-medium text-base-content/90 mb-4">Sample Information</h2>
						<div className="h-75 overflow-y-auto">
							<DataDisplay table="sample" data={justSample} omit={["project_id", "analysis_run_name", "assay_name"]} />
						</div>
					</div>
				</div>
			</div>

			{/* Taxonomy Relative Abundance Chart */}
			<Suspense>
				<SuspenseTaxonomyDonutChart samp_name={samp_name} />
			</Suspense>
		</div>
	);
}

async function SuspenseTaxonomyDonutChart({ samp_name }: { samp_name: Sample["samp_name"] }) {
	const taxonomies = await prisma.taxonomy.findMany({
		where: {
			Assignments: {
				some: {
					Occurrences: {
						some: {
							Library: {
								samp_name
							}
						}
					}
				}
			}
		},
		omit: {
			id: true,
			verbatimIdentification: true
		}
	});

	const taxonomyCounts = new Map<string, number>();
	for (const taxa of taxonomies) {
		taxonomyCounts.set(taxa.taxonomy, (taxonomyCounts.get(taxa.taxonomy) ?? 0) + 1);
	}

	const taxonomyData = Array.from(taxonomyCounts.entries())
		.map(([taxonomy, count]) => ({ taxonomy, count }))
		.sort((a, b) => b.count - a.count);

	if (!taxonomyData.length) {
		return <></>;
	}

	return (
		<div id="taxonomyChart">
			<h2 className="text-xl font-medium mb-4">
				<span className="text-base-content/90">
					Taxonomies found in this <span className="text-primary font-bold">Sample</span>
				</span>
			</h2>
			<div className="w-full">
				<TaxonomyDonutChart
					labels={taxonomyData.map((t) => t.taxonomy)}
					data={taxonomyData.map((t) => t.count)}
					sampName={samp_name}
				/>
			</div>
		</div>
	);
}
