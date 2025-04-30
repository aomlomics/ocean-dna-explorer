import TableFilter from "@/app/components/explore/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { asv_method, target_gene } from "@/app/generated/prisma/client";
import Link from "next/link";

export default async function Analysis() {
	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						field: "asv_method",
						label: "Analysis Method",
						type: "select",
						enum: asv_method
					},
					{
						field: { rel: "Assay", f: "target_gene" },
						label: "Target Gene",
						type: "select",
						enum: target_gene
					}
				]}
			/>
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<ExploreTabButtons />
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
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

				<div className="space-y-6">
					<h1 className="text-xl font-medium text-base-content">
						Showing all
						<span className="text-primary"> Analyses</span>
					</h1>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<Pagination
							table="analysis"
							id="analysis_run_name"
							title="analysis_run_name"
							fields={["project_id", "assay_name", "asv_method"]}
							relCounts={["Occurrences", "Assignments"]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
