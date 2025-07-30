"use client";

import { useTheme } from "next-themes";
import PieChart from "./PieChart";
import { generateChartColors } from "@/app/helpers/utils";

type Assay = {
	target_gene: string;
	count?: number;
};

export default function AssayPieChart({ assays }: { assays: Assay[] }) {
	const { theme } = useTheme();
	const textColor = theme === "dark" ? "#E2E8F0" : "#2D3748";
	const colors = generateChartColors(assays.length);

	return (
		// =================================================================================
		// You can control the size of the pie chart by adjusting the `h-` and `w-` classes
		// on this container `div`. For example, `h-96` sets a fixed height, while `w-full`
		// makes it take up the full width of its parent.
		//
		// To adjust the position, you can use flexbox or grid properties on the parent
		// container in `app/(dashboard)/page.tsx`.
		// =================================================================================
		<div className="w-full flex justify-start">
			<div className="relative h-[400px] w-full max-w-lg pr-24 pt-4">
				<PieChart
					labels={assays.map((a) => a.target_gene)}
					datasets={[
						{
							label: "Count",
							data: assays.map((a) => a.count || 0),
							backgroundColor: colors
						}
					]}
					textColor={textColor}
				/>
			</div>
		</div>
	);
} 