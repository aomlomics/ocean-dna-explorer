import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { TaxonomicRanks } from "@/types/objects";
import PhyloPic from "@/app/components/images/PhyloPic";
import CopyButton from "@/app/components/CopyButton";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";
import { Suspense } from "react";

function formatTaxonomyDisplay(dbTaxonomy: any) {
	const taxonomicData = Object.entries(dbTaxonomy)
		.filter(([key, value]) => {
			return TaxonomicRanks.includes(key as (typeof TaxonomicRanks)[0]) && value;
		})
		.map(([key, value]) => ({
			rank: key.charAt(0).toUpperCase() + key.slice(1),
			name: String(value).replace("_", " "),
			rankKey: key
		}));

	return taxonomicData;
}

export default async function TaxonomyPage({ params }: { params: Promise<{ taxonomy: Taxonomy["taxonomy"] }> }) {
	let { taxonomy } = await params;
	taxonomy = decodeURIComponent(taxonomy);

	const dbTaxonomy = await prisma.taxonomy.findUnique({
		where: {
			taxonomy
		},
		include: {
			Assignments: {
				distinct: ["analysis_run_name"],
				select: {
					analysis_run_name: true,
					Analysis: {
						select: {
							project_id: true
						}
					}
				}
			}
		}
	});

	if (!dbTaxonomy) return <>Taxonomy not found</>;

	async function getSamples() {
		return await prisma.sample.findMany({
			where: {
				Libraries: {
					some: {
						Occurrences: {
							some: {
								Feature: {
									Assignments: {
										some: {
											taxonomy
										}
									}
								}
							}
						}
					}
				}
			}
		});
	}

	async function Subtitle({ fallback }: { fallback?: true }) {
		let samples;
		if (!fallback) {
			samples = await getSamples();
		}

		return (
			<p className="text-lg text-base-content/70">
				Found in {fallback ? "... samples" : samples!.length === 1 ? "1 sample" : `${samples!.length} samples`} across{" "}
				{uniqueProjects.length === 1 ? "1 project" : `${uniqueProjects.length} projects`}
			</p>
		);
	}

	async function SampleCard({ fallback }: { fallback?: true }) {
		let samples;
		if (!fallback) {
			samples = await getSamples();
		}

		return (
			<Link
				href={`/search?table=sample&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}
				className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors"
			>
				<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
					<svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
					</svg>
				</div>
				<div className="text-center mb-1">
					<div className="text-3xl font-bold text-primary">{fallback ? "..." : samples!.length}</div>
					<div className="text-sm font-medium text-base-content/70 uppercase">Samples</div>
				</div>
			</Link>
		);
	}

	// Get unique project IDs for display
	const uniqueProjects = [...new Set(dbTaxonomy.Assignments.map((a) => a.Analysis.project_id))];

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex gap-2 items-center">
					<h1
						className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right before:bg-base-100 before:text-base-content before:border before:border-base-300"
						data-tip={TableMetadata.taxonomy.description}
					>
						{dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ")}
					</h1>
				</div>
				<Suspense fallback={<Subtitle fallback />}>
					<Subtitle />
				</Suspense>
			</header>

			{/* Main Grid Layout: Map + Taxonomic Section Side by Side */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Left: Map */}
				<div className="lg:col-span-2 space-y-4">
					<Map query={getSamples} where={{ taxonomy }} cluster className="h-105 w-full rounded-lg" />

					{/* Cards Below Map */}
					<div className="grid grid-cols-3 gap-3">
						{/* Analyses Card */}
						<Link href={`/search?table=analysis&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<svg viewBox="0 0 1024 1024" fill="currentColor" className="w-14 h-14">
										<path d="M878.3 152.9H145.7c-38.6 0-70 31.4-70 70V706c0 38.6 31.4 70 70 70h732.6c38.6 0 70-31.4 70-70V222.9c0-38.6-31.4-70-70-70z m30 531V706c0 16.5-13.5 30-30 30H145.7c-16.5 0-30-13.5-30-30V222.9c0-16.5 13.5-30 30-30h732.6c16.5 0 30 13.5 30 30v461zM678 871.1H346c-11 0-20-9-20-20s9-20 20-20h332c11 0 20 9 20 20s-9 20-20 20z" />
										<path d="M127.1 662.7c-2.7 0-5.4-1.1-7.3-3.2-3.7-4.1-3.5-10.4 0.6-14.1l236.5-219.6L463 541.9l258.9-290.7 183.7 196.3c3.8 4 3.6 10.4-0.4 14.1-4 3.8-10.3 3.6-14.1-0.4L722.3 280.8l-259 290.9L355.7 454 133.9 660c-2 1.8-4.4 2.7-6.8 2.7z" />
										<path d="M208.9 541.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
										<path d="M633.4 329.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
										<path d="M748.7 539.6a16.9 17 0 1 0 33.8 0 16.9 17 0 1 0-33.8 0Z" />
									</svg>
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{dbTaxonomy.Assignments.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Analyses</div>
								</div>
							</div>
						</Link>

						{/* Projects Card */}
						<Link href={`/search?table=project&advanced=[["taxonomy", "taxonomy", "contains", "${taxonomy}"]]`}>
							<div className="w-full bg-base-200 hover:bg-base-300 p-2 rounded-lg transition-colors">
								<div className="w-20 h-20 flex items-center justify-center text-primary mx-auto">
									<svg viewBox="0 0 424 169" fill="currentColor" className="w-18 h-18">
										<path d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13 M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0z M419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83 419.95 111.83 419.95 111.83 M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36ZM116.02,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM125.68,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM135.34,74.02c-.13,2.03-1.88,3.56-3.9,3.43-1.84-.12-3.31-1.59-3.43-3.43v-4.66c.13-2.03,1.88-3.56,3.9-3.43,1.84.12,3.31,1.59,3.43,3.43v4.66Z M136.09,46.99l25.5,2.58s-1.23-.62-1.23-3.07,1.23-2.46,1.23-2.46l-25.5-2.58c-.79.79-1.23,1.88-1.21,3-.04.99.41,1.94,1.21,2.53h0Z M183.72,47.2l-25.24,3.24s1.21-.78,1.21-3.87-1.21-3.07-1.21-3.07l25.24-3.25c.81,1.07,1.23,2.37,1.21,3.7.1,1.21-.35,2.4-1.21,3.25h0Z M148.67,26.17l19.32,2.52s-.93-.6-.93-3,.93-2.35.93-2.35l-19.32-2.46c-.61.81-.94,1.8-.91,2.82-.08.92.26,1.83.91,2.47h0Z M185.01,26.56l-19.27,2.47s.93-.58.93-3-.93-2.37-.93-2.37l19.27-2.47c.62.81.95,1.81.93,2.83.1.94-.25,1.88-.93,2.53h0Z M162.42,7.33l9.24,1.86s-.43-.44-.43-2.13.43-1.68.43-1.68l-9.24-1.78c-.32.63-.47,1.32-.45,2.02-.04.6.12,1.2.45,1.71h0Z M178.86,7.37l-7.99,1.81s.37-.42.37-2.11-.37-1.69-.37-1.69l7.99-1.77c.28.64.41,1.33.39,2.02.04.61-.09,1.21-.39,1.74h0Z M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z" />
									</svg>
								</div>
								<div className="text-center mb-1">
									<div className="text-3xl font-bold text-primary">{uniqueProjects.length}</div>
									<div className="text-sm font-medium text-base-content/70 uppercase">Projects</div>
								</div>
							</div>
						</Link>

						{/* Samples Card */}
						<Suspense fallback={<SampleCard fallback />}>
							<SampleCard />
						</Suspense>
					</div>
				</div>

				{/* Right: Taxonomic Image + Rankings Grid (3 columns in remaining space) */}
				<div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
					{/* Left & Center: Taxonomic Image (spans 2 columns) */}
					<div className="md:col-span-2 bg-base-200 rounded-lg p-6 flex flex-col items-center">
						<div className="w-full max-w-xs aspect-square flex items-center justify-center mb-28 relative">
							<PhyloPic taxonomy={dbTaxonomy} />
						</div>
						<h4 className="text-sm font-semibold text-base-content/80 mb-2">Taxonomic Image Attribution</h4>
						<p className="text-xs text-base-content/60 leading-relaxed text-center">
							The taxonomic outline image is sourced through{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							, using{" "}
							<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
								GBIF
							</Link>{" "}
							Suggest API to match our taxonomy with PhyloPic's database.
						</p>
					</div>

					{/* Right: Taxonomic Rankings */}
					<div className="bg-base-200 rounded-lg p-6 flex flex-col">
						<h3 className="text-md font-semibold text-base-content/80">Taxonomic Hierarchy</h3>
						<div className="mb-2">
							<CopyButton taxonomy={taxonomy} />
						</div>
						<p className="text-xs text-base-content/60 text-left mb-4">Click each rank to explore related taxa!</p>
						<div className="space-y-4 flex-1">
							{formatTaxonomyDisplay(dbTaxonomy).map((item) => {
								const isSpecies = item.rankKey === "species";
								const rankSearchUrl = `/explore/taxonomy?${item.rankKey}=${encodeURIComponent(
									item.name.replace(" ", "_")
								)}`;

								if (isSpecies) {
									return (
										<div key={item.rank} className="text-left rounded px-3 py-2 mb-3">
											<div className="text-[10px] font-medium text-base-content/50 uppercase tracking-widest">
												{item.rank}
											</div>
											<div className="text-sm font-semibold text-base-content/80">{item.name}</div>
										</div>
									);
								}

								return (
									<Link key={item.rank} href={rankSearchUrl}>
										<div className="text-left cursor-pointer bg-base-300/30 hover:bg-base-300/60 transition-colors rounded px-3 py-2 mb-3">
											<div className="text-[10px] font-medium text-base-content/50 uppercase tracking-widest">
												{item.rank}
											</div>
											<div className="text-sm font-semibold text-primary hover:text-primary-focus transition-colors">
												{item.name}
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
