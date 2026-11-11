import ExplorePage from "@/app/components/explore/ExplorePage";
import type { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import { TaxonomicRanks } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.taxonomy;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function TaxonomicHierarchy() {
	const tableConfig: FilterConfig[] = [
		//TODO: integrate with new parseApiQuery
		// {
		// 	type: "select",
		// 	field: "assignmentLevel",
		// 	options: ["", ...RanksBySpecificity],
		// 	optionsLabels: ["All levels", ...RanksBySpecificity.map((rank) => rank.charAt(0).toUpperCase() + rank.slice(1))]
		// },
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomicHierarchy"
		}
	];
	return <ExplorePage table="taxonomicHierarchy" tableConfig={tableConfig} displayMode="grid" toggle />;
}
