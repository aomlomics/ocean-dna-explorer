import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import { RanksBySpecificity, TaxonomicRanks } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Metadata } from "next";

const tableMeta = TableMetadata.taxonomy;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Taxonomy() {
	const tableConfig: FilterConfig[] = [
		{
			type: "select",
			field: "assignmentLevel",
			options: ["", ...RanksBySpecificity],
			optionsLabels: ["All levels", ...RanksBySpecificity.map((rank) => rank.charAt(0).toUpperCase() + rank.slice(1))]
		},
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomy"
		}
	];
	return <ExplorePage table="taxonomy" tableConfig={tableConfig} displayMode="grid" toggle />;
}
