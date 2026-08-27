"use client";

import LoadingAlphaDiversityDisplay from "@/app/components/charts/loading/LoadingAlphaDiversityDisplay";
import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import { fetcher } from "@/app/helpers/utils";
import { AlphaDiversityPartialWithRelationsSchema } from "@/prisma/generated/zod";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

export default function AlphaDiversityData() {
	const searchParams = useSearchParams();

	const { data, error, isLoading } = useSWR(
		`/api/internal/alphaDiversity/swapToTable?relations=alphaDiversityIndex,sample&relationsAllFields=true&${searchParams.toString()}`,
		fetcher,
		{ revalidateOnFocus: false }
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
