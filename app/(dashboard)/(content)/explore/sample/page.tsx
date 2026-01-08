import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanToEnum } from "@/types/enums";
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
	const { "0": _, "1": __, ...deadBooleanOptions } = DeadBooleanToEnum;

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
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>eDNA samples with metadata on collection, environmental conditions, storage, and processing methods.</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
				<ExploreTabButtons />
			</div>
		</ExplorePage>
	);
}
