"use client";

import { Taxonomy } from "@/app/generated/prisma/client";
import { useEffect, useState } from "react";
import { RanksBySpecificity, TaxonomicRanks } from "@/types/objects";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";

export default function PhyloPicClient({ taxonomy }: { taxonomy: Taxonomy }) {
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [imageDetails, setImageDetails] = useState({} as { rank: string; title: string });
	const [imageTaxonomy, setImageTaxonomy] = useState("");

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			let gbifTaxonomy;
			let mostSpecificRank;
			try {
				for (const rank of RanksBySpecificity) {
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

							const tempTaxonomy = [];
							for (let taxa of TaxonomicRanks) {
								if (taxonomy[taxa]) {
									tempTaxonomy.push(taxonomy[taxa]);
								}

								if (taxa === mostSpecificRank) {
									break;
								}
							}
							setImageTaxonomy(tempTaxonomy.join(";"));

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
		<>
			{!!imageUrl ? (
				<div
					className="w-full h-full relative flex flex-col justify-center tooltip tooltip-primary break-words before:!w-full"
					data-tip={imageTaxonomy}
				>
					<p className="text-primary">PhyloPic of {imageDetails.rank[0].toUpperCase() + imageDetails.rank.slice(1)}:</p>
					<p className="break-words">{imageDetails.title}</p>
					<div className="relative h-full w-full">
						<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" fill className="object-contain" />
					</div>
				</div>
			) : loading ? (
				<span className="loading loading-spinner loading-lg h-full"></span>
			) : (
				<div className="text-center text-base-content/80">No Image</div>
			)}
		</>
	);
}
