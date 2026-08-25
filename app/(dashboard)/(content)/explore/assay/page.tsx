import { target_gene } from "@/app/generated/prisma/client";
import { trustedPrisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanToEnum } from "@/types/enums";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import { Metadata } from "next";

const tableMeta = TableMetadata.assay;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Assay() {
	const assays = await trustedPrisma.assay.findMany({
		select: {
			target_subfragment: true,
			pcr_primer_forward: true,
			pcr_primer_reverse: true,
			pcr_primer_name_forward: true,
			pcr_primer_name_reverse: true
		}
	});

	const filterOptions = getOptions(assays);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { "0": _, "1": __, ...deadBooleanOptions } = DeadBooleanToEnum;

	const tableConfig: FilterConfig[] = [
		{
			field: "pcr_0_1",
			type: "select",
			options: Object.values(deadBooleanOptions),
			optionsLabels: Object.keys(deadBooleanOptions)
		},
		{
			field: "target_gene",
			type: "enum",
			enum: target_gene
		},
		{
			field: "target_subfragment",
			type: "select",
			options: filterOptions.target_subfragment
		},
		{
			field: "pcr_primer_forward",
			type: "select",
			options: filterOptions.pcr_primer_forward
		},
		{
			field: "pcr_primer_reverse",
			type: "select",
			options: filterOptions.pcr_primer_reverse
		},
		{
			field: "pcr_primer_name_forward",
			type: "select",
			options: filterOptions.pcr_primer_name_forward
		},
		{
			field: "pcr_primer_name_reverse",
			type: "select",
			options: filterOptions.pcr_primer_name_reverse
		}
	];

	return <ExplorePage table="assay" tableConfig={tableConfig} tableWhere={{ Analyses: { some: {} } }} />;
}
