import { asv_method, target_gene } from "@/app/generated/prisma/client";
import { trustedPrisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import type { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.analysis;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Analysis() {
	const analyses = await trustedPrisma.analysis.findMany({
		select: {
			project_id: true,
			assay_name: true,
			sop_bioinformatics: true,
			otu_clust_tool: true,
			otu_db: true
		}
	});
	if (!analyses) return <>Loading...</>;

	const filterOptions = getOptions(analyses);

	const tableConfig: FilterConfig[] = [
		{
			field: "asv_method",
			type: "enum",
			enum: asv_method
		},
		{
			field: { rel: "Assay", f: "target_gene" },
			type: "enum",
			enum: target_gene
		},
		{
			field: "project_id",
			type: "select",
			options: filterOptions.project_id
		},
		{
			field: "assay_name",
			type: "select",
			options: filterOptions.assay_name
		},
		{
			field: "sop_bioinformatics",
			type: "select",
			options: filterOptions.sop_bioinformatics
		},
		{
			field: "otu_clust_tool",
			type: "select",
			options: filterOptions.otu_clust_tool
		},
		{
			field: "otu_db",
			type: "select",
			options: filterOptions.otu_db
		}
	];

	return <ExplorePage table="analysis" tableConfig={tableConfig} />;
}
