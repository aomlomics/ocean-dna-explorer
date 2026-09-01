import DataDisplay from "@/app/components/explore/DataDisplay";
import { trustedPrisma } from "@/app/helpers/prisma";
import Link from "next/link";
import MapComponent from "@/app/components/map/Map";
import TableMetadata, { exploreUrl } from "@/types/tableMetadata";
import TaxonomyDonutChart from "@/app/components/charts/TaxonomyDonutChart";
import StatCard from "@/app/components/explore/StatCard";
import DropdownCard from "@/app/components/explore/DropdownCard";
import { EyeIcon, AnalysisIcon, AssayIcon, FishIcon, LocationIcon } from "@/app/components/icons";
import type { AnalysisModel, AssayModel } from "@/app/generated/prisma/models";
import AssaysCard from "@/app/components/assay/AssaysCard";
import TitleHoverTooltip from "@/app/components/explore/TitleHoverTooltip";
import { decodeRouteParams } from "@/app/helpers/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
	params
}: {
	params: Promise<{ project_id: string; samp_name: string }>;
}): Promise<Metadata> {
	const { project_id, samp_name } = await decodeRouteParams(params);

	const sample = await trustedPrisma.sample.findUnique({
		where: {
			project_id_samp_name: {
				project_id,
				samp_name
			}
		},
		select: {
			id: true
		}
	});

	if (sample) {
		return {
			title: `${samp_name} | ${TableMetadata.sample.plural}`
		};
	} else {
		return {
			title: "Sample not found"
		};
	}
}

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
			Taxonomies: {
				omit: {
					id: true,
					verbatimIdentification: true
				}
			},
			Libraries: {
				select: {
					_count: {
						select: {
							Occurrences: true
						}
					},
					Assay: {
						select: {
							assay_name: true,
							target_gene: true
						}
					},
					Analyses: {
						distinct: ["analysis_run_name"],
						select: {
							analysis_run_name: true
						}
					}
				}
			}
		}
	});

	if (!sample) notFound();
	const { Taxonomies, Libraries, ...justSample } = sample;

	const uniqueAssays = [] as { assay_name: AssayModel["assay_name"]; target_gene: AssayModel["target_gene"] }[];
	for (const lib of Libraries) {
		if (!uniqueAssays.some((a) => lib.Assay.assay_name === a.assay_name)) {
			uniqueAssays.push(lib.Assay);
		}
	}

	const uniqueAnalyses = Libraries.reduce(
		(acc, lib) => {
			lib.Analyses.forEach((a) => acc.add(a.analysis_run_name));
			return acc;
		},
		new Set() as Set<AnalysisModel["analysis_run_name"]>
	);

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
							value={Libraries.reduce((count, lib) => count + lib._count.Occurrences, 0)}
							icon={<EyeIcon />}
							link={`/search?table=occurrence&advanced=[["sample","samp_name","equals","${samp_name}"]]`}
							layout="horizontal"
							tooltip="View as Search"
						/>

						<DropdownCard
							table="analysis"
							icon={<AnalysisIcon />}
							items={Array.from(uniqueAnalyses).reduce(
								(acc, analysis_run_name) => [...acc, { project_id, analysis_run_name }],
								[] as {
									project_id: AnalysisModel["project_id"];
									analysis_run_name: AnalysisModel["analysis_run_name"];
								}[]
							)}
						/>

						<DropdownCard table="assay" items={uniqueAssays.map((a) => a.assay_name)} icon={<AssayIcon />} />

						<StatCard
							title="Taxonomies"
							value={Taxonomies.length}
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
			<div id="taxonomyChart">
				<h2 className="text-xl font-medium mb-4">
					<span className="text-base-content/90">
						Taxonomies found in this <span className="text-primary font-bold">Sample</span>
					</span>
				</h2>
				<div className="w-full">
					<TaxonomyDonutChart taxonomies={Taxonomies} />
				</div>
			</div>
		</div>
	);
}
