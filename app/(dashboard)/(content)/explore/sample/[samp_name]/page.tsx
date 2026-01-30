import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import MapComponent from "@/app/components/map/Map";
import TableMetadata from "@/types/tableMetadata";
import { Sample } from "@/app/generated/prisma/client";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";
import TaxonomyDonutChart from "@/app/components/charts/TaxonomyDonutChart";
import { Suspense } from "react";

export default async function Samp_name({ params }: { params: Promise<{ samp_name: Sample["samp_name"] }> }) {
	let { samp_name } = await params;
	samp_name = decodeURIComponent(samp_name);

	const { sample, assayData } = await prisma.$transaction(async (tx) => {
		const sample = await tx.sample.findUnique({
			where: {
				samp_name
			},
			include: {
				Assays: {
					select: {
						assay_name: true
					}
				},
				Project: {
					select: {
						isPrivate: true
					}
				}
			}
		});

		if (!sample) return { sample: null, analyses: [], assayData: [], taxonomyData: [] };

		const assays = await tx.assay.findMany({
			where: {
				assay_name: {
					in: sample.Assays.map((a) => a.assay_name)
				}
			},
			select: {
				assay_name: true,
				target_gene: true
			}
		});

		return { sample, assayData: assays };
	});

	if (!sample) return <>Sample not found</>;
	const { Assays: __, Project: ___, ...justSample } = sample;

	return (
		<div className="space-y-8 pb-8">
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
							Assays used on this Sample ({assayData.length})
						</h2>
						<div className="space-y-2">
							{assayData.map((assay) => (
								<div key={assay.assay_name} className="flex items-center gap-4 p-4 rounded-lg">
									<div className="w-16 h-16 shrink-0 rounded-lg bg-linear-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
										<div className="relative w-12 h-12">
											<AssayPhyloPic assay_name={assay.assay_name} />
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
						<Suspense
							fallback={
								<SampleStatCard
									title="Occurrences"
									value="..."
									icon="eye"
									link={`search?table=occurrence&advanced=[["sample","samp_name","equals","${samp_name}"]]`}
								/>
							}
						>
							<SampleStatCard
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
								icon="eye"
								link={`search?table=occurrence&advanced=[["sample","samp_name","equals","${samp_name}"]]`}
							/>
						</Suspense>

						<Suspense fallback={<AnalysisDropdownCard />}>
							<AnalysisDropdownCard samp_name={samp_name} />
						</Suspense>
						<AssayDropdownCard count={sample.Assays.length} assayNames={sample.Assays.map((a) => a.assay_name)} />
						<SampleStatCard
							title="Location"
							latitude={sample.decimalLatitude}
							longitude={sample.decimalLongitude}
							icon="location"
						/>
						<Link
							href={`search?table=taxonomy&advanced=[["sample","samp_name","equals","${encodeURIComponent(samp_name)}"]]`}
							className="group"
						>
							<div className="bg-base-200 p-4 rounded-lg hover:bg-base-300 transition-colors h-full flex flex-col items-center justify-center text-center">
								<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
									<StatIcon icon="fish" />
								</div>
								<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider group-hover:text-primary transition-colors">
									What taxonomies were found in this sample?
								</div>
							</div>
						</Link>
						<div className="bg-base-200 p-4 rounded-lg"></div>
					</div>

					{/* Sample Information */}
					<div className="bg-base-200 rounded-xl p-6">
						<h2 className="text-xl font-medium text-base-content/90 mb-4">Sample Information</h2>
						<div className="h-[300px] overflow-y-auto">
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

type StatIconType = "location" | "eye" | "analysis" | "fish";

async function SuspenseTaxonomyDonutChart({ samp_name }: { samp_name: Sample["samp_name"] }) {
	const assignments = await prisma.assignment.findMany({
		where: {
			Analysis: {
				Occurrences: {
					some: {
						Library: {
							samp_name
						}
					}
				}
			}
		},
		select: {
			taxonomy: true
		}
	});

	const taxonomyCounts = new Map<string, number>();
	for (const assignment of assignments) {
		taxonomyCounts.set(assignment.taxonomy, (taxonomyCounts.get(assignment.taxonomy) ?? 0) + 1);
	}

	const taxonomyData = Array.from(taxonomyCounts.entries())
		.map(([taxonomy, count]) => ({ taxonomy, count }))
		.sort((a, b) => b.count - a.count);

	if (!taxonomyData.length) {
		return <></>;
	}

	return (
		<div>
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

async function SampleStatCard({
	title,
	value,
	query,
	latitude,
	longitude,
	icon,
	link
}: {
	title: string;
	value?: number | string;
	latitude?: number | null;
	longitude?: number | null;
	icon?: StatIconType;
	link?: string;
} & ({ value?: number | string; query?: undefined } | { value?: undefined; query?: () => Promise<number> })) {
	let queryVal = value;
	if (query) {
		await new Promise((res) => setTimeout(res, 10000));
		queryVal = await query();
	}

	let content;
	let className;
	// Use horizontal layout for eye icon
	if (icon === "eye" && queryVal !== undefined) {
		className = "items-center gap-4";
		content = (
			<>
				<div className="w-16 h-16 shrink-0 flex items-center justify-center text-primary">
					<StatIcon icon={icon} />
				</div>
				<div className="flex flex-col">
					<div className="text-3xl font-bold text-primary">{queryVal.toLocaleString()}</div>
					<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
				</div>
			</>
		);
	} else {
		// Vertical centered layout for other cards
		className = "flex-col items-center text-center";
		content = (
			<>
				{icon && icon !== "eye" && (
					<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
						<StatIcon icon={icon} />
					</div>
				)}
				{queryVal !== undefined && (
					<div className="text-3xl font-bold text-primary mb-1">{queryVal.toLocaleString()}</div>
				)}
				{latitude !== undefined && longitude !== undefined && (
					<div className="text-base text-primary font-bold">
						{latitude !== null && longitude !== null ? (
							<>
								<div>Lat: {latitude.toFixed(4)}</div>
								<div>Lon: {longitude.toFixed(4)}</div>
							</>
						) : (
							<div className="text-base-content/60">N/A</div>
						)}
					</div>
				)}
				<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">{title}</div>
			</>
		);
	}

	if (link) {
		return (
			<Link href={link}>
				<div
					className={`bg-base-200 p-4 h-full rounded-lg flex tooltip tooltip-secondary before:text-primary-content ${className}`}
					data-tip="View as Search"
				>
					{content}
				</div>
			</Link>
		);
	} else {
		return <div className={`bg-base-200 p-4 rounded-lg flex ${className}`}>{content}</div>;
	}
}

function StatIcon({ icon }: { icon: StatIconType }) {
	const getIconData = () => {
		switch (icon) {
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

async function AnalysisDropdownCard({ samp_name }: { samp_name?: Sample["samp_name"] }) {
	let analyses;
	if (samp_name) {
		analyses = await prisma.analysis.findMany({
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
		});
	}

	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg">
			<div
				tabIndex={0}
				role="button"
				className="focus:bg-base-300 rounded-lg w-full p-4 flex items-center gap-4 justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 shrink-0 flex items-center justify-center text-primary">
						<StatIcon icon="analysis" />
					</div>
					<div>
						<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
							<span className="block">Total</span>
							<span className="block">Analyses</span>
						</div>
						<div className="text-2xl font-bold text-primary">{analyses ? analyses.length : "..."}</div>
					</div>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-base-content/70"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
			<ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-1 p-2 shadow">
				{analyses ? (
					analyses!.map((a) => (
						<li key={a.analysis_run_name}>
							<Link
								href={`explore/analysis/${a.analysis_run_name}`}
								className="text-base-content hover:text-primary break-all"
							>
								{a.analysis_run_name}
							</Link>
						</li>
					))
				) : (
					<></>
				)}
			</ul>
		</div>
	);
}

function AssayDropdownCard({ count, assayNames }: { count: number; assayNames: string[] }) {
	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg">
			<div
				tabIndex={0}
				role="button"
				className="focus:bg-base-300 rounded-lg w-full p-4 flex items-center gap-4 justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 shrink-0 flex items-center justify-center text-primary">
						<AssayIcon />
					</div>
					<div>
						<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
							<span className="block">Total</span>
							<span className="block">Assays</span>
						</div>
						<div className="text-2xl font-bold text-primary">{count}</div>
					</div>
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-base-content/70"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</div>
			<ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-1 p-2 shadow">
				{assayNames.map((name) => (
					<li key={name}>
						<Link href={`/explore/assay/${name}`} className="text-base-content hover:text-primary break-all">
							{name}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

function AssayIcon() {
	return (
		<svg version="1.1" x="0px" y="0px" viewBox="250 0 550 544" xmlSpace="preserve" className="w-12 h-12">
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M1.000000,441.375000 
C5.402105,443.725037 9.307154,440.363525 13.416513,439.850525 
C18.135319,439.261383 23.017313,443.998077 22.361820,448.751587 
C21.579498,454.424866 21.204031,459.966339 18.636686,465.437531 
C16.900997,469.136353 16.542158,474.282288 20.482365,477.952271 
C21.388285,478.796082 21.309683,479.733734 20.638279,480.607758 
C19.998636,481.440399 18.777445,482.219147 18.129065,481.295685 
C16.168613,478.503601 12.580867,479.346832 10.276000,477.647919 
C10.422181,476.363800 11.315891,476.275665 12.078240,475.991394 
C17.104002,474.117279 18.309349,471.193054 15.745546,466.343475 
C14.467166,463.925293 14.080295,462.283264 16.114256,459.737427 
C18.982323,456.147644 18.393372,451.543945 17.208317,447.297791 
C16.583693,445.059692 14.463182,444.560364 12.390266,444.449371 
C8.904435,444.262787 5.413903,444.164001 1.462674,444.014160 
C1.000000,443.250000 1.000000,442.500000 1.000000,441.375000 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M664.159668,459.296143 
C658.848145,457.771301 654.624695,455.080231 651.071716,451.509491 
C631.216309,431.554657 611.452637,411.508484 591.636353,391.514648 
C588.193909,388.041382 586.552063,384.457672 590.395569,380.227448 
C591.769409,378.715363 591.687744,377.271179 590.221985,375.870117 
C589.861206,375.525238 589.529114,375.149750 589.191895,374.780884 
C580.422668,365.189667 580.454895,365.239471 569.709839,372.113556 
C547.003601,386.639740 522.198975,392.552887 495.400391,389.761078 
C491.858459,389.392120 491.132904,390.511108 491.101501,393.747528 
C490.970642,407.230865 491.640167,420.719025 490.429016,434.198303 
C487.815338,463.286621 467.825165,487.002289 438.246796,494.021484 
C413.263214,499.950287 384.548401,489.787018 368.726776,465.505859 
C361.426636,454.302399 357.630585,442.174866 357.635254,428.790863 
C357.670471,327.989197 357.669861,227.187546 357.676910,126.385895 
C357.677063,124.053574 357.678528,121.719864 357.603546,119.389236 
C357.481598,115.598228 355.922668,113.015350 352.274963,111.186867 
C341.130371,105.600365 336.288971,94.660538 339.297424,82.851578 
C342.167786,71.584900 351.357819,64.681091 363.621552,64.674522 
C405.441467,64.652130 447.261383,64.640068 489.081299,64.659225 
C501.281097,64.664810 511.155029,73.080048 513.215881,85.087120 
C515.281677,97.122757 508.816986,108.363831 497.018250,112.157440 
C492.461334,113.622620 490.958221,116.262550 491.007507,120.559616 
C491.076324,126.555862 491.199371,132.554993 491.080170,138.548523 
C491.012482,141.952606 492.437164,142.869522 495.648682,142.507492 
C519.539001,139.814331 542.229980,144.075073 563.087646,155.911713 
C597.822388,175.623611 618.283264,205.723892 625.303711,244.891052 
C630.979614,276.557220 624.759644,306.091675 608.086914,333.457153 
C606.010315,336.865540 606.367859,339.156799 609.296326,341.565033 
C611.090576,343.040527 612.757141,344.711945 614.276855,346.471680 
C616.839966,349.439789 619.188965,351.597809 623.460266,348.745056 
C626.015259,347.038635 628.578186,348.970795 630.532227,350.935547 
C647.684265,368.181122 664.808594,385.454254 681.953735,402.706665 
C684.418335,405.186707 686.962219,407.587769 689.448730,410.046295 
C699.578979,420.062866 701.922485,432.060760 696.034912,443.700470 
C689.741089,456.143311 678.821167,461.575958 664.159668,459.296143 
M430.298431,170.784393 
C442.867279,159.727341 457.202454,151.853973 473.169830,146.874451 
C475.409790,146.175903 478.957886,146.134613 478.543823,142.773926 
C476.925171,129.635742 482.240387,116.365448 477.690704,103.315720 
C477.604584,103.068726 477.864746,102.700996 478.037628,102.154938 
C481.511261,101.190895 485.187775,101.898621 488.796265,101.637192 
C494.221039,101.244171 498.297882,98.862892 500.619781,93.800713 
C502.673004,89.324295 501.389191,85.320175 498.765106,81.599533 
C495.973206,77.641006 491.857849,76.876266 487.297150,76.859344 
C465.322754,76.777832 443.348999,76.519325 421.374603,76.427780 
C402.881439,76.350739 384.387604,76.385475 365.894257,76.442001 
C361.352020,76.455887 356.757996,76.785240 353.583984,80.683052 
C350.161041,84.886536 349.173645,89.693047 351.442322,94.714699 
C353.782440,99.894554 358.344086,101.629837 363.719482,101.633408 
C387.378876,101.649132 411.038269,101.644806 434.697662,101.653603 
C436.529877,101.654282 438.372650,101.584084 440.192078,101.749519 
C443.904999,102.087120 446.166656,104.276680 446.029144,107.930794 
C445.899231,111.382698 443.504120,113.203133 440.022736,113.358688 
C435.031647,113.581703 430.022369,114.126785 425.049744,113.900314 
C408.243652,113.134918 391.423004,114.602905 374.627441,113.418869 
C371.467529,113.196106 369.242371,113.511230 369.312378,117.810326 
C369.677765,140.255585 369.937653,162.705109 369.935699,185.153122 
C369.933350,212.117889 369.486023,239.082687 369.495575,266.047394 
C369.506592,297.180908 370.186340,328.318481 369.852509,359.446503 
C369.609741,382.088684 370.206024,404.719971 369.922577,427.352478 
C369.777588,438.929138 372.944977,449.427643 379.217285,458.935608 
C392.336212,478.821991 416.914642,487.570892 439.739929,480.785095 
C462.269836,474.087097 478.616608,452.311340 478.705963,428.817871 
C478.752228,416.655090 478.604340,404.489807 478.815826,392.330414 
C478.878632,388.720490 477.677795,386.887695 474.233765,385.826630 
C465.300659,383.074432 456.625092,379.581329 448.608032,374.744629 
C404.052612,347.864319 380.767303,298.434662 388.733612,246.983124 
C393.382477,216.957474 407.108826,191.626694 430.298431,170.784393 
M426.051575,192.541168 
C424.666687,194.204788 423.135101,195.768066 421.918579,197.546844 
C397.585907,233.125488 392.169006,270.952850 408.810669,311.213440 
C427.426575,356.250214 472.237091,383.215179 519.803162,377.527008 
C572.907837,371.176514 610.343628,326.813690 614.558716,275.975647 
C616.878723,247.993713 609.871399,222.090546 593.359253,199.111191 
C574.655029,173.081253 549.480164,157.346039 517.443970,154.541534 
C480.980194,151.349442 450.444183,164.023163 426.051575,192.541168 
M665.969666,446.719513 
C673.375488,448.789490 680.224854,446.277649 684.140564,440.055786 
C688.345337,433.374695 687.823669,425.994232 681.915039,419.956146 
C664.113586,401.764557 646.062744,383.817108 628.208740,365.676422 
C625.653381,363.079956 623.916077,363.530029 621.656982,365.905884 
C616.843750,370.967987 612.057190,376.087585 606.872192,380.752930 
C603.301208,383.965973 603.298157,386.024567 606.777405,389.465179 
C623.567261,406.068726 640.082642,422.949707 656.705139,439.722656 
C659.275208,442.315979 661.684082,445.126556 665.969666,446.719513 
M604.057983,353.439728 
C597.492920,346.924072 595.563721,347.448730 589.487732,357.638611 
C593.491699,361.119812 597.558228,364.655334 601.852478,368.388885 
C602.235596,368.041595 603.374451,367.111664 604.395630,366.066742 
C610.446350,359.875549 611.646423,361.170380 604.057983,353.439728 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M50.739246,134.697571 
C49.649517,132.881165 47.570309,132.095673 47.868626,129.881393 
C51.568756,129.797226 59.974308,134.275925 60.373569,136.526962 
C61.870014,144.963867 59.648903,148.570221 50.247669,152.113983 
C52.309715,146.247467 52.434242,140.640198 50.739246,134.697571 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M34.848965,362.454590 
C34.773476,359.768921 34.267639,357.841980 32.077679,356.569672 
C30.850706,355.856781 30.165848,354.516937 31.560238,353.289124 
C32.630402,352.346832 34.011833,352.007385 35.087936,353.297607 
C37.432682,356.108826 40.809540,358.288635 39.674702,362.995697 
C39.080524,365.460266 39.540230,368.037170 41.592472,370.331116 
C43.715519,372.704224 42.818050,375.319031 39.664307,375.918762 
C37.268147,376.374420 36.074932,378.011841 33.438587,380.295074 
C33.990181,373.788910 35.869984,368.378326 34.848965,362.454590 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M34.756538,440.855103 
C40.170033,440.195374 45.925228,438.423889 50.617901,439.940338 
C57.348713,442.115479 57.978752,447.325287 52.947544,451.646881 
C51.263016,448.090240 50.581989,443.504608 44.924484,444.121643 
C40.949337,444.555206 36.832344,443.925568 34.420452,448.524994 
C31.413427,445.636230 34.052689,443.470093 34.756538,440.855103 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M25.221647,426.999756 
C20.687138,426.536285 18.713140,429.634613 16.517754,432.783173 
C12.988585,427.888214 17.249369,425.816711 18.973061,422.216644 
C23.410936,425.673004 27.861988,425.275879 32.553841,423.068634 
C35.452259,421.705078 35.699715,425.289398 37.264656,426.472778 
C38.582844,427.469574 39.100288,428.867889 38.371849,430.446655 
C37.767365,431.756805 36.280430,432.300140 35.638813,431.084198 
C33.374748,426.793396 29.380363,427.350189 25.221647,426.999756 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M33.072563,411.511292 
C33.845737,409.408051 34.660934,407.636200 35.374008,406.086334 
C37.352581,405.163574 38.445446,406.443970 39.725285,407.088776 
C41.578053,408.022186 43.541992,408.492462 45.383930,407.281769 
C47.097610,406.155396 48.538479,403.515808 50.829792,405.271912 
C53.043865,406.968842 54.003803,409.668793 53.477982,413.233551 
C46.963856,409.185333 40.696800,408.566528 34.486046,412.988739 
C34.363205,413.076233 33.586334,412.245209 33.072563,411.511292 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M63.568588,460.350586 
C57.356602,457.478882 54.355373,462.448883 49.948071,465.316986 
C48.097961,460.939148 52.370483,458.498199 52.449745,454.210815 
C55.923996,457.675201 59.468071,458.687317 63.385532,457.821381 
C67.623230,456.884583 70.250595,458.858734 72.632217,462.566589 
C68.687309,465.337372 66.768257,460.666901 63.568588,460.350586 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M61.653572,424.345337 
C65.464149,424.134766 69.506905,422.574738 70.811653,428.764679 
C63.737617,427.213623 56.966690,425.366089 50.705284,430.123535 
C48.971275,426.390198 52.042927,424.945374 52.486309,422.490540 
C55.646156,423.140686 58.060677,425.721283 61.653572,424.345337 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M19.815371,409.279022 
C20.964525,411.131439 21.413752,412.604858 19.131323,413.918365 
C15.840510,410.259888 10.890309,410.960388 5.737095,409.453857 
C9.693290,406.812897 14.357866,407.820129 17.233280,404.173431 
C18.191614,406.102722 18.904593,407.538055 19.815371,409.279022 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M32.358055,478.863556 
C34.166172,477.161957 34.974270,475.246246 35.162022,472.777252 
C38.405968,473.364075 41.127762,473.880096 42.487984,477.117218 
C40.278481,479.535828 36.771866,478.803375 34.585995,481.018555 
C33.816540,481.798309 32.631001,480.413330 32.358055,478.863556 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M53.020485,374.392822 
C53.430092,376.429962 53.432095,377.962280 51.001663,376.970490 
C48.560539,375.974396 45.735298,374.990295 46.639191,371.491669 
C47.069439,369.826324 47.818283,368.076508 49.632763,366.781311 
C52.128132,368.601013 51.735859,371.726166 53.020485,374.392822 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M37.526573,460.575195 
C39.693577,463.203705 38.738171,464.985107 36.751728,466.676117 
C30.072634,460.091400 29.867554,459.364807 33.777699,456.348877 
C35.721958,456.972076 35.731846,459.329102 37.526573,460.575195 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M52.119331,359.923889 
C51.468819,361.452118 50.940876,362.953094 49.242676,362.009460 
C48.091560,361.369751 48.100498,359.919373 48.659679,358.919128 
C49.893223,356.712677 51.371899,354.643250 52.876308,352.324066 
C56.946472,355.651001 52.407471,357.324432 52.119331,359.923889 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M18.387033,359.356201 
C15.702724,361.461823 14.929299,360.209412 15.077611,357.797211 
C15.122724,357.063446 15.673514,356.204926 16.249218,355.690826 
C17.621649,354.465210 18.121887,350.806915 20.874222,353.008301 
C23.056000,354.753418 20.793781,356.471008 19.533991,357.927643 
C19.210428,358.301758 18.907942,358.694122 18.387033,359.356201 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M17.294189,389.620911 
C17.964661,388.244812 18.464743,386.999512 19.950981,387.832153 
C21.082693,388.466156 21.247879,389.694275 21.066551,390.868042 
C20.673920,393.409607 18.886772,395.112915 17.314968,397.330078 
C14.570739,394.637146 16.666847,392.285431 17.294189,389.620911 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M20.299824,337.544312 
C20.721291,340.112000 20.034571,341.038879 17.744682,339.771027 
C16.208952,338.920746 14.650395,338.111725 12.858619,337.154175 
C13.510874,335.121277 15.280259,334.432434 16.617510,333.516968 
C18.759222,334.261444 18.952446,336.197632 20.299824,337.544312 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M33.298546,133.367630 
C34.259602,132.028732 34.929516,130.877853 35.848385,129.982468 
C36.450508,129.395752 37.480457,129.455063 38.033913,130.203812 
C38.363674,130.649933 38.610756,131.720383 38.374973,131.932724 
C36.387779,133.722443 36.043625,136.904495 33.434227,138.177460 
C31.310352,136.592621 32.593269,135.116776 33.298546,133.367630 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M20.614168,377.117218 
C19.954599,380.510986 18.453932,379.877808 16.992537,378.089813 
C15.884600,376.734314 13.052963,375.632721 15.378504,373.302887 
C17.223368,371.454620 18.265232,373.388489 19.245592,374.691742 
C19.740299,375.349426 20.122492,376.091766 20.614168,377.117218 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M52.029404,343.410400 
C52.307396,340.582001 49.902802,338.606873 50.408600,335.944763 
C54.024029,337.403595 56.063263,342.075256 54.198761,344.474121 
C53.225468,345.726318 52.542839,344.759460 52.029404,343.410400 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M36.639717,149.078033 
C37.401360,150.424362 37.881924,151.549149 36.545650,152.346069 
C35.463120,152.991669 34.699982,152.079361 34.014782,151.421906 
C31.806259,149.302765 30.632669,147.119690 33.629826,144.720261 
C35.710114,145.545334 35.616581,147.480759 36.639717,149.078033 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M19.231449,145.755249 
C23.354622,149.781158 19.691116,151.425369 17.011530,153.999680 
C14.511600,150.119324 17.464172,148.122574 19.231449,145.755249 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M18.559673,130.726334 
C19.569105,132.298950 21.744213,133.144836 20.540735,135.130920 
C19.749126,136.437302 18.453714,135.993134 17.616255,135.026535 
C16.496161,133.733719 14.039100,133.010666 14.804714,130.814804 
C15.435022,129.007004 17.002916,129.095459 18.559673,130.726334 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M31.718750,392.335693 
C31.158796,390.138611 32.093826,388.840088 33.833122,389.473053 
C36.297363,390.369843 37.567097,392.352966 36.493542,395.208344 
C34.184742,395.430664 33.292095,393.581177 31.718750,392.335693 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M20.711964,284.472839 
C20.603338,287.133118 19.536934,288.778015 17.134457,289.771973 
C14.995257,286.836700 17.207355,284.919678 18.527266,283.135529 
C19.353966,282.018066 20.195724,283.201599 20.711964,284.472839 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M19.027735,238.289886 
C18.400236,238.231094 18.040871,238.176071 17.817524,237.972107 
C16.405306,236.682480 14.541019,235.540146 15.462605,233.175705 
C15.778417,232.365448 16.800104,231.951736 17.485941,232.565460 
C19.142445,234.047791 21.139263,235.552673 19.027735,238.289886 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M68.445564,353.570892 
C69.805687,355.294830 71.660645,356.587250 70.181442,359.224152 
C68.324142,357.871124 65.825020,357.260468 65.601135,354.633240 
C65.477615,353.183716 66.871521,352.962250 68.445564,353.570892 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M67.942825,445.354370 
C67.682610,444.962433 67.568954,444.772186 67.618973,444.647736 
C68.316505,442.911713 68.386093,440.586426 70.939209,440.426239 
C72.027344,440.357971 72.912132,441.332245 72.785034,442.338654 
C72.453362,444.964783 70.449989,445.553375 67.942825,445.354370 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M16.513809,253.506348 
C17.300039,251.301758 17.300507,248.938065 19.753073,247.754440 
C21.679356,249.652420 20.813961,251.343094 19.583897,253.014511 
C18.701611,254.213364 18.557207,254.236877 16.513809,253.506348 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M51.282486,474.193298 
C52.137775,475.842285 53.086365,477.216156 52.399368,478.997467 
C50.327145,479.185669 48.744328,478.470428 48.510296,476.393311 
C48.345913,474.934296 48.867641,473.378784 51.282486,474.193298 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M53.456787,389.275055 
C56.068253,392.860382 52.708290,393.654449 50.852509,396.046936 
C49.897015,392.531891 51.041073,390.656158 53.456787,389.275055 
z"
			/>
			<path
				fill="currentColor"
				opacity="1.000000"
				stroke="none"
				d="
M600.328857,249.969788 
C609.382019,307.694672 568.829224,362.302490 510.403259,364.810730 
C474.751068,366.341278 440.291321,346.219177 422.951508,310.563965 
C400.356781,264.103210 415.841064,207.962753 459.805084,180.823776 
C496.410492,158.227219 541.959167,163.945084 572.250488,194.392456 
C587.511597,209.732178 596.779297,228.182541 600.328857,249.969788 
M539.214050,186.263702 
C512.228943,175.255386 486.160309,177.041641 462.192169,193.736221 
C420.297882,222.916931 412.268738,282.114716 444.628235,321.678345 
C464.570587,346.060486 490.476379,356.717407 521.773376,351.077026 
C560.362366,344.122437 587.988647,310.600769 589.270325,270.042542 
C590.450989,232.679733 574.236328,203.818787 539.214050,186.263702 
z"
			/>
		</svg>
	);
}
