import TaxonomyData from "@/app/components/charts/data/TaxonomyData";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Taxonomy",
	description:
		"Build queries to visualize the taxonomic composition of samples with an interactive bar chart. Compare organisms across different taxonomic groups and sample characteristics to see how the community changes."
};

export default function VisualizeTaxonomy() {
	return <TaxonomyData />;
}
