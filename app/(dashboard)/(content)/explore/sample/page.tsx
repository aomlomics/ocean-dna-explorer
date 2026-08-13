import { prisma } from "@/app/helpers/prisma";
import { getOptions } from "@/app/helpers/utils";
import { DeadBooleanToEnum } from "@/types/enums";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";

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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

	return <ExplorePage table="sample" tableConfig={tableConfig} />;
}
