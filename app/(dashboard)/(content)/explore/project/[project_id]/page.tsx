import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import BarChart from "@/app/components/charts/BarChart";
import { randomColors } from "@/app/helpers/utils";
import EditHistory from "@/app/components/EditHistory";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import DataDisplay from "@/app/components/DataDisplay";
import TableMetadata from "@/types/tableMetadata";
import { Project } from "@/app/generated/prisma/client";
import { Suspense } from "react";

export default async function Project_id({ params }: { params: Promise<{ project_id: Project["project_id"] }> }) {
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
	const { _count: _, Analyses: ___, editHistory: ____, ...justProject } = project;

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
	const taxaCountByAssay = {} as Record<string, Record<string, number>>;

	for (const a of project.Analyses) {
		taxaCountByAnalysis[a.analysis_run_name] = {};
		if (!taxaCountByAssay[a.assay_name]) {
			taxaCountByAssay[a.assay_name] = {};
		}

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

			if (assign.taxonomy in taxaCountByAssay[a.assay_name]) {
				taxaCountByAssay[a.assay_name][assign.taxonomy] += 1;
			} else {
				taxaCountByAssay[a.assay_name][assign.taxonomy] = 1;
			}
		}
	}
	const colorsArr = randomColors(Object.keys(taxaCountByAnalysis).length);
	const sortedTaxa = Object.entries(taxaCount).sort(([, a], [, b]) => b - a);

	// Get top 2 taxonomies per assay
	const topTaxaByAssay = Object.entries(taxaCountByAssay).reduce((acc, [assay, taxa]) => {
		const sortedAssayTaxa = Object.entries(taxa)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 2)
			.map(([taxonomy, count]) => {
				const taxonomyParts = taxonomy.split(";").filter(Boolean);
				const displayName = taxonomyParts[taxonomyParts.length - 1]?.trim() || "Unknown";
				const totalAssayCount = Object.values(taxa).reduce((sum, c) => sum + c, 0);
				const percentage = ((count / totalAssayCount) * 100).toFixed(1);
				return { displayName, count, percentage };
			});
		acc[assay] = sortedAssayTaxa;
		return acc;
	}, {} as Record<string, Array<{ displayName: string; count: number; percentage: string }>>);

	return (
		<div className="space-y-8">
			{/* Breadcrumb navigation */}
			<div className="text-base breadcrumbs mb-4">
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
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right"
						data-tip={TableMetadata.project.description}
					>
						{project.project_id}
					</h1>
					<EditHistory editHistory={project.editHistory} />
					{project.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70 max-w-4xl">{project.project_name}</p>

				{/* Compact project information under the description */}
				<div className="text-sm text-base-content/80 flex flex-wrap gap-x-6 gap-y-1">
					<div>
						<span className="font-medium text-base-content/70">Contact: </span>
						<span>{project.project_contact || "N/A"}</span>
					</div>
					<div>
						<span className="font-medium text-base-content/70">Institution: </span>
						<span>{project.institution || "N/A"}</span>
					</div>
					<div>
						<span className="font-medium text-base-content/70">Assay Type: </span>
						<span>{project.assay_type || "N/A"}</span>
					</div>
				</div>
			</header>

			{/* Map + stats + below-map content grouped so spacing between map and metadata is consistent */}
			<section className="mt-2 space-y-8">
				{/* Top layout: Map and Project at a Glance */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
					{/* Left: Map */}
					<div className="lg:col-span-2 h-full">
						<Map
							query={() => prisma.sample.findMany({ where: { project_id } })}
							cluster
							legend
							draw
							legendOmit={["project_id"]}
							className="h-full w-full min-h-80"
						/>
					</div>

					{/* Right: Project at a Glance */}
					<div className="flex flex-col h-full">
						<h2 className="text-2xl font-semibold text-base-content/90">Project at a Glance</h2>

						{/* Stat cards */}
						<div className="mt-4 mb-4">
							<div className="grid grid-cols-2 gap-4">
								<ProjectStatCard
									title="Samples"
									value={project._count.Samples}
									icon="location"
									link={`/search?table=sample&advanced=[["project_id","equals","${project_id}"]]`}
								/>
								<ProjectStatCard
									title="Analyses"
									value={project._count.Analyses}
									icon="analysis"
									link={`/search?table=analysis&advanced=[["project_id","equals","${project_id}"]]`}
								/>
								<ProjectStatCard
									title="Taxonomies"
									value={sortedTaxa.length}
									icon="fish"
									link={`/search?table=taxonomy&advanced=[["project", "project_id","equals","${project_id}"]]`}
								/>
								<ProjectStatCard
									title="Occurrences"
									value={project.Analyses.reduce((sum, a) => sum + a.Assignments.length, 0)}
									icon="eye"
									link={`/search?table=occurrence&advanced=[["project","project_id","equals","${project_id}"]]`}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Below-map layout: Project metadata on the left, Assays + Top Taxonomies on the right */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Project Metadata Table (aligned with map width) */}
					<div className="lg:col-span-2">
						<div className="bg-base-200 rounded-xl p-6 flex flex-col">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Project Metadata</h2>
							<div className="max-h-124 overflow-y-auto">
								<DataDisplay
									table="project"
									data={justProject}
									omit={["project_id"]}
									priorityFields={[
										"project_name",
										"project_contact",
										"institution",
										"institutionID",
										"recordedBy",
										"recordedByID",
										"study_factor",
										"assay_type"
									]}
								/>
							</div>
						</div>
					</div>

					{/* Assays and Top Taxonomies (right half) */}
					<div className="h-full flex flex-col gap-6">
						{/* Assays Section (kept visually the same, just above Top Taxonomies) */}
						<div id="assays-section">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
								Assays in this Project ({Object.keys(uniqueAssays).length})
							</h2>
							<div className="space-y-2">
								{Object.keys(uniqueAssays).map((assay) => {
									return (
										<div key={assay} className="flex items-center gap-4 p-4 rounded-lg">
											<div className="w-16 h-16 shrink-0 rounded-lg bg-linear-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
												<div className="relative w-12 h-12">
													<Suspense>
														<AssayPhyloPic assay_name={assay} />
													</Suspense>
												</div>
											</div>
											<div>
												<h3 className="font-medium text-lg text-base-content">{uniqueAssays[assay].target_gene}</h3>
												<p className="text-base-content/70">{assay}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Top 2 Taxonomies per Assay */}
						<div className="flex-1">
							<h2 className="text-2xl font-semibold text-base-content/90 mb-3">Top 2 Taxonomies per Assay</h2>
							<div className="space-y-3">
								{Object.entries(topTaxaByAssay).map(([assay, taxa]) => (
									<a
										key={assay}
										href="#taxonomy-chart"
										className="block rounded-xl bg-base-200 hover:bg-base-200/80 hover:border-primary/60 shadow-sm hover:shadow-md transition-all cursor-pointer"
									>
										<div className="px-4 py-3 space-y-2">
											<div className="flex flex-col gap-0.5">
												<h3 className="font-medium text-base-content text-sm leading-snug">
													{uniqueAssays[assay].target_gene}
												</h3>
												<p className="text-xs text-base-content/60 truncate">{assay}</p>
											</div>
											<div className="space-y-1">
												{taxa.map((taxon, idx) => (
													<div key={idx} className="relative h-7 rounded-full bg-base-300/80 overflow-hidden">
														<div
															className="absolute inset-y-0 left-0 bg-primary/15"
															style={{ width: `${taxon.percentage}%` }}
														/>
														<div className="relative flex h-full items-center justify-between px-2 text-[0.7rem]">
															<span className="text-base-content/80 truncate">{taxon.displayName}</span>
															<span className="text-base-content/60 whitespace-nowrap">
																{taxon.percentage}% ({taxon.count})
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</a>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Taxonomy Chart */}
			<div className="mt-8" id="taxonomy-chart">
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

type StatIconType = "ship" | "location" | "fish" | "eye" | "analysis";

function ProjectStatCard({
	title,
	value,
	icon,
	link
}: {
	title: string;
	value: number;
	icon: StatIconType;
	link?: string;
}) {
	const content = (
		<div
			className={`group flex flex-col bg-base-200 items-center text-center p-2 rounded-lg ${
				link ? "hover:bg-base-300 transition-all duration-300 hover:scale-105" : ""
			}`}
		>
			<div className="w-16 h-16 mb-2 flex items-center justify-center text-primary">
				<StatIcon icon={icon} />
			</div>
			<div className="text-3xl font-bold text-primary mb-1 group-hover:text-primary-focus transition-colors">
				{value.toLocaleString()}
			</div>
			<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
		</div>
	);

	if (link) {
		return <Link href={link}>{content}</Link>;
	} else {
		return content;
	}
}

function StatIcon({ icon }: { icon: StatIconType }) {
	const getIconData = () => {
		switch (icon) {
			case "ship":
				return {
					viewBox: "0 0 424 169",
					path: (
						<path
							fill="currentColor"
							stroke="none"
							d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13 M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0z M419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83 419.95 111.83 419.95 111.83 M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36ZM116.02,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM125.68,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM135.34,74.02c-.13,2.03-1.88,3.56-3.9,3.43-1.84-.12-3.31-1.59-3.43-3.43v-4.66c.13-2.03,1.88-3.56,3.9-3.43,1.84.12,3.31,1.59,3.43,3.43v4.66Z M136.09,46.99l25.5,2.58s-1.23-.62-1.23-3.07,1.23-2.46,1.23-2.46l-25.5-2.58c-.79.79-1.23,1.88-1.21,3-.04.99.41,1.94,1.21,2.53h0Z M183.72,47.2l-25.24,3.24s1.21-.78,1.21-3.87-1.21-3.07-1.21-3.07l25.24-3.25c.81,1.07,1.23,2.37,1.21,3.7.1,1.21-.35,2.4-1.21,3.25h0Z M148.67,26.17l19.32,2.52s-.93-.6-.93-3,.93-2.35.93-2.35l-19.32-2.46c-.61.81-.94,1.8-.91,2.82-.08.92.26,1.83.91,2.47h0Z M185.01,26.56l-19.27,2.47s.93-.58.93-3-.93-2.37-.93-2.37l19.27-2.47c.62.81.95,1.81.93,2.83.1.94-.25,1.88-.93,2.53h0Z M162.42,7.33l9.24,1.86s-.43-.44-.43-2.13.43-1.68.43-1.68l-9.24-1.78c-.32.63-.47,1.32-.45,2.02-.04.6.12,1.2.45,1.71h0Z M178.86,7.37l-7.99,1.81s.37-.42.37-2.11-.37-1.69-.37-1.69l7.99-1.77c.28.64.41,1.33.39,2.02.04.61-.09,1.21-.39,1.74h0Z M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z"
						/>
					)
				};
			case "location":
				return {
					viewBox: "0 0 24 24",
					path: (
						<path
							fill="currentColor"
							stroke="none"
							d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
						/>
					)
				};
			case "fish":
				return {
					viewBox: "0 0 1536 592",
					path: (
						<g transform="translate(0.000000,592.000000) scale(0.100000,-0.100000)">
							<path
								fill="currentColor"
								stroke="none"
								d="M7037 5902 c-31 -19 -151 -172 -289 -365 -50 -71 -107 -147 -126 -170 -70 -84 -269 -397 -357 -561 -107 -200 -138 -239 -198 -254 -115 -29 -449 -55 -1257 -97 -1271 -66 -1607 -107 -2420 -291 -1390 -315 -2197 -634 -2335 -921 -10 -21 -21 -64 -23 -95 -4 -57 -3 -59 35 -95 22 -21 55 -47 74 -58 63 -37 40 -54 -109 -81 -43 -8 -39 -35 14 -82 101 -92 600 -404 847 -531 186 -95 360 -161 597 -226 113 -31 347 -96 520 -145 813 -229 1308 -330 2070 -425 396 -49 498 -68 514 -94 3 -5 12 -45 20 -89 8 -46 31 -118 54 -169 22 -49 48 -116 57 -149 28 -98 62 -182 134 -332 81 -165 111 -211 201 -308 36 -39 88 -102 115 -140 107 -153 169 -194 296 -194 66 0 81 4 120 28 64 42 319 312 319 339 0 5 36 67 79 137 97 156 131 238 138 331 10 133 -53 235 -212 340 -45 30 -113 68 -151 83 -73 30 -100 56 -74 72 8 5 21 8 28 5 14 -5 308 -27 617 -47 306 -19 918 -17 1160 4 264 23 496 36 860 48 366 12 474 7 531 -26 62 -35 176 -163 261 -293 42 -64 92 -141 112 -171 20 -30 76 -96 126 -146 49 -50 115 -119 146 -155 39 -44 79 -76 130 -105 56 -31 85 -55 118 -100 86 -114 363 -374 399 -374 19 0 88 67 121 117 32 49 83 201 100 298 5 33 15 112 21 175 41 404 205 650 676 1017 214 167 241 189 232 198 -4 4 -82 2 -175 -4 -227 -15 -524 5 -515 35 13 44 769 191 1150 224 183 15 265 3 465 -70 155 -56 251 -86 877 -275 351 -107 658 -212 830 -285 148 -63 579 -211 796 -274 328 -94 424 -88 424 27 0 82 -68 237 -180 406 -34 51 -81 135 -106 185 -51 104 -129 212 -270 374 -230 263 -282 336 -319 449 -16 52 -16 54 8 105 37 81 107 157 282 306 245 208 519 486 595 602 78 119 175 313 167 334 -11 27 -113 51 -217 50 -152 -1 -461 -58 -930 -169 -124 -30 -346 -83 -495 -118 -148 -36 -335 -77 -415 -92 -228 -44 -551 -110 -720 -149 -313 -71 -380 -77 -592 -50 -428 53 -1498 323 -1498 377 0 19 469 -15 595 -43 22 -5 66 -10 98 -10 80 0 76 21 -13 64 -145 72 -231 154 -299 285 -80 157 -98 244 -111 551 -18 396 -31 601 -40 626 -37 97 -326 -101 -1195 -819 l-289 -240 -221 26 c-895 107 -1296 159 -1333 173 -28 10 -47 25 -53 41 -9 24 -6 33 48 176 15 39 16 50 5 65 -29 39 -42 86 -53 179 -21 193 16 352 107 453 19 21 31 40 27 43 -4 2 -39 15 -78 27 -104 34 -198 84 -233 125 -37 41 -42 91 -17 152 34 81 9 89 -101 32 l-85 -43 -32 17 c-43 24 -76 78 -89 145 -20 107 -34 120 -91 84z"
							/>
						</g>
					)
				};
			case "eye":
				return {
					viewBox: "0 0 24 24",
					path: (
						<path
							fill="currentColor"
							stroke="none"
							d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
						/>
					)
				};
			case "analysis":
				return {
					viewBox: "0 0 1024 1024",
					path: (
						<>
							<path
								d="M878.3 152.9H145.7c-38.6 0-70 31.4-70 70V706c0 38.6 31.4 70 70 70h732.6c38.6 0 70-31.4 70-70V222.9c0-38.6-31.4-70-70-70z m30 531V706c0 16.5-13.5 30-30 30H145.7c-16.5 0-30-13.5-30-30V222.9c0-16.5 13.5-30 30-30h732.6c16.5 0 30 13.5 30 30v461zM678 871.1H346c-11 0-20-9-20-20s9-20 20-20h332c11 0 20 9 20 20s-9 20-20 20z"
								fill="currentColor"
							/>
							<path
								d="M127.1 662.7c-2.7 0-5.4-1.1-7.3-3.2-3.7-4.1-3.5-10.4 0.6-14.1l236.5-219.6L463 541.9l258.9-290.7 183.7 196.3c3.8 4 3.6 10.4-0.4 14.1-4 3.8-10.3 3.6-14.1-0.4L722.3 280.8l-259 290.9L355.7 454 133.9 660c-2 1.8-4.4 2.7-6.8 2.7z"
								fill="currentColor"
							/>
							<path d="M208.9 541.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" fill="currentColor" />
							<path d="M633.4 329.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" fill="currentColor" />
							<path d="M748.7 539.6a16.9 17 0 1 0 33.8 0 16.9 17 0 1 0-33.8 0Z" fill="currentColor" />
						</>
					)
				};
			default:
				return { viewBox: "0 0 24 24", path: null };
		}
	};

	const { viewBox, path } = getIconData();

	return (
		<svg className="w-12 h-12" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5">
			{path}
		</svg>
	);
}
