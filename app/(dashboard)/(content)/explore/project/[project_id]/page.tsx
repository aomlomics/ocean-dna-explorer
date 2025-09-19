import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import Image from "next/image";
import Table from "@/app/components/paginated/Table";
import BarChart from "@/app/components/charts/BarChart";
import { randomColors } from "@/app/helpers/utils";
import EditHistory from "@/app/components/EditHistory";
import ProjectStatCard from "@/app/components/explore/ProjectStatCard";
import StatIcon from "@/app/components/icons/StatIcon";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import WaterSurface from "@/app/components/eDNA_graphic/WaterSurface";

export default async function Project_Id({ params }: { params: Promise<{ project_id: string }> }) {
	let { project_id } = await params;
	project_id = decodeURIComponent(project_id);

	const project = await prisma.project.findUnique({
		where: {
			project_id
		},
		include: {
			_count: {
				select: {
					Samples: true,
					Analyses: true
				}
			},
			Samples: {
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			},
			Analyses: {
				select: {
					analysis_run_name: true,
					assay_name: true,
					Assay: {
						select: {
							target_gene: true
						}
					},
					Assignments: {
						select: {
							taxonomy: true
						}
					}
				}
			}
		}
	});
	if (!project) return <>Project not found</>;
	const { _count: _, Samples: __, Analyses: ___, editHistory: ____, ...justProject } = project;

	const uniqueAssays = project.Analyses.reduce(
		(acc: Record<string, Record<string, string>>, a) => ({
			...acc,
			[a.assay_name]: { target_gene: a.Assay.target_gene }
		}),
		{}
	);

	//get a sorted array of taxonomy counts, and a separate object to show which analysis taxonomies came from
	const taxaCount = {} as Record<string, number>;
	const taxaCountByAnalysis = {} as Record<string, Record<string, number>>;
	for (const a of project.Analyses) {
		taxaCountByAnalysis[a.analysis_run_name] = {};
		for (const assign of a.Assignments) {
			if (assign.taxonomy in taxaCount) {
				taxaCount[assign.taxonomy] += 1;
			} else {
				taxaCount[assign.taxonomy] = 1;
			}

			if (assign.taxonomy in taxaCountByAnalysis[a.analysis_run_name]) {
				taxaCountByAnalysis[a.analysis_run_name][assign.taxonomy] += 1;
			} else {
				taxaCountByAnalysis[a.analysis_run_name][assign.taxonomy] = 1;
			}
		}
	}
	const colorsArr = randomColors(Object.keys(taxaCountByAnalysis).length);
	const sortedTaxa = Object.entries(taxaCount).sort(([, a], [, b]) => b - a);
	const topTaxa = [...sortedTaxa]; // Create a copy for the top taxonomy section

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs">
				<ul>
					<li>
						<Link href="/explore/project" className="text-primary hover:text-primary-focus">
							Projects
						</Link>
					</li>
					<li>{project_id}</li>
				</ul>
			</div>

			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2">{project.project_id}</h1>
					<EditHistory editHistory={project.editHistory} />
					{project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">{project.project_name}</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
				{/* Left side content */}
				<div className="lg:col-span-2 space-y-8">
					<div className="h-[600px]">
						<Map locations={project.Samples} id="samp_name" table="sample" cluster />
					</div>
					{/* Assays Section */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
							Assays in this Project ({Object.keys(uniqueAssays).length})
						</h2>
						<div className="space-y-2">
							{Object.keys(uniqueAssays).map((assay) => {
								return (
									<div key={assay} className="flex items-center gap-4 p-4 rounded-lg">
										<div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
											<div className="relative w-12 h-12">
												<AssayPhyloPic assayName={assay} />
											</div>
										</div>
										<div>
											<h3 className="font-bold text-lg text-base-content">
												{uniqueAssays[assay].target_gene}
											</h3>
											<p className="text-base-content/70">{assay}</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Right side content */}
				<div className="space-y-8">
					{/* Project at a Glance */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project at a Glance</h2>
						<div className="grid grid-cols-2 gap-4">
							<ProjectStatCard
								title="Samples"
								value={project._count.Samples}
								icon="location"
								href="#samples-section"
							/>
							<ProjectStatCard title="Analyses" value={project._count.Analyses} icon="analysis" />
							<ProjectStatCard title="Taxonomies" value={sortedTaxa.length} icon="fish" />
							<ProjectStatCard
								title="Occurrences"
								value={project.Analyses.reduce((sum, a) => sum + a.Assignments.length, 0)}
								icon="eye"
							/>
						</div>
					</div>

					{/* Project Information */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project Information</h2>
						<div className="space-y-3 text-lg">
							<p>
								<span className="font-semibold text-base-content/80">Contact:</span>{" "}
								{project.project_contact || "N/A"}
							</p>
							<p>
								<span className="font-semibold text-base-content/80">Institution:</span>{" "}
								{project.institution || "N/A"}
							</p>
							<p>
								<span className="font-semibold text-base-content/80">Assay Type:</span>{" "}
								{project.assay_type || "N/A"}
							</p>
						</div>
					</div>

					{/* Top Taxonomy */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Top 10 Taxonomy</h2>
						<ul className="space-y-2">
							{topTaxa.slice(0, 10).map((taxa, index) => {
								const taxonomyParts = taxa[0].split(";").filter(Boolean);
								const lastTaxonomy = taxonomyParts[taxonomyParts.length - 1]?.trim() || "Unknown";
								return (
									<li key={taxa[0]} className="flex items-center justify-between text-base">
										<span>
											<span className="font-bold text-primary mr-2">{index + 1}.</span>
											{lastTaxonomy}
										</span>
										<span className="badge badge-ghost">{taxa[1]}</span>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>

			{/* Samples Table */}
			<div className="mt-8">
				<h2 id="samples-section" className="text-2xl font-semibold text-base-content/90 mb-4">
					Samples
				</h2>
				<Table table="sample" showUserDefined where={{ project_id }} defaultTake={20} />
			</div>

			{/* Taxonomy Chart */}
			<div className="mt-8">
				<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Taxonomy Distribution</h2>
				<div className="bg-base-200 p-4 rounded-lg">
					<BarChart
						title="Top 10 Taxonomies"
						labels={sortedTaxa.slice(0, 10).map((taxaArr) => taxaArr[0].split(";").pop() || "Unknown")}
						datasets={Object.keys(taxaCountByAnalysis).map((taxa, i) => ({
							label: taxa.split(";").pop() || "Unknown",
							data: sortedTaxa.slice(0, 10).map((taxaArr) => taxaCountByAnalysis[taxa][taxaArr[0]] || 0),
							backgroundColor: colorsArr[i]
						}))}
					/>
				</div>
			</div>
		</div>
	);
}
