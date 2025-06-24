import { prisma } from "@/app/helpers/prisma";
import PhyloPic from "@/app/components/PhyloPic";
import Map from "@/app/components/map/Map";
import Link from "next/link";
import { TaxonomicRanks } from "@/types/objects";
import { Taxonomy } from "@/prisma/generated/zod";

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

export default async function TaxonomyPage({ params }: { params: Promise<{ taxonomy: string }> }) {
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
						analysis_run_name: true
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
				decimalLatitude: true,
				decimalLongitude: true
			}
		});

		return { dbTaxonomy, samples };
	});

	if (!dbTaxonomy || !samples.length) return <>Taxonomy not found</>;

	// Get the lowest rank name (species or genus typically)
	const displayName = dbTaxonomy.species || dbTaxonomy.genus || taxonomy.split(";").pop()?.replace("_", " ");

	return (
		<div className="container mx-auto py-6 space-y-6 max-w-full">
			<header className="flex gap-2 items-center">
				<h1 className="text-4xl font-semibold text-primary mb-2">{displayName}</h1>
				{dbTaxonomy.isPrivate && <div className="badge badge-ghost p-3">Private</div>}
			</header>
			{/* Using sm breakpoint (640px) instead of md (768px) */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-12 sm:gap-8">
				{/* Image section with centered content */}
				<div className="col-span-1 sm:col-span-3 bg-base-300 rounded-xl overflow-hidden flex flex-col justify-center">
					<div className="aspect-square p-6 flex items-center justify-center">
						<PhyloPic taxonomy={dbTaxonomy} />
					</div>
					<div className="py-3 px-4 text-center">
						<div className="text-base-content/80 text-sm mt-1">{samples.length} occurrences found in NODE</div>
					</div>
				</div>

				{/* Taxonomy section */}
				<div className="col-span-1 sm:col-span-3 bg-base-300 rounded-xl p-4 sm:p-6 overflow-x-auto">
					{formatTaxonomyDisplay(dbTaxonomy)}
				</div>

				{/* Map section */}
				<div className="col-span-1 sm:col-span-6 bg-base-300 rounded-xl overflow-hidden">
					<div className="p-4 border-b border-base-content/10">
						<h2 className="text-base-content/80 font-medium">Which Samples was this Taxon found?</h2>
					</div>
					<div className="w-full aspect-5/2">
						<Map locations={samples} id="samp_name" table="sample" cluster />
					</div>
				</div>
			</div>

			<div className="dropdown dropdown-hover bg-base-200 hover:bg-base-300">
				<div tabIndex={0} role="button" className="stat focus:bg-base-300 w-full p-6 flex justify-between items-center">
					<div>
						<div className="text-lg font-medium text-base-content/70">Total Analyses</div>
						<div className="text-2xl font-medium mt-1">{dbTaxonomy.Assignments.length}</div>
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
