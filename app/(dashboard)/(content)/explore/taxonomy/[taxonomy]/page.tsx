import { prisma } from "@/app/helpers/prisma";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { TaxonomicRanks } from "@/types/objects";
import PhyloPic from "@/app/components/images/PhyloPic";
import TableMetadata from "@/types/tableMetadata";
import { Taxonomy } from "@/app/generated/prisma/client";

function formatTaxonomyDisplay(dbTaxonomy: any) {
	const taxonomicData = Object.entries(dbTaxonomy)
		.filter(([key, value]) => {
			return TaxonomicRanks.includes(key as keyof Taxonomy) && value;
		})
		.map(([key, value]) => ({
			rank: key.charAt(0).toUpperCase() + key.slice(1),
			name: String(value).replace("_", " ")
		}));

	return (
		<div className="space-y-1.5">
			{taxonomicData.map((item, index) => (
				<div key={item.rank} className="text-center py-1.5">
					<span className="text-primary font-semibold text-sm">{item.rank}: </span>
					<span className="text-base-content font-medium text-sm">{item.name}</span>
				</div>
			))}
		</div>
	);
}

export default async function TaxonomyPage({ params }: { params: Promise<{ taxonomy: Taxonomy["taxonomy"] }> }) {
	let { taxonomy } = await params;
	taxonomy = decodeURIComponent(taxonomy);

	const { dbTaxonomy, samples } = await prisma.$transaction(async (tx) => {
		const dbTaxonomy = await tx.taxonomy.findUnique({
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
								isPrivate: true
							}
						}
					}
				}
			}
		});
		const occurrences = await tx.occurrence.findMany({
			where: {
				Feature: {
					is: {
						Assignments: {
							every: {
								taxonomy
							}
						}
					}
				}
			},
			distinct: ["samp_name"],
			select: {
				samp_name: true
			}
		});

		const samples = await tx.sample.findMany({
			where: {
				samp_name: {
					in: occurrences.map((occ) => occ.samp_name)
				}
			},
			select: {
				samp_name: true,
				project_id: true,
				decimalLatitude: true,
				decimalLongitude: true
			}
		});

		return { dbTaxonomy, samples };
	});

	if (!dbTaxonomy || !samples.length) return <>Taxonomy not found</>;

	// Get the lowest rank name (species or genus typically)
	const displayName = dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ");
	const isPrivate = dbTaxonomy.Assignments.some((a) => a.Analysis.isPrivate);

	// Get unique project IDs for display
	const uniqueProjects = [...new Set(samples.map(s => s.project_id))];
	const samplesText = samples.length === 1 ? '1 sample' : `${samples.length} samples`;
	const projectsText = uniqueProjects.length === 1 ? '1 project' : `${uniqueProjects.length} projects`;

	// Build search URLs for project and sample boxes (unencoded like project page does it)
	const projectSearchUrl = `/search?table=project&advanced=[["taxonomy","equals","${taxonomy}"]]`;
	const sampleSearchUrl = `/search?table=sample&advanced=[["taxonomy","equals","${taxonomy}"]]`;

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right" data-tip={TableMetadata.taxonomy.description}>
						{displayName}
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
				<p className="text-lg text-base-content/70">
					Found in {samplesText} across {projectsText}
				</p>
			</header>
			
			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Column: Map + Bottom Cards */}
				<div className="space-y-6">
					{/* Map */}
					<div className="w-full h-[350px]">
						<Map locations={samples} cluster />
					</div>

					{/* Cards Below Map */}
					<div className="grid grid-cols-3 gap-4">
						{/* Analysis Dropdown */}
						<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300 rounded-lg transition-colors">
							<div tabIndex={0} role="button" className="w-full p-4 flex justify-between items-center">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 flex items-center justify-center text-primary">
										<svg viewBox="0 0 1024 1024" fill="currentColor" className="w-10 h-10">
											<path d="M878.3 152.9H145.7c-38.6 0-70 31.4-70 70V706c0 38.6 31.4 70 70 70h732.6c38.6 0 70-31.4 70-70V222.9c0-38.6-31.4-70-70-70z m30 531V706c0 16.5-13.5 30-30 30H145.7c-16.5 0-30-13.5-30-30V222.9c0-16.5 13.5-30 30-30h732.6c16.5 0 30 13.5 30 30v461zM678 871.1H346c-11 0-20-9-20-20s9-20 20-20h332c11 0 20 9 20 20s-9 20-20 20z" />
											<path d="M127.1 662.7c-2.7 0-5.4-1.1-7.3-3.2-3.7-4.1-3.5-10.4 0.6-14.1l236.5-219.6L463 541.9l258.9-290.7 183.7 196.3c3.8 4 3.6 10.4-0.4 14.1-4 3.8-10.3 3.6-14.1-0.4L722.3 280.8l-259 290.9L355.7 454 133.9 660c-2 1.8-4.4 2.7-6.8 2.7z" />
											<path d="M208.9 541.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
											<path d="M633.4 329.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
											<path d="M748.7 539.6a16.9 17 0 1 0 33.8 0 16.9 17 0 1 0-33.8 0Z" />
										</svg>
									</div>
									<div>
										<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider">Total Analyses</div>
										<div className="text-2xl font-bold text-primary mt-1">{dbTaxonomy.Assignments.length}</div>
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
								className="dropdown-content menu bg-base-200 rounded-b-lg rounded-t-none w-full z-[1] p-2 shadow-lg"
							>
								{dbTaxonomy.Assignments.map((assign) => (
									<li key={assign.analysis_run_name}>
										<Link
											href={`/explore/analysis/${assign.analysis_run_name}`}
											className="text-base-content hover:text-primary break-all"
										>
											{assign.analysis_run_name}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Projects Box */}
						<Link
							href={projectSearchUrl}
							className="bg-base-200 hover:bg-base-300 p-4 rounded-lg flex flex-col items-center text-center transition-colors"
						>
							<div className="w-12 h-12 mb-2 flex items-center justify-center text-primary">
								<svg viewBox="0 0 424 169" fill="currentColor" className="w-10 h-10">
									<path d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13 M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0z M419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83 419.95 111.83 419.95 111.83 M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36ZM116.02,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM125.68,74.02c0,2.02-1.64,3.66-3.66,3.66s-3.66-1.64-3.66-3.66v-4.66c0-2.02,1.64-3.66,3.66-3.66s3.66,1.64,3.66,3.66v4.66ZM135.34,74.02c-.13,2.03-1.88,3.56-3.9,3.43-1.84-.12-3.31-1.59-3.43-3.43v-4.66c.13-2.03,1.88-3.56,3.9-3.43,1.84.12,3.31,1.59,3.43,3.43v4.66Z M136.09,46.99l25.5,2.58s-1.23-.62-1.23-3.07,1.23-2.46,1.23-2.46l-25.5-2.58c-.79.79-1.23,1.88-1.21,3-.04.99.41,1.94,1.21,2.53h0Z M183.72,47.2l-25.24,3.24s1.21-.78,1.21-3.87-1.21-3.07-1.21-3.07l25.24-3.25c.81,1.07,1.23,2.37,1.21,3.7.1,1.21-.35,2.4-1.21,3.25h0Z M148.67,26.17l19.32,2.52s-.93-.6-.93-3,.93-2.35.93-2.35l-19.32-2.46c-.61.81-.94,1.8-.91,2.82-.08.92.26,1.83.91,2.47h0Z M185.01,26.56l-19.27,2.47s.93-.58.93-3-.93-2.37-.93-2.37l19.27-2.47c.62.81.95,1.81.93,2.83.1.94-.25,1.88-.93,2.53h0Z M162.42,7.33l9.24,1.86s-.43-.44-.43-2.13.43-1.68.43-1.68l-9.24-1.78c-.32.63-.47,1.32-.45,2.02-.04.6.12,1.2.45,1.71h0Z M178.86,7.37l-7.99,1.81s.37-.42.37-2.11-.37-1.69-.37-1.69l7.99-1.77c.28.64.41,1.33.39,2.02.04.61-.09,1.21-.39,1.74h0Z M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z" />
								</svg>
							</div>
							<div className="flex-1 flex flex-col ml-4">
								<div className="text-3xl font-bold text-primary">{uniqueProjects.length}</div>
								<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">Projects</div>
							</div>
						</Link>

						{/* Samples Box */}
						<Link
							href={sampleSearchUrl}
							className="bg-base-200 hover:bg-base-300 p-4 rounded-lg flex items-center text-center transition-colors"
						>
							<div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-primary">
								<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
									<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
								</svg>
							</div>
							<div className="flex-1 flex flex-col ml-4">
								<div className="text-3xl font-bold text-primary">{samples.length}</div>
								<div className="text-sm font-sans font-medium text-base-content/70 uppercase tracking-wider mt-2">Samples</div>
							</div>
						</Link>
					</div>
			</div>

				{/* Right Column: Taxonomy Image + Ranking */}
				<div className="bg-base-200 rounded-xl p-6 flex flex-col">
					{/* Taxonomy Image - Large and Prominent */}
					<div className="flex items-center justify-center mb-6">
						<div className="w-64 h-64 relative">
							<PhyloPic taxonomy={dbTaxonomy} />
						</div>
					</div>

					{/* Occurrences Count */}
					<div className="text-center pb-4 mb-4 border-b border-base-content/10">
						<div className="text-3xl font-bold text-primary">{samples.length}</div>
						<div className="text-base-content/70 text-sm mt-1">occurrences found</div>
					</div>

					{/* Taxonomic Ranking */}
					<div className="mb-6">
						<h3 className="text-lg font-semibold text-base-content mb-3 text-center">Taxonomic Ranking</h3>
						{formatTaxonomyDisplay(dbTaxonomy)}
					</div>

					{/* Image Attribution */}
					<div className="pt-4 mt-auto border-t border-base-content/10">
						<h4 className="text-sm font-semibold text-base-content mb-2">Taxonomic Image Attribution</h4>
						<p className="text-base-content/70 text-xs leading-relaxed">
							The taxonomic outline image is sourced through{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							, using{" "}
							<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
								GBIF
							</Link>
							{" "}Suggest API to match our taxonomy with PhyloPic's database. Images on PhyloPic are contributed by scientists and artists worldwide under various Creative Commons licenses.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
