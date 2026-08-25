import { trustedPrisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import TableMetadata from "@/types/tableMetadata";
import { Metadata } from "next";

const tableMeta = TableMetadata.project;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Project() {
	const projects = await trustedPrisma.project.findMany({
		select: {
			institution: true,
			study_factor: true
		}
	});

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

	return <ExplorePage table="project" tableConfig={tableConfig} toggle displayMode="table" />;
}
