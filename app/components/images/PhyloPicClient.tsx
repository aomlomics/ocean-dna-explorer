"use client";

import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import { limitPhyloPic } from "@/app/helpers/limitedFetch";
import { useEffect, useState } from "react";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";
import { matchGbifForPhylopic } from "./matchGbifForPhylopic";
import { TAXONOMY_GRID_TOOLTIP_CLASS } from "../paginated/grid/TaxonomyGridTooltip";

const phyloPicCache = new Map<string, { imageUrl: string; imageDetails: string }>();

export default function PhyloPicClient({
	taxonomy,
	tooltipClassName
}: {
	taxonomy: TaxonomyModel;
	tooltipClassName?: string;
}) {
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [imageDetails, setImageDetails] = useState("");

	useEffect(() => {
		const cached = phyloPicCache.get(taxonomy.taxonomy);
		if (cached) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setImageUrl(cached.imageUrl);
			setImageDetails(cached.imageDetails);
			setLoading(false);
			return;
		}

		let cancelled = false;
		async function fetchData() {
			setLoading(true);
			const match = await matchGbifForPhylopic(taxonomy);
			if (cancelled) return;
			if (!match) {
				setLoading(false);
				return;
			}

			const objectIDs = match.objectIDs;

			//retry PhyloPic API call
			for (let i = 0; i < 3; i++) {
				try {
					const phyloPicRes = await limitPhyloPic(() =>
						fetch(`https://api.phylopic.org/resolve/gbif.org/species?embed_primaryImage=true&objectIDs=${objectIDs}`, {
							signal: AbortSignal.timeout(3000)
						})
					);
					const phyloPic = await phyloPicRes.json();

					if (phyloPic.errors) {
						break;
					}
					const imageUrl = phyloPic._embedded.primaryImage._links.vectorFile.href as string;
					const imageDetails = phyloPic._embedded.primaryImage._links.nodes.reduce(
						(acc: string, n: { title: string }) => (acc ? n.title + " | " + acc : n.title),
						""
					) as string;
					phyloPicCache.set(taxonomy.taxonomy, { imageUrl, imageDetails });
					if (cancelled) return;
					setImageUrl(imageUrl);
					setImageDetails(imageDetails);

					break;
				} catch {
					//retry after 1 second
					await new Promise((res) => setTimeout(res, 1000));
				}
			}
			if (!cancelled) setLoading(false);
		}

		fetchData();
		return () => {
			cancelled = true;
		};
	}, [taxonomy]);

	return (
		<>
			{!!imageUrl ? (
				<div
					className={`w-full h-full relative flex flex-col justify-center wrap-break-word ${tooltipClassName ?? TAXONOMY_GRID_TOOLTIP_CLASS}`}
					data-tip={"PhyloPic nodes: " + imageDetails}
				>
					<div className="relative h-full w-full">
						<ThemeAwarePhyloPic src={imageUrl} alt="Image of taxonomy" className="object-contain" />
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
