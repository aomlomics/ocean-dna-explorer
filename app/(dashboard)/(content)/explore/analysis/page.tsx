import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { asv_method, target_gene } from "@/app/generated/prisma/client";
import Link from "next/link";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

export default async function Analysis() {
	const analyses = await prisma.analysis.findMany({
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

	return (
		<ExplorePage table="analysis" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
						<p className="mb-2">
							Bioinformatic processing runs that convert raw sequence data into species detections, documenting all
							parameters and methods used.
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
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Analyses</span>
					</h1>
					{/* <ExploreSearch table="analysis" defaultField="analysis_run_name" /> */}
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
							<Table table="analysis" defaultTake={25} hideEmptyAtStart filterHeadersAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="analysis" />
				</div>
			</div>
		<div className="-mt-24"></div>
		</ExplorePage>
	);
}
