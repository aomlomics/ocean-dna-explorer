import { Taxonomy } from "@/app/generated/prisma/client";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";
import { RanksBySpecificity } from "@/types/objects";

export default async function PhyloPic({ taxonomy }: { taxonomy: Taxonomy }) {
	const errorImg = <>No Image</>;

	let gbifTaxonomy;
	let imageDetails = { rank: "", title: "" };
	for (const rank of RanksBySpecificity) {
		if (taxonomy[rank] && /^[a-zA-Z]+$/.test(taxonomy[rank].toString())) {
			//retrieve suggested taxonomies from GBIF
			//TODO: split more logically
			const gbifTaxaRes = await fetch(`https://api.gbif.org/v1/species/suggest?q=${taxonomy[rank]}`);
			const gbifTaxa = await gbifTaxaRes.json();
			//get only the taxonomies that match the specific rank
			//TODO: check GBIF API docs to do this step in the previous fetch
			const gbifTaxonomyArr = gbifTaxa.filter(
				(taxa: Record<string, any>) => taxa.rank.toLowerCase() === rank && taxa.status === "ACCEPTED"
			);
			if (gbifTaxonomyArr.length) {
				if (gbifTaxonomyArr.length === 1) {
					gbifTaxonomy = gbifTaxonomyArr[0];
					imageDetails.rank = rank;
					break;
				}
			}
		}
	}
	if (!gbifTaxonomy) {
		return errorImg;
	}

	//use result of GBIF API to query PhyloPics for the vector image
	const objectIDs =
		`${gbifTaxonomy.speciesKey ? gbifTaxonomy.speciesKey + "," : ""}` +
		`${gbifTaxonomy.genusKey ? gbifTaxonomy.genusKey + "," : ""}` +
		`${gbifTaxonomy.familyKey ? gbifTaxonomy.familyKey + "," : ""}` +
		`${gbifTaxonomy.orderKey ? gbifTaxonomy.orderKey + "," : ""}` +
		`${gbifTaxonomy.classKey ? gbifTaxonomy.classKey + "," : ""}` +
		`${gbifTaxonomy.phylumKey ? gbifTaxonomy.phylumKey + "," : ""}` +
		`${gbifTaxonomy.kingdomKey ? gbifTaxonomy.kingdomKey : ""}`;
	const phyloPicRes = await fetch(
		`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`
	);
	const phyloPic = await phyloPicRes.json();
	if (phyloPic.errors) {
		return errorImg;
	}
	const imageUrl = phyloPic._embedded.primaryImage._links.vectorFile.href;
	imageDetails.title = phyloPic._embedded.primaryImage._links.self.title;

	return (
		<div className="w-full h-full relative flex flex-col items-center justify-center">
			<div
				className="tooltip tooltip-bottom tooltip-primary w-full h-full before:bg-base-100 before:text-base-content before:border before:border-base-300"
				data-tip={`Image of ${imageDetails.rank[0].toUpperCase() + imageDetails.rank.slice(1)}: ${imageDetails.title}`}
			>
				<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" priority={true} fill className="object-contain" />
			</div>
		</div>
	);
}
