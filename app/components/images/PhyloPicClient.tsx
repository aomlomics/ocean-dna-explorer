"use client";

import { Taxonomy } from "@/app/generated/prisma/client";
import { useEffect, useState } from "react";
import { RanksBySpecificity } from "@/types/objects";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";

export default function PhyloPicClient({ taxonomy }: { taxonomy: Taxonomy }) {
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [imageDetails, setImageDetails] = useState("");

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			let gbifTaxonomy;
			try {
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
						if (taxonomy[rank].toString() === "Cheilopogon") {
							console.log("test", gbifTaxonomyArr);
						}
						if (gbifTaxonomyArr.length) {
							if (gbifTaxonomyArr.length === 1) {
								gbifTaxonomy = gbifTaxonomyArr[0];
								break;
							}
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

					if (phyloPic.errors) {
						return;
					}
					setImageUrl(phyloPic._embedded.primaryImage._links.vectorFile.href);
					setImageDetails(
						phyloPic._embedded.primaryImage._links.nodes.reduce(
							(acc: string, n: { title: string }) => (acc ? n.title + " | " + acc : n.title),
							""
						)
					);

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

	return (
		<>
			{!!imageUrl ? (
				<div
					className="w-full h-full relative flex flex-col justify-center tooltip tooltip-primary break-words before:!w-full"
					data-tip={"PhyloPic nodes: " + imageDetails}
				>
					<div className="relative h-full w-full">
						<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" fill className="object-contain" />
					</div>
				</div>
			) : loading ? (
				<div className="w-full h-full flex items-center justify-center">
					<span className="loading loading-spinner loading-lg bg-primary"></span>
				</div>
			) : (
				<div className="h-full w-full flex items-center justify-center text-center text-base-content/80">No Image</div>
			)}
		</>
	);
}
