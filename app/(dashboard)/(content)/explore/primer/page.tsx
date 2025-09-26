import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";
import TableFilter from "@/app/components/explore/filters/TableFilter";

export default async function Primer() {
	const primers = await prisma.primer.findMany({
		select: {
			pcr_primer_forward: true,
			pcr_primer_name_forward: true,
			pcr_primer_reverse: true,
			pcr_primer_name_reverse: true
		}
	});
	if (!primers) return <>Loading...</>;

	const filterOptions = getOptions(primers);

	const tableConfig: FilterConfig[] = [
		{
			field: "pcr_primer_forward",
			type: "select",
			options: filterOptions.pcr_primer_forward
		},
		{
			field: "pcr_primer_name_forward",
			type: "select",
			options: filterOptions.pcr_primer_name_forward
		},
		{
			field: "pcr_primer_reverse",
			type: "select",
			options: filterOptions.pcr_primer_reverse
		},
		{
			field: "pcr_primer_name_reverse",
			type: "select",
			options: filterOptions.pcr_primer_name_reverse
		}
	];

	return (
		<ExplorePage table="primer" tableConfig={tableConfig} title="Primers">
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>
						A short, synthetic strand of nucleic acid (an oligonucleotide) that acts as a starting point for DNA
						replication by targeting one end of a specific gene sequence (the barcode region).
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
