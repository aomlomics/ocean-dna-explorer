"use client";

import LoadingSampleScatterPlot from "@/app/components/charts/loading/LoadingSampleScatterPlot";
import SampleVisualize from "@/app/components/charts/wrappers/SampleVisualize";
import { Sample } from "@/app/generated/prisma/client";
import { SamplePartialSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VisualizeMetadata() {
	const searchParams = useSearchParams();

	const [samples, setSamples] = useState(undefined as Sample[] | undefined);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);

		async function doFetch() {
			const res = await fetch(`/api/sample/swapToTable?${searchParams}`);
			if (!res.ok) {
				throw new Error("Sample query failed to reach the server.");
			}
			const response = (await res.json()) as NetworkPacket;
			if (response.statusMessage === "error") {
				throw new Error(response.error);
			}
			setSamples(response.result.map((r: any) => SamplePartialSchema.parse(r)));

			setLoading(false);
		}

		doFetch();
	}, [searchParams]);

	if (loading || !samples) {
		return <LoadingSampleScatterPlot />;
	}

	return <SampleVisualize samples={samples} />;
}
