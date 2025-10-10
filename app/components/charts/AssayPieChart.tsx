"use client";

import { useTheme } from "next-themes";
import DoughnutChart from "./DoughnutChart";

type Assay = {
	target_gene: string;
	count?: number;
};

export default function AssayPieChart({ assays }: { assays: Assay[] }) {
	return (
		<div className="w-full flex justify-center mt-4">
			<div className="w-full max-w-4xl">
				<DoughnutChart
					labels={assays.map((a) => a.target_gene)}
					data={assays.map((a) => a.count || 0)}
				/>
			</div>
		</div>
	);
} 