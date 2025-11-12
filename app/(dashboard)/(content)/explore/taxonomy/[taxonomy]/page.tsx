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
		<div className="bg-base-200 rounded-lg overflow-hidden">
			{taxonomicData.map((item, index) => (
				<div key={item.rank} className={`flex items-center p-3 ${index % 2 === 0 ? "bg-base-300" : ""}`}>
					<span className="text-base-content/50 w-28 font-medium">{item.rank}</span>
					<span className="font-medium text-base-content">{item.name}</span>
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

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full">
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
			
			{/* Using sm breakpoint (640px) instead of md (768px) */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-12 sm:gap-8">
				{/* Image section with centered content */}
				<div className="col-span-1 sm:col-span-3 bg-base-300 rounded-xl overflow-hidden flex flex-col justify-center">
					<div className="aspect-square p-6 flex items-center justify-center">
						<PhyloPic taxonomy={dbTaxonomy} />
					</div>
					<div className="py-3 px-4 text-center">
						<div className="text-base-content/80 text-sm mt-1">{samples.length} occurrences found in the Ocean DNA Explorer</div>
					</div>
				</div>

				{/* Taxonomy section */}
				<div className="col-span-1 sm:col-span-3 bg-base-300 rounded-xl p-4 sm:p-6 overflow-x-auto">
					{formatTaxonomyDisplay(dbTaxonomy)}
				</div>

				{/* Map section */}
				<div className="col-span-1 sm:col-span-6 flex flex-col">
					<h2 className="text-xl font-medium text-base-content/90 mb-4">Which Samples was this Taxon found?</h2>
					<div className="w-full flex-1">
						<Map locations={samples} cluster />
					</div>
				</div>
			</div>

			<div className="dropdown dropdown-hover bg-base-300 hover:bg-base-300/80 rounded-xl">
				<div tabIndex={0} role="button" className="w-full p-6 flex justify-between items-center">
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
					className="dropdown-content menu bg-base-300 rounded-b-box rounded-t-none w-full z-[1] p-2 shadow"
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

			{/* Attribution Section */}
			<div className="bg-base-300 rounded-xl p-4 sm:p-6">
				<h2 className="text-base-content font-medium mb-4">Image Attribution</h2>
				<p className="text-base-content/80 text-sm sm:text-base">
					The taxonomic outline image is sourced through{" "}
					<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
						PhyloPic
					</Link>
					, using{" "}
					<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
						GBIF
					</Link>{" "}
					Suggest API to match our taxonomy with PhyloPic's database. Images on PhyloPic are contributed by scientists
					and artists worldwide under various Creative Commons licenses.
				</p>
			</div>
		</div>
	);
}
