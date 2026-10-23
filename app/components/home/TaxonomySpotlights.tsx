import { prisma } from "@/app/helpers/prisma";
import { prismaImages } from "@/app/helpers/prismaImages";
import InfoButton from "@/app/components/InfoButton";
import FeaturedOrganisms from "../dataSummary/featuredOrganisms";

export default async function TaxonomySpotlights() {
	// A taxonomy can have one spotlight per project, so keep only the oldest spotlight per taxonomy.
	const spotlights = await prisma.taxonomySpotlight.findMany({
		distinct: ["taxonomy"],
		orderBy: { id: "asc" }
	});
	if (!spotlights.length) return null;

	// Images live in a separate database, so they are joined by URL instead of a Prisma relation.
	const images = await prismaImages.image.findMany({
		where: { url: { in: spotlights.map((sl) => sl.imageFileUrl_ODE) } },
		include: { Attribution: true }
	});
	const imagesByUrl = new Map(images.map((image) => [image.url, image]));
	const spotlightsWithImages = spotlights.map((sl) => ({ ...sl, Image: imagesByUrl.get(sl.imageFileUrl_ODE) }));

	return (
		<section className="w-full space-y-6 pt-10">
			<div className="flex items-center justify-center gap-2">
				<h2 className="text-2xl font-semibold leading-tight text-base-content sm:text-3xl">Taxonomy Spotlights</h2>
				<InfoButton
					dir="tooltip-bottom"
					text="Upcoming feature. Users will be able to submit a taxonomy spotlight for taxonomies found in projects they have submitted."
				/>
			</div>
			<FeaturedOrganisms spotlights={spotlightsWithImages} />
		</section>
	);
}
