import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import { prisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExploreSearch from "@/app/components/explore/ExploreSearch";
import Table from "@/app/components/paginated/Table";

export default async function Project() {
	const projects = await prisma.project.findMany({
		select: {
			institution: true,
			study_factor: true
		}
	});
	if (!projects) return <>Loading...</>;

	const filterOptions = getOptions(projects);

	return (
		<div className="grid grid-cols-[20%_80%] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						field: "institution",
						type: "select",
						options: filterOptions.institution
					},
					{
						field: "study_factor",
						type: "select",
						options: filterOptions.study_factor
					},
					{
						field: "assay_type",
						type: "enum",
						enum: assay_type
					}
				]}
			/>
			<div className="space-y-6 w-full">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
						<p className="mb-2">
							Research initiatives collecting eDNA samples, with metadata on study design, objectives, and participating
							institutions.
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
					{/* <ExploreSearch table="project" defaultField="project_id" /> */}
					<h1 className="text-xl font-medium text-base-content col-start-4 col-span-2">
						Showing <span className="text-primary">Projects</span>
					</h1>

					<div className="bg-base-100 rounded-lg border border-base-300 p-6">
						<Table table="project" defaultTake={10} hideEmptyAtStart filterHeadersAtStart />
					</div>
				</div>
			</div>
		</div>
	);
}
