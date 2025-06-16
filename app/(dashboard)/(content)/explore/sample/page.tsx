import ExploreSearch from "@/app/components/explore/ExploreSearch";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import Pagination from "@/app/components/paginated/Pagination";
import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { SampleScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { DeadBooleanEnum } from "@/types/enums";
import Link from "next/link";

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

	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
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
				]}
			/>
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
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

				<div className="space-y-6">
					<ExploreSearch
						title="Samples"
						table="sample"
						fieldOptions={SampleScalarFieldEnumSchema._def.values}
						defaultField="samp_name"
					/>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<Pagination
							table="sample"
							id="samp_name"
							title="samp_name"
							fields={["project_id", "geo_loc_name"]}
							relCounts={["Occurrences"]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
