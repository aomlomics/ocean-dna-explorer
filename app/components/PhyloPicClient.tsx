"use client";

import { Taxonomy } from "@prisma/client";
import { useEffect, useState } from "react";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";

export default function PhyloPic({ taxonomy }: { taxonomy: Taxonomy }) {
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [imageDetails, setImageDetails] = useState({} as { rank: string; title: string });

	const ranksBySpecificity = [
		"species",
		"genus",
		"family",
		"order",
		"class",
		"phylum",
		"subdivision",
		"division",
		"supergroup",
		"kingdom",
		"domain"
	] as Array<keyof typeof taxonomy>;

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			let gbifTaxonomy;
			let mostSpecificRank;
			try {
				for (const rank of ranksBySpecificity) {
					if (taxonomy[rank] && /^[a-zA-Z]+$/.test(taxonomy[rank].toString())) {
						//retrieve suggested taxonomies from GBIF
						//TODO: split more logically
						const gbifTaxaRes = await fetch(`https://api.gbif.org/v1/species/suggest?q=${taxonomy[rank]}`);
						const gbifTaxa = await gbifTaxaRes.json();

						//get only the taxonomies that match the specific rank
						//TODO: check GBIF API docs to do this step in the previous fetch
						gbifTaxonomy = gbifTaxa.filter((taxa: Record<string, any>) => taxa.rank.toLowerCase() === rank)[0];
						if (gbifTaxonomy) {
							mostSpecificRank = rank;
							break;
						}
					}
				}
				if (!gbifTaxonomy) {
					setLoading(false);
					return;
				}
			} catch {
				setLoading(false);
				return;
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

			//retry PhyloPic API call
			for (let i = 0; i < 3; i++) {
				try {
					const phyloPicRes = await fetch(
						`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`,
						{ signal: AbortSignal.timeout(3000) }
					);
					const phyloPic = await phyloPicRes.json();

					setLoading(false);
					if (phyloPic.errors) {
						return;
					}
					setImageUrl(phyloPic._embedded.primaryImage._links.vectorFile.href);
					setImageDetails({
						rank: mostSpecificRank as string,
						title: phyloPic._embedded.primaryImage._links.self.title
					});
					break;
				} catch {
					//retry after 1 second
					await new Promise((res) => setTimeout(res, 1000));
				}
			}
			setLoading(false);
		}

		fetchData();
	}, []);

	//TODO: make tooltip not appear underneath elements that come after it
	return (
		<div className="w-full h-full relative flex flex-col items-center justify-center">
			{!!imageUrl ? (
				<div
					className="tooltip tooltip-bottom tooltip-primary w-full h-full"
					data-tip={`${imageDetails.rank[0].toUpperCase() + imageDetails.rank.slice(1)}: ${imageDetails.title}`}
				>
					<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" fill className="object-contain" />
				</div>
			) : loading ? (
				<span className="loading loading-spinner loading-lg h-full"></span>
			) : (
				<div className="text-center text-base-content/80">No Image</div>
			)}
		</div>
	);
}
