"use client";

import LoadingSampleScatterPlot from "@/app/components/charts/loading/LoadingSampleScatterPlot";
import SampleVisualize from "@/app/components/charts/wrappers/SampleVisualize";
import { fetcher } from "@/app/helpers/utils";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { SamplePartialSchema } from "@/prisma/generated/zod";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

export default function SampleMetadataData() {
	const searchParams = useSearchParams();
	const { trusted } = useTrusted();

	const { data, error, isLoading } = useSWR(
		`/api/internal/sample/swapToTable?trusted=${trusted}&${searchParams.toString()}`,
		fetcher,
		{
			revalidateOnFocus: false
		}
	);
	if (error) {
		throw new Error("Sample query failed to reach the server.");
	}
	if (isLoading || !data) {
		return <LoadingSampleScatterPlot />;
	}
	if (data.statusMessage === "error") {
		throw new Error(data.error);
	}

	return <SampleVisualize samples={data.result.map((r: any) => SamplePartialSchema.parse(r))} />;
}
