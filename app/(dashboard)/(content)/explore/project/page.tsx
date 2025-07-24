import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

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
			<div className="w-full px-6 lg:px-0">
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

				<div className="flex justify-between items-center my-4 -mb-1">
					{/* <ExploreSearch table="project" defaultField="project_id" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Projects</span>
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
				<div className="hidden lg:block rounded-lg border border-base-300 lg:mt-6">
					<Table table="project" defaultTake={10} hideEmptyAtStart filterHeadersAtStart />
				</div>
				<div className="lg:hidden">
					<Pagination table="project" />
				</div>
			</div>
		</ExplorePage>
	);
}
