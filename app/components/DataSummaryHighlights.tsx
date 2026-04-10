import Link from "next/link";
import { publicPrisma } from "@/app/helpers/prisma";
import DataSummaryCreatureCarousel, { type FeaturedCreature } from "./DataSummaryCreatureCarousel";

const featuredCreatures: FeaturedCreature[] = [
	{
		id: "mobula-birostris",
		rank: "Species",
		taxonomyName: "Mobula birostris",
		commonName: "Giant Oceanic Manta Ray",
		description:
			"A wide-ranging plankton filter feeder often linked to productive ocean fronts and aggregation events.",
		taxonomyHref: "/explore/taxonomy/Mobula%20birostris"
	},
	{
		id: "physeter-macrocephalus",
		rank: "Species",
		taxonomyName: "Physeter macrocephalus",
		commonName: "Sperm Whale",
		description:
			"A deep-diving apex predator whose eDNA signatures help indicate offshore ecosystem structure.",
		taxonomyHref: "/explore/taxonomy/Physeter%20macrocephalus"
	},
	{
		id: "scomber-scombrus",
		rank: "Species",
		taxonomyName: "Scomber scombrus",
		commonName: "Atlantic Mackerel",
		description:
			"A schooling pelagic fish frequently observed in broad transects with strong seasonal movement patterns.",
		taxonomyHref: "/explore/taxonomy/Scomber%20scombrus"
	},
	{
		id: "euphausiacea",
		rank: "Order",
		taxonomyName: "Euphausiacea",
		commonName: "Krill",
		description:
			"Key zooplankton grazers that transfer energy from phytoplankton to fish, seabirds, and marine mammals.",
		taxonomyHref: "/explore/taxonomy/Euphausiacea"
	},
	{
		id: "thunnus-albacares",
		rank: "Species",
		taxonomyName: "Thunnus albacares",
		commonName: "Yellowfin Tuna",
		description:
			"A highly migratory predator often used as an indicator taxon for dynamic open-ocean food webs.",
		taxonomyHref: "/explore/taxonomy/Thunnus%20albacares"
	},
	{
		id: "octopoda",
		rank: "Order",
		taxonomyName: "Octopoda",
		commonName: "Octopuses",
		description:
			"Cryptic benthic and pelagic cephalopods whose DNA traces can reveal hidden biodiversity hot spots.",
		taxonomyHref: "/explore/taxonomy/Octopoda"
	}
];

export default async function DataSummaryHighlights() {
	const latestProjects = await publicPrisma.project.findMany({
		orderBy: {
			dateSubmitted: "desc"
		},
		take: 2,
		select: {
			project_id: true,
			project_name: true,
			institution: true,
			assay_type: true,
			dateSubmitted: true,
			projectDescription: true
		}
	});

	return (
		<div className="space-y-12 mb-24 max-w-5xl mx-auto">
			<div>
				<div className="text-2xl text-base-content mb-6">Latest project submissions</div>
					{latestProjects.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
							{latestProjects.map((project) => (
								<div key={project.project_id} className="card bg-base-100 shadow-sm transition-all hover:shadow-md">
									<div className="card-body p-5 gap-4">
										<div className="h-44 rounded-xl bg-base-200/70 flex items-center justify-center text-sm text-base-content/60">
											Image placeholder
										</div>
										<div className="flex items-start justify-between gap-3">
											<h3 className="card-title text-lg sm:text-xl font-medium text-base-content leading-tight">
												{project.project_name}
											</h3>
											<div className="text-xs sm:text-sm whitespace-nowrap font-semibold text-primary">
												{new Date(project.dateSubmitted).toLocaleDateString()}
											</div>
										</div>
										<p className="text-sm text-base-content/75 leading-relaxed line-clamp-3">
											{project.projectDescription ?? "No project description was provided in this submission."}
										</p>
										<div className="text-sm text-base-content/75 flex flex-wrap gap-x-4 gap-y-1">
											<span>ID: {project.project_id}</span>
											<span>Assay: {project.assay_type || "Not specified"}</span>
											{project.institution && <span>{project.institution}</span>}
										</div>
										<div className="card-actions justify-end">
											<Link href={`/explore/project/${project.project_id}`} className="btn btn-sm btn-primary">
												View project
											</Link>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-xl bg-base-100 p-6 text-base-content/70">
							No public project submissions are available yet.
						</div>
					)}
			</div>

			<div>
				<div className="text-2xl text-base-content mb-6">Creature Features</div>
				<DataSummaryCreatureCarousel creatures={featuredCreatures} />
			</div>
		</div>
	);
}
