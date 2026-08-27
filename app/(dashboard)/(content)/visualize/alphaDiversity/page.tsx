import AlphaDiversityData from "@/app/components/charts/data/AlphaDiversityData";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Alpha Diversity",
	description:
		"Build queries to visualize alpha diversity results with interactive box-and-whisker plots. Compare diversity measurements across sample characteristics and group results by different fields."
};

export default function VisualizeAlphaDiversity() {
	return <AlphaDiversityData />;
}
