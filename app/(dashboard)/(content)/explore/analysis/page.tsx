import TableFilter from "@/app/components/explore/filters/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { asv_method, target_gene } from "@/app/generated/prisma/client";
import Link from "next/link";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { AnalysisScalarFieldEnumSchema } from "@/prisma/generated/zod";
import ExploreSearch from "@/app/components/explore/ExploreSearch";

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

	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
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
					<ExploreSearch
						title="Analyses"
						table="analysis"
						fieldOptions={AnalysisScalarFieldEnumSchema._def.values}
						defaultField="analysis_run_name"
					/>

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
