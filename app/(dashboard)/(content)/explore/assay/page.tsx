import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { target_gene } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";
import TableFilter from "@/app/components/explore/filters/TableFilter";

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
	const { "0": _, "1": __, ...deadBooleanOptions } = DeadBooleanEnum;

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
			field: { rel: "Primer", f: "pcr_primer_name_forward" },
			type: "select",
			options: primerFilterOptions.pcr_primer_name_forward
		},
		{
			field: { rel: "Primer", f: "pcr_primer_name_reverse" },
			type: "select",
			options: primerFilterOptions.pcr_primer_name_reverse
		}
	];

	return (
		<ExplorePage table="assay" tableConfig={tableConfig} title="Assays">
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>
						Laboratory protocols used to analyze samples, specifying primers, controls, PCR protocols, and target genes
						for DNA amplification.
					</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="text-primary hover:underline">
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
