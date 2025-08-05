import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { target_gene } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { PrimerPartial } from "@/prisma/generated/zod";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

export default async function Assay() {
	const assaysWithRelations = await prisma.assay.findMany({
		select: {
			target_subfragment: true,
			pcr_primer_forward: true,
			pcr_primer_reverse: true,
			Primer: {
				select: {
					pcr_primer_name_forward: true,
					pcr_primer_name_reverse: true
				}
			}
		}
	});

	const primers = [] as PrimerPartial[];
	const assays = assaysWithRelations.map((a) => {
		const { Primer: primer, ...justAssay } = a;
		primers.push(primer);
		return justAssay;
	});

	const filterOptions = getOptions(assays);
	const primerFilterOptions = getOptions(primers);
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
		<ExplorePage table="assay" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
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

				<div className="flex justify-between items-center my-4">
					{/* <ExploreSearch table="assay" defaultField="assay_name" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Assays</span>
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
							<Table table="assay" defaultTake={25} hideEmptyAtStart filterHeadersAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="assay" />
				</div>
			</div>
		</ExplorePage>
	);
}
