"use client";

import LoadingAlphaDiversityDisplay from "@/app/components/charts/loading/LoadingAlphaDiversityDisplay";
import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import { fetcher } from "@/app/helpers/utils";
import { AlphaDiversityPartialWithRelationsSchema } from "@/prisma/generated/zod";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

export default function VisualizeAlphaDiversity() {
	const searchParams = useSearchParams();

	const { data, error, isLoading } = useSWR(
		`/api/alphaDiversity/swapToTable?relations=alphaDiversityIndex,sample&relationsAllFields=true&${searchParams.toString()}`,
		fetcher
	);
	if (error) {
		throw new Error("Alpha Diversity query failed to reach the server.");
	}
	if (isLoading || !data) {
		return <LoadingAlphaDiversityDisplay />;
	}
	if (data.statusMessage === "error") {
		throw new Error(data.error);
	}

	return (
		<AlphaDiversityDisplay
			alphaDiversities={data.result.map((r: any) => AlphaDiversityPartialWithRelationsSchema.parse(r))}
		/>
	);
}
