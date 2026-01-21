"use client";

// import { Chart, ReactGoogleChartEvent } from "react-google-charts";
// import { randomColors } from "@/app/helpers/utils";
// import { useRouter } from "next/navigation";

const TaxonomyBubbleChart = ({
	taxa,
	onBubbleClick
}: {
	taxa: [string, number][];
	onBubbleClick?: (label: string) => void;
}) => {
	// const router = useRouter();
	// const colors = randomColors(taxa.length);

	// const data = [
	// 	["ID", "X", "Y", "Group", "Value"],
	// 	...taxa.map(([label, value], i) => [
	// 		label.split(";").pop() || label,
	// 		Math.random() * 100,
	// 		Math.random() * 100,
	// 		label.split(";")[0],
	// 		value
	// 	])
	// ];

	// const options = {
	// 	colorAxis: { colors: colors },
	// 	bubble: {
	// 		textStyle: {
	// 			fontSize: 12,
	// 			fontName: "Arial",
	// 			color: "black",
	// 			bold: true,
	// 			italic: false
	// 		}
	// 	}
	// };

	// const chartEvents: ReactGoogleChartEvent[] = [
	// 	{
	// 		eventName: "select",
	// 		callback: ({ chartWrapper }: { chartWrapper: any }) => {
	// 			const chart = chartWrapper.getChart();
	// 			const selection = chart.getSelection();
	// 			if (selection.length > 0) {
	// 				const [selectedItem] = selection;
	// 				const dataTable = chartWrapper.getDataTable();
	// 				const label = dataTable.getValue(selectedItem.row, 0);
	//
	// 				if (onBubbleClick) {
	// 					onBubbleClick(label);
	// 				} else {
	// 					router.push(`/explore/taxonomy/${label}`);
	// 				}
	// 			}
	// 		}
	// 	}
	// ];

	// return (
	// 	<Chart
	// 		chartType="BubbleChart"
	// 		width="100%"
	// 		height="500px"
	// 		data={data}
	// 		options={options}
	// 		chartEvents={chartEvents}
	// 	/>
	// );

	return (
		<div className="w-full h-[500px] flex items-center justify-center rounded-lg bg-base-200 text-base-content/70">
			Taxonomy bubble chart temporarily disabled
		</div>
	);
};

export default TaxonomyBubbleChart;
