import SampleMetadataData from "@/app/components/charts/data/SampleMetadataData";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sample Metadata",
	description:
		"Build queries to visualize sample data with an interactive scatter plot, allowing you to compare different sample fields and discover patterns in the data."
};

export default function SampleMetadata() {
	return <SampleMetadataData />;
}
