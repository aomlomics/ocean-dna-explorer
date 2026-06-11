"use client";

import LoadingAlphaDiversityDisplay from "@/app/components/charts/loading/LoadingAlphaDiversityDisplay";
import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import { AlphaDiversity, AlphaDiversityIndex, Sample } from "@/app/generated/prisma/client";
import { AlphaDiversityPartialWithRelationsSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VisualizeMetadata() {
	const searchParams = useSearchParams();

	const [diversities, setDiversities] = useState(
		undefined as
			| (AlphaDiversity & {
					AlphaDiversityIndexes: {
						index: AlphaDiversityIndex["index"];
						Library: {
							Sample: Sample;
						};
					}[];
			  })[]
			| undefined
	);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);

		async function doFetch() {
			const res = await fetch(
				`/api/alphaDiversity/swapToTable?relations=alphaDiversityIndex,sample&relationsAllFields=true&${searchParams}`
			);
			if (!res.ok) {
				throw new Error("Alpha Diversity query failed to reach the server.");
			}
			const response = (await res.json()) as NetworkPacket;
			if (response.statusMessage === "error") {
				throw new Error(response.error);
			}
			setDiversities(response.result.map((r: any) => AlphaDiversityPartialWithRelationsSchema.parse(r)));

			setLoading(false);
		}

		doFetch();
	}, [searchParams]);

	if (loading || !diversities) {
		return <LoadingAlphaDiversityDisplay />;
	}

	return <AlphaDiversityDisplay alphaDiversities={diversities} />;
}
