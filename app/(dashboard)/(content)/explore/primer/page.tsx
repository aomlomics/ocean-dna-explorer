import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

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
		<ExplorePage table="primer" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
						<p className="mb-2">
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
				</div>

				<div className="flex justify-between items-center my-4">
					{/* <ExploreSearch table="primer" defaultField="pcr_primer_name_forward" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Primers</span>
					</h1>
					<div className="lg:hidden">
						<label htmlFor="my-drawer" className="btn btn-primary drawer-button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								className="inline-block w-5 h-5 stroke-current"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
							</svg>
							Filter Options
						</label>
					</div>
				</div>
					<div className="aspect-5/2 hidden lg:block">
						<div className="rounded-lg border border-base-300 h-full">
							<Table table="primer" defaultTake={25} filterHeadersAtStart hideEmptyAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="primer" />
				</div>
			</div>
		</ExplorePage>
	);
}
