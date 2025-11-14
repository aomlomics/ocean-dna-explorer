import DataDisplay from "@/app/components/DataDisplay";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import Map from "@/app/components/map/Map";
import DropdownLinkBox from "@/app/components/DropdownLinkBox";
import TableMetadata from "@/types/tableMetadata";
import { Sample } from "@/app/generated/prisma/client";
import AssayPhyloPic from "@/app/components/assay/AssayPhyloPic";

export default async function Samp_name({ params }: { params: Promise<{ samp_name: Sample["samp_name"] }> }) {
	let { samp_name } = await params;
	samp_name = decodeURIComponent(samp_name);

	const { sample, analyses, assayData } = await prisma.$transaction(async (tx) => {
		const sample = await tx.sample.findUnique({
			where: {
				samp_name
			},
			include: {
				Occurrences: {
					select: {
						featureid: true
					}
				},
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

		if (!sample) return { sample: null, analyses: [], assayData: [] };

		const occs = await tx.occurrence.findMany({
			where: {
				samp_name
			},
			distinct: ["analysis_run_name"]
		});

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

		return { sample, analyses: occs.map((occ) => occ.analysis_run_name), assayData: assays };
	});

	if (!sample) return <>Sample not found</>;
	const { Occurrences: _, Assays: __, Project: ___, ...justSample } = sample;

	// Build search URL - encode brackets/commas but leave quotes as-is for JSON.parse
	const advancedFilter = JSON.stringify([["sample", "samp_name", "equals", samp_name]]);
	const encodedFilter = advancedFilter.replace(/\[/g, "%5B").replace(/\]/g, "%5D").replace(/,/g, "%2C");
	const taxonomySearchUrl = `/search?table=taxonomy&advanced=${encodedFilter}`;

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
					<h1 className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right" data-tip={TableMetadata.sample.description}>
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
					{/* Square Map */}
					<div className="aspect-square w-full">
						<Map locations={[sample]} />
					</div>

					{/* Assays Section */}
					<div id="assays-section" className="target:animate-flash">
						<h2 className="text-2xl font-semibold text-base-content/90 mb-4">
							Assays used on this Sample ({assayData.length})
						</h2>
						<div className="space-y-2">
							{assayData.map((assay) => (
								<div key={assay.assay_name} className="flex items-center gap-4 p-4 rounded-lg">
									<div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center shadow-sm overflow-hidden">
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
						<SampleStatCard title="Occurrences" value={sample.Occurrences.length} icon="eye" />
						<DropdownLinkBoxWithIcon
							title="Total Analyses"
							count={analyses.length}
							content={analyses}
							linkPrefix="/explore/analysis"
							icon="analysis"
						/>
						<AssayDropdownCard count={sample.Assays.length} assayNames={sample.Assays.map((a) => a.assay_name)} />
						<SampleStatCard
							title="Location"
							latitude={sample.decimalLatitude}
							longitude={sample.decimalLongitude}
							icon="location"
						/>
						<Link href={taxonomySearchUrl} className="group">
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
							<DataDisplay
								table="sample"
								data={justSample}
								omit={["project_id", "analysis_run_name", "assay_name"]}
								priorityFields={[
									"samp_name",
									"eventDate",
									"decimalLatitude",
									"decimalLongitude",
									"minimumDepthInMeters",
									"maximumDepthInMeters",
									"tot_depth_water_col",
									"geo_loc_name",
									"env_broad_scale",
									"env_local_scale",
									"env_medium",
									"samp_category",
									"neg_cont_type",
									"pos_cont_type",
									"expedition_id",
									"line_id",
									"station_id",
									"serial_number"
								]}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type StatIconType = "location" | "eye" | "analysis" | "fish";

function SampleStatCard({
	title,
	value,
	latitude,
	longitude,
	icon
}: {
	title: string;
	value?: number;
	latitude?: number | null;
	longitude?: number | null;
	icon?: StatIconType;
}) {
	// Use horizontal layout for eye icon
	if (icon === "eye" && value !== undefined) {
		return (
			<div className="bg-base-200 p-4 rounded-lg flex items-center gap-4">
				<div className="w-16 h-16 flex-shrink-0 flex items-center justify-center text-primary">
					<StatIcon icon={icon} />
				</div>
				<div className="flex flex-col">
					<div className="text-3xl font-bold text-primary">{value.toLocaleString()}</div>
					<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
				</div>
			</div>
		);
	}

	// Vertical centered layout for other cards
	const content = (
		<div className="bg-base-200 p-4 rounded-lg flex flex-col items-center text-center">
			{icon && icon !== "eye" && (
				<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
					<StatIcon icon={icon} />
				</div>
			)}
			{value !== undefined && <div className="text-3xl font-bold text-primary mb-1">{value.toLocaleString()}</div>}
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
		</div>
	);

	return content;
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

function DropdownLinkBoxWithIcon({
	title,
	count,
	content,
	linkPrefix,
	icon
}: {
	title: string;
	count: number;
	content: string[];
	linkPrefix: string;
	icon: StatIconType;
}) {
	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg">
			<div
				tabIndex={0}
				role="button"
				className="focus:bg-base-300 rounded-lg w-full p-4 flex items-center gap-4 justify-between"
			>
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-primary">
						<StatIcon icon={icon} />
					</div>
					<div>
						<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">{title}</div>
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
			<ul
				tabIndex={0}
				className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-[1] p-2 shadow"
			>
				{content.map((str) => (
					<li key={str}>
						<Link href={`${linkPrefix}/${str}`} className="text-base-content hover:text-primary break-all">
							{str}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

function AssayDropdownCard({ count, assayNames }: { count: number; assayNames: string[] }) {
	return (
		<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg">
			<a
				href="#assays-section"
				tabIndex={0}
				role="button"
				className="focus:bg-base-300 rounded-lg w-full p-4 flex justify-between items-center"
			>
				<div>
					<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">
						Total Assays
					</div>
					<div className="text-2xl font-bold text-primary">{count}</div>
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
			</a>
			<ul
				tabIndex={0}
				className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-[1] p-2 shadow"
			>
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
