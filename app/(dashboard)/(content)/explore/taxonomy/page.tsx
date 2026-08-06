import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import { RanksBySpecificity, TaxonomicRanks } from "@/types/objects";

export default async function Taxonomy() {
	const tableConfig: FilterConfig[] = [
		{
			type: "select",
			field: "assignmentLevel",
			options: ["", ...RanksBySpecificity],
			optionsLabels: ["All levels", ...RanksBySpecificity.map((rank) => rank[0].toUpperCase() + rank.slice(1))]
		},
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomy"
		}
	];
	return <ExplorePage table="taxonomy" tableConfig={tableConfig} displayMode="grid" toggle />;
}
