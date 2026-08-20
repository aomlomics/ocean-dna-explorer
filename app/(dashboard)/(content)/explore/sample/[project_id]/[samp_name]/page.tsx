import DataDisplay from "@/app/components/DataDisplay";
import { trustedPrisma } from "@/app/helpers/prisma";
import Link from "next/link";
import MapComponent from "@/app/components/map/Map";
import TableMetadata, { exploreUrl } from "@/types/tableMetadata";
import TaxonomyDonutChart from "@/app/components/charts/TaxonomyDonutChart";
import { Suspense } from "react";
import StatCard from "@/app/components/explore/StatCard";
import DropdownCard from "@/app/components/explore/DropdownCard";
import { EyeIcon, AnalysisIcon, AssayIcon, FishIcon, LocationIcon } from "@/app/components/icons";
import { Assay, Sample } from "@/app/generated/prisma/client";
import AssaysCard from "@/app/components/assay/AssaysCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";

export default async function Samp_name({ params }: { params: Promise<{ project_id: string; samp_name: string }> }) {
	const { project_id, samp_name } = await decodeRouteParams(params);

	const sample = await trustedPrisma.sample.findUnique({
		where: {
			project_id_samp_name: {
				project_id,
				samp_name
			}
		},
		include: {
			Libraries: {
				select: {
					Assay: {
						select: {
							assay_name: true,
							target_gene: true
						}
					}
				}
			}
		}
	});

	if (!sample) notFound();
	const { Libraries, ...justSample } = sample;
	const uniqueAssays = [] as { assay_name: Assay["assay_name"]; target_gene: Assay["target_gene"] }[];
	for (const lib of Libraries) {
		if (!uniqueAssays.some((a) => lib.Assay.assay_name === a.assay_name)) {
			uniqueAssays.push(lib.Assay);
		}
	}

	return (
		<div id="sample" className="space-y-6 pb-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>
						<Link href={exploreUrl({ table: "project", project_id })} className="text-primary hover:text-primary-focus">
							{project_id}
						</Link>
					</li>
					<li>
						<Link href="/explore/sample" className="text-primary hover:text-primary-focus">
							Samples
						</Link>
					</li>
					<li>{samp_name}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<TitleHoverTooltip tooltip={TableMetadata.sample.description}>
						<h1 className="text-4xl font-semibold text-primary mb-2">{samp_name}</h1>
					</TitleHoverTooltip>
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">
					This sample is a part of the{" "}
					<Link href={exploreUrl({ table: "project", project_id })} className="text-primary hover:text-primary-focus">
						{project_id}
					</Link>{" "}
					project
				</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left column - Map and Assays */}
				<div className="space-y-8">
					<MapComponent locations={[sample]} className="aspect-square" />

					{/* Assays Section */}
					<AssaysCard
						id="assays-section"
						title="Assays used on this Sample"
						assays={uniqueAssays}
						className="target:animate-flash"
					/>
				</div>

				{/* Right column - Stats and Information */}
				<div className="lg:col-span-2 space-y-8">
					{/* Stats Grid */}
					<div className="grid grid-cols-3 gap-4">
						<StatCard
							title="Occurrences"
							query={async () =>
								(
									await trustedPrisma.occurrence.findMany({
										where: {
											Library: {
												project_id,
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
								await trustedPrisma.analysis.findMany({
									where: {
										Occurrences: {
											some: {
												Library: {
													project_id,
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

						<DropdownCard table="assay" items={uniqueAssays.map((a) => a.assay_name)} icon={<AssayIcon />} />

						<StatCard
							title="Taxonomies"
							query={async () =>
								(
									await trustedPrisma.taxonomy.findMany({
										where: {
											Assignments: {
												some: {
													Occurrences: {
														some: {
															Library: {
																project_id,
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
				<SuspenseTaxonomyDonutChart project_id={project_id} samp_name={samp_name} />
			</Suspense>
		</div>
	);
}

async function SuspenseTaxonomyDonutChart({
	project_id,
	samp_name
}: {
	project_id: Sample["project_id"];
	samp_name: Sample["samp_name"];
}) {
	const taxonomies = await trustedPrisma.taxonomy.findMany({
		where: {
			Assignments: {
				some: {
					Occurrences: {
						some: {
							Library: {
								project_id,
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

	if (!taxonomies.length) {
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
				<TaxonomyDonutChart taxonomies={taxonomies} />
			</div>
		</div>
	);
}
