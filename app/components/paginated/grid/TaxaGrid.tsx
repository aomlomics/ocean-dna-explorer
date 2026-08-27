"use client";

import type { Analysis } from "@/app/generated/prisma/client";
import TaxaGridItem from "./TaxaGridItem";
import Grid from "./Grid";

export default function TaxaGrid({ analysis_run_name }: { analysis_run_name: Analysis["analysis_run_name"] }) {
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
