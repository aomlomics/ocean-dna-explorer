import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import Link from "next/link";

export default async function Assay() {
	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter tableConfig={[]} />
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
						<p className="mb-2">
							Laboratory protocols used to analyze samples, specifying primers, controls, PCR protocols, and target
							genes for DNA amplification.
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

				<div className="space-y-6">
					<h1 className="text-xl font-medium text-base-content">
						Showing all
						<span className="text-primary"> Assays</span>
					</h1>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<Pagination
							id="assay_name"
							table="assay"
							title="assay_name"
							fields={["pcr_primer_forward", "pcr_primer_reverse"]}
							relCounts={["Samples", "Libraries", "Analyses"]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
