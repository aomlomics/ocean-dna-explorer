"use client";

import type { AnalysisModel } from "@/app/generated/prisma/models/Analysis";
import TaxaGridItem from "./TaxaGridItem";
import Grid from "./Grid";

export default function TaxaGrid({ analysis_run_name }: { analysis_run_name: AnalysisModel["analysis_run_name"] }) {
	return (
		<Grid
			Child={TaxaGridItem}
			table={"taxonomy"}
			where={{
				Assignments: {
					some: {
						analysis_run_name
					}
				}
			}}
		/>
	);
}
