import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";
import TableFilter from "@/app/components/explore/filters/TableFilter";

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
			<div>
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

				<div className="flex justify-between items-center my-4">
					{/* <ExploreSearch table="sample" defaultField="samp_name" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Samples</span>
					</h1>
				</div>

				<TableFilter tableConfig={tableConfig} />
					<div className="hidden lg:block lg:h-[calc(95vh-20rem)]">
						<div className="rounded-lg border border-base-300 h-full overflow-auto">
							<Table table="sample" defaultTake={25} filterHeadersAtStart hideEmptyAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="sample" />
				</div>
			</div>
		</ExplorePage>
	);
}
