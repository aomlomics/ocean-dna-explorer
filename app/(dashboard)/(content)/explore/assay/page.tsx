import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { target_gene } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanToEnum } from "@/types/enums";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";

export default async function Assay() {
	const assays = await prisma.assay.findMany({
		select: {
			target_subfragment: true,
			pcr_primer_forward: true,
			pcr_primer_reverse: true,
			pcr_primer_name_forward: true,
			pcr_primer_name_reverse: true
		}
	});

	const filterOptions = getOptions(assays);
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

	return (
		<ExplorePage table="assay" tableConfig={tableConfig} tableWhere={{ Analyses: { some: {} } }}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>{TableMetadata.assay.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
				<ExploreTabButtons />
			</div>
		</ExplorePage>
	);
}
