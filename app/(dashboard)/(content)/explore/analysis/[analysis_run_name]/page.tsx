import TaxaGrid from "@/app/components/paginated/TaxaGrid";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import Table from "@/app/components/paginated/Table";
import DataDisplay from "@/app/components/DataDisplay";
import EditHistory from "@/app/components/EditHistory";
import TableMetadata from "@/types/tableMetadata";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import { Analysis } from "@/app/generated/prisma/client";
import { Suspense } from "react";

export default async function Analysis_run_name({
	params
}: {
	params: Promise<{ analysis_run_name: Analysis["analysis_run_name"] }>;
}) {
	let { analysis_run_name } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);

	// Build search URL - using Occurrence table directly since Sample doesn't have analysis_run_name
	const advancedFilter = JSON.stringify([["analysis_run_name", "equals", analysis_run_name]]);
	const encodedFilter = advancedFilter.replace(/\[/g, "%5B").replace(/\]/g, "%5D").replace(/,/g, "%2C");
	const sampleSearchUrl = `/search?table=occurrence&advanced=${encodedFilter}`;

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
			Occurrences: {
				distinct: ["samp_name"],
				select: {
					Sample: true
				}
			}
		}
	});
	if (!analysis) return <>Analysis not found</>;
	const { _count: _, Occurrences: __, editHistory: ___, Assay: ____, ...justAnalysis } = analysis;
	
	const samples = analysis.Occurrences.map((occ) => occ.Sample);

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
					<h1 className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right" data-tip={TableMetadata.analysis.description}>
						{analysis_run_name}
					</h1>
					<EditHistory editHistory={analysis.editHistory} />
					{analysis.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
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
					<Map locations={samples} cluster draw className="w-full h-[440px]" />

					{/* Analysis Information */}
					<div className="bg-base-200 rounded-xl p-6">
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Analysis Information</h2>
						<div className="h-[300px] overflow-y-auto">
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
						
						{/* Download Button */}
						<a
							href={`/api/occurrenceTable/${analysis_run_name}`}
							download={`${analysis_run_name}_occurrenceTable`}
							className="btn btn-lg text-base-content/80 font-normal w-full mb-4"
						>
							Download Occurrence Table
							<svg className="size-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
						</a>
						
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center">
								<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
									<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
										<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
									</svg>
								</div>
								<div className="text-3xl font-bold text-primary mb-1">{analysis._count.Occurrences.toLocaleString()}</div>
								<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">Occurrences</div>
							</div>

							<div className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center">
								<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
									<svg viewBox="0 0 1536 592" fill="currentColor" className="w-10 h-10">
										<g transform="translate(0.000000,592.000000) scale(0.100000,-0.100000)">
											<path d="M7037 5902 c-31 -19 -151 -172 -289 -365 -50 -71 -107 -147 -126 -170 -70 -84 -269 -397 -357 -561 -107 -200 -138 -239 -198 -254 -115 -29 -449 -55 -1257 -97 -1271 -66 -1607 -107 -2420 -291 -1390 -315 -2197 -634 -2335 -921 -10 -21 -21 -64 -23 -95 -4 -57 -3 -59 35 -95 22 -21 55 -47 74 -58 63 -37 40 -54 -109 -81 -43 -8 -39 -35 14 -82 101 -92 600 -404 847 -531 186 -95 360 -161 597 -226 113 -31 347 -96 520 -145 813 -229 1308 -330 2070 -425 396 -49 498 -68 514 -94 3 -5 12 -45 20 -89 8 -46 31 -118 54 -169 22 -49 48 -116 57 -149 28 -98 62 -182 134 -332 81 -165 111 -211 201 -308 36 -39 88 -102 115 -140 107 -153 169 -194 296 -194 66 0 81 4 120 28 64 42 319 312 319 339 0 5 36 67 79 137 97 156 131 238 138 331 10 133 -53 235 -212 340 -45 30 -113 68 -151 83 -73 30 -100 56 -74 72 8 5 21 8 28 5 14 -5 308 -27 617 -47 306 -19 918 -17 1160 4 264 23 496 36 860 48 366 12 474 7 531 -26 62 -35 176 -163 261 -293 42 -64 92 -141 112 -171 20 -30 76 -96 126 -146 49 -50 115 -119 146 -155 39 -44 79 -76 130 -105 56 -31 85 -55 118 -100 86 -114 363 -374 399 -374 19 0 88 67 121 117 32 49 83 201 100 298 5 33 15 112 21 175 41 404 205 650 676 1017 214 167 241 189 232 198 -4 4 -82 2 -175 -4 -227 -15 -524 5 -515 35 13 44 769 191 1150 224 183 15 265 3 465 -70 155 -56 251 -86 877 -275 351 -107 658 -212 830 -285 148 -63 579 -211 796 -274 328 -94 424 -88 424 27 0 82 -68 237 -180 406 -34 51 -81 135 -106 185 -51 104 -129 212 -270 374 -230 263 -282 336 -319 449 -16 52 -16 54 8 105 37 81 107 157 282 306 245 208 519 486 595 602 78 119 175 313 167 334 -11 27 -113 51 -217 50 -152 -1 -461 -58 -930 -169 -124 -30 -346 -83 -495 -118 -148 -36 -335 -77 -415 -92 -228 -44 -551 -110 -720 -149 -313 -71 -380 -77 -592 -50 -428 53 -1498 323 -1498 377 0 19 469 -15 595 -43 22 -5 66 -10 98 -10 80 0 76 21 -13 64 -145 72 -231 154 -299 285 -80 157 -98 244 -111 551 -18 396 -31 601 -40 626 -37 97 -326 -101 -1195 -819 l-289 -240 -221 26 c-895 107 -1296 159 -1333 173 -28 10 -47 25 -53 41 -9 24 -6 33 48 176 15 39 16 50 5 65 -29 39 -42 86 -53 179 -21 193 16 352 107 453 19 21 31 40 27 43 -4 2 -39 15 -78 27 -104 34 -198 84 -233 125 -37 41 -42 91 -17 152 34 81 9 89 -101 32 l-85 -43 -32 17 c-43 24 -76 78 -89 145 -20 107 -34 120 -91 84z" />
										</g>
									</svg>
								</div>
								<div className="text-3xl font-bold text-primary mb-1">{analysis._count.Assignments.toLocaleString()}</div>
								<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">Assignments</div>
							</div>

							<Link href={sampleSearchUrl}>
								<div className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center hover:bg-base-300 transition-all duration-300 hover:scale-105">
									<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
										<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
											<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
										</svg>
									</div>
									<div className="text-3xl font-bold text-primary mb-1">{samples.length.toLocaleString()}</div>
									<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">Samples</div>
								</div>
							</Link>
						</div>
					</div>

					{/* Assay Card */}
					<div>
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Assays used in this Analysis (1)</h2>
						<div className="flex items-center gap-4 p-4 rounded-lg">
							<div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
								<div className="relative w-12 h-12">
									<Suspense>
										<AssayPhyloPic assay_name={analysis.assay_name} />
									</Suspense>
								</div>
							</div>
							<div>
								<h3 className="font-medium text-lg text-base-content">{analysis.Assay.target_gene}</h3>
								<p className="text-base-content/70">{analysis.assay_name}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Data Explorer */}
			<div className="mt-8">
				<h2 className="text-2xl font-semibold text-base-content/90 mb-4">Data Explorer</h2>
				<div role="tablist" className="tabs tabs-lifted">
					<input type="radio" defaultChecked name="dataTabs" role="tab" className="tab" aria-label="Samples" />
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
						<Map
							locations={analysis.Occurrences.map((samp) => ({ ...samp.Sample }))}
							cluster
							legend
							legendOmit={["project_id"]}
						/>
					</div>

					<input type="radio" name="dataTabs" role="tab" className="tab" aria-label="Assignments" />
					<div role="tabpanel" className="tab-content aspect-5/2 w-full border-base-300 rounded-lg">
						<Table table="assignment" where={{ analysis_run_name }} defaultTake={20} />
					</div>

					<input type="radio" defaultChecked name="dataTabs" role="tab" className="tab" aria-label="Taxa" />
					<div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box">
						<TaxaGrid
							where={{
								Assignments: {
									some: {
										analysis_run_name
									}
								}
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
