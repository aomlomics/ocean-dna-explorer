"use client";

import { useTheme } from "next-themes";
import DoughnutChart from "./DoughnutChart";

type Assay = {
	target_gene: string;
	count?: number;
};

export default function AssayPieChart({ assays }: { assays: Assay[] }) {
	const assaysWithData = assays.filter((a) => (a.count ?? 0) > 0);

	if (assaysWithData.length === 0) {
		return (
			<div className="w-full flex justify-center mt-4">
				<div className="w-full max-w-4xl text-center text-base-content/70">
					No assay data available yet.
				</div>
			</div>
		);
	}

	return (
		<div className="w-full flex justify-center mt-4">
			<div className="w-full max-w-4xl">
				<DoughnutChart
					labels={assaysWithData.map((a) => a.target_gene)}
					data={assaysWithData.map((a) => a.count || 0)}
				/>
			</div>
		</div>
	);
} 