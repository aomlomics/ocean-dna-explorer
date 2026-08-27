import type { Taxonomy } from "@/app/generated/prisma/client";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";
import { matchGbifForPhylopic } from "./matchGbifForPhylopic";

export default async function PhyloPic({ taxonomy }: { taxonomy: Taxonomy }) {
	const errorImg = <>No Image</>;

	const matched = await matchGbifForPhylopic(taxonomy);
	if (!matched) {
		return errorImg;
	}

	const phyloPicRes = await fetch(
		`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${matched.objectIDs}`
	);
	const phyloPic = await phyloPicRes.json();
	if (phyloPic.errors) {
		return errorImg;
	}
	const imageUrl = phyloPic._embedded.primaryImage._links.vectorFile.href;
	const title = phyloPic._embedded.primaryImage._links.self.title ?? "";
	const rank = matched.rankMatched;
	const rankLabel = rank ? rank[0]!.toUpperCase() + rank.slice(1) : "Taxon";

	return (
		<div className="w-full h-full relative flex flex-col items-center justify-center">
			<div
				className="tooltip tooltip-bottom tooltip-primary w-full h-full before:bg-base-100 before:text-base-content before:border before:border-base-300"
				data-tip={`Image of ${rankLabel}: ${title}`}
			>
				<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" priority className="object-contain" />
			</div>
		</div>
	);
}
