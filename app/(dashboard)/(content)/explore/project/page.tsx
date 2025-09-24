import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";
import TableFilter from "@/app/components/explore/filters/TableFilter";

export default async function Project() {
	const projects = await prisma.project.findMany({
		select: {
			institution: true,
			study_factor: true
		}
	});
	if (!projects) return <>Loading...</>;

	const filterOptions = getOptions(projects);

	const tableConfig: FilterConfig[] = [
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
	];

	return (
		<ExplorePage table="project" tableConfig={tableConfig}>
			<div className="w-full">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
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

				<div className="flex justify-between items-center my-4">
					{/* <ExploreSearch table="project" defaultField="project_id" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Projects</span>
					</h1>
				</div>

				<TableFilter tableConfig={tableConfig} />
					<div className="aspect-5/2 hidden lg:block">
						<div className="rounded-lg border border-base-300 h-full">
							<Table table="project" defaultTake={25} hideEmptyAtStart filterHeadersAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="project" />
				</div>
			</div>
		</ExplorePage>
	);
}
