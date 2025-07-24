import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

export default async function Sample() {
	const samples = await prisma.sample.findMany({
		select: {
			project_id: true,
			geo_loc_name: true,
			env_broad_scale: true,
			env_local_scale: true,
			env_medium: true,
			size_frac: true
		}
	});
	if (!samples) return <>Loading...</>;

	const filterOptions = getOptions(samples);
	const { "0": _, "1": __, ...deadBooleanOptions } = DeadBooleanEnum;

	const tableConfig: FilterConfig[] = [
		{
			field: "project_id",
			type: "select",
			options: filterOptions.project_id
		},
		{
			field: "geo_loc_name",
			type: "select",
			options: filterOptions.geo_loc_name
		},
		{
			field: "env_broad_scale",
			type: "select",
			options: filterOptions.env_broad_scale
		},
		{
			field: "env_local_scale",
			type: "select",
			options: filterOptions.env_local_scale
		},
		{
			field: "env_medium",
			type: "select",
			options: filterOptions.env_medium
		},
		{
			field: "habitat_natural_artificial_0_1",
			type: "select",
			options: Object.values(deadBooleanOptions),
			optionsLabels: Object.keys(deadBooleanOptions)
		},
		{
			field: "size_frac",
			type: "select",
			options: filterOptions.size_frac
		}
	];

	return (
		<ExplorePage table="sample" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
						<p className="mb-2">
							eDNA samples with metadata on collection, environmental conditions, storage, and processing methods.
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
					{/* <ExploreSearch table="sample" defaultField="samp_name" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Samples</span>
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
					<Table table="sample" defaultTake={10} filterHeadersAtStart hideEmptyAtStart />
				</div>
				<div className="lg:hidden">
					<Pagination table="sample" />
				</div>
			</div>
		</ExplorePage>
	);
}
