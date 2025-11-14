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
		<div className="space-y-2">
			{taxonomicData.map((item, index) => (
				<div key={item.rank} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-base-200/30 transition-colors">
					<span className="text-primary font-semibold text-sm min-w-[90px]">{item.rank}</span>
					<span className="text-base-content font-medium">{item.name}</span>
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

	// Build search URLs for project and sample boxes
	const taxonomyEncoded = encodeURIComponent(JSON.stringify([["taxonomy", "equals", taxonomy]]));
	const projectSearchUrl = `/search?table=project&advanced=${taxonomyEncoded}`;
	const sampleSearchUrl = `/search?table=sample&advanced=${taxonomyEncoded}`;

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full pb-8">
			<header>
				<div className="flex gap-2 items-center">
					<h1 className="text-4xl font-semibold text-primary mb-2 tooltip tooltip-right" data-tip={TableMetadata.taxonomy.description}>
						{displayName}
					</h1>
					{isPrivate && <div className="badge badge-ghost p-3">Private</div>}
				</div>
			</header>
			
			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left: Map (takes 5 columns on large screens) */}
				<div className="lg:col-span-5 flex flex-col">
					<h3 className="text-base font-medium text-base-content/80 mb-3">Samples featuring this taxonomy:</h3>
					<div className="w-full flex-1 min-h-[400px]">
						<Map locations={samples} cluster />
					</div>
				</div>

				{/* Middle: Occurrences (takes 3 columns) */}
				<div className="lg:col-span-3 flex flex-col gap-4">
					<div className="bg-base-100 border border-primary/20 rounded-xl overflow-hidden flex flex-col justify-center p-6">
						<div className="aspect-square flex items-center justify-center">
							<PhyloPic taxonomy={dbTaxonomy} />
						</div>
						<div className="py-3 text-center border-t border-base-content/10 mt-4">
							<div className="text-2xl font-bold text-primary">{samples.length}</div>
							<div className="text-base-content/70 text-sm mt-1">occurrences found</div>
						</div>
					</div>

					{/* Image Attribution Box */}
					<div className="bg-base-100 border border-base-content/10 rounded-lg p-4">
						<h4 className="text-sm font-semibold text-base-content mb-2">Image Attribution</h4>
						<p className="text-base-content/70 text-xs leading-relaxed">
							Taxonomic outline image from{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							, matched via{" "}
							<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
								GBIF
							</Link>
							.
						</p>
					</div>
				</div>

				{/* Right: Taxonomic Ranking (takes 4 columns) */}
				<div className="lg:col-span-4 bg-base-100 border border-base-content/10 rounded-xl p-6">
					<h3 className="text-lg font-semibold text-base-content mb-4">Taxonomic Ranking</h3>
					{formatTaxonomyDisplay(dbTaxonomy)}
					<p className="text-sm text-base-content/60 mt-4">
						Found in {samplesText} across {projectsText}
					</p>
				</div>
			</div>

			{/* Bottom Row: Analysis Dropdown, Projects, Samples */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Analysis Dropdown */}
				<div className="dropdown dropdown-hover bg-base-100 hover:bg-base-200/50 border border-base-content/10 rounded-xl transition-colors">
					<div tabIndex={0} role="button" className="w-full p-4 flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 flex items-center justify-center text-primary">
								<svg viewBox="0 0 1024 1024" fill="currentColor" className="w-8 h-8">
									<path d="M878.3 152.9H145.7c-38.6 0-70 31.4-70 70V706c0 38.6 31.4 70 70 70h732.6c38.6 0 70-31.4 70-70V222.9c0-38.6-31.4-70-70-70z m30 531V706c0 16.5-13.5 30-30 30H145.7c-16.5 0-30-13.5-30-30V222.9c0-16.5 13.5-30 30-30h732.6c16.5 0 30 13.5 30 30v461zM678 871.1H346c-11 0-20-9-20-20s9-20 20-20h332c11 0 20 9 20 20s-9 20-20 20z" />
									<path d="M127.1 662.7c-2.7 0-5.4-1.1-7.3-3.2-3.7-4.1-3.5-10.4 0.6-14.1l236.5-219.6L463 541.9l258.9-290.7 183.7 196.3c3.8 4 3.6 10.4-0.4 14.1-4 3.8-10.3 3.6-14.1-0.4L722.3 280.8l-259 290.9L355.7 454 133.9 660c-2 1.8-4.4 2.7-6.8 2.7z" />
									<path d="M208.9 541.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
									<path d="M633.4 329.9a30.2 30.3 0 1 0 60.4 0 30.2 30.3 0 1 0-60.4 0Z" />
									<path d="M748.7 539.6a16.9 17 0 1 0 33.8 0 16.9 17 0 1 0-33.8 0Z" />
								</svg>
							</div>
							<div>
								<div className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Analyses</div>
								<div className="text-xl font-bold text-primary">{dbTaxonomy.Assignments.length}</div>
							</div>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-base-content/50"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</div>
					<ul
						tabIndex={0}
						className="dropdown-content menu bg-base-100 border border-base-content/10 rounded-b-lg rounded-t-none w-full z-[1] p-2 shadow-lg"
					>
						{dbTaxonomy.Assignments.map((assign) => (
							<li key={assign.analysis_run_name}>
								<Link
									href={`/explore/analysis/${assign.analysis_run_name}`}
									className="text-base-content hover:text-primary break-all text-sm"
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
					className="bg-base-100 hover:bg-base-200/50 border border-base-content/10 rounded-xl p-4 flex items-center gap-3 transition-colors group"
				>
					<div className="w-10 h-10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
						<svg viewBox="0 0 48 48" fill="currentColor" className="w-8 h-8">
							<path d="M38.914 11.086c-1.55-1.55-4.064-1.55-5.614 0L25 19.386V10h-2v12.586l-8.3-8.3c-1.55-1.55-4.064-1.55-5.614 0-1.55 1.55-1.55 4.064 0 5.614l13.2 13.2c.75.75 1.768 1.172 2.828 1.172s2.078-.422 2.828-1.172l13.2-13.2c1.55-1.55 1.55-4.064 0-5.614z" />
							<path d="M44 32v10H4V32H2v10c0 1.1.9 2 2 2h40c1.1 0 2-.9 2-2V32h-2z" />
						</svg>
					</div>
					<div>
						<div className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Projects</div>
						<div className="text-xl font-bold text-primary group-hover:underline">{uniqueProjects.length}</div>
					</div>
				</Link>

				{/* Samples Box */}
				<Link
					href={sampleSearchUrl}
					className="bg-base-100 hover:bg-base-200/50 border border-base-content/10 rounded-xl p-4 flex items-center gap-3 transition-colors group"
				>
					<div className="w-10 h-10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
						<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
						</svg>
					</div>
					<div>
						<div className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Samples</div>
						<div className="text-xl font-bold text-primary group-hover:underline">{samples.length}</div>
					</div>
				</Link>
			</div>
		</div>
	);
}
