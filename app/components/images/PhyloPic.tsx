import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";
import { matchGbifForPhylopic } from "./matchGbifForPhylopic";

export default async function PhyloPic({ taxonomy }: { taxonomy: TaxonomyModel }) {
	let gbifResponse;

	const matched = await matchGbifForPhylopic(taxonomy);
	if (matched) {
		try {
			const phyloPicRes = await fetch(
				`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${matched.objectIDs}`
			);
			if (phyloPicRes.ok) {
				const phyloPic = await phyloPicRes.json();

				if (!phyloPic.errors) {
					const rank = matched.rankMatched;

					gbifResponse = {
						imageUrl: phyloPic._embedded.primaryImage._links.vectorFile.href,
						title: phyloPic._embedded.primaryImage._links.self.title ?? "",
						rankLabel: rank ? rank[0]!.toUpperCase() + rank.slice(1) : "Taxon"
					};
				}
			}
		} catch (err) {
			console.error(err);
		}
	}

	if (!gbifResponse) return <>No Image</>;

	return (
		<div className="w-full h-full relative flex flex-col items-center justify-center">
			<div
				className="tooltip tooltip-bottom tooltip-primary w-full h-full before:bg-base-100 before:text-base-content before:border before:border-base-300"
				data-tip={`Image of ${gbifResponse.rankLabel}: ${gbifResponse.title}`}
			>
				<ThemeAwarePhyloPic src={gbifResponse.imageUrl} alt="Image of taxonomy" priority className="object-contain" />
			</div>
		</div>
	);
}
