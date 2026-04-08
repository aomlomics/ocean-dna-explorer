import { prisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import TableMetadata from "@/types/tableMetadata";

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
		<ExplorePage table="project" tableConfig={tableConfig} toggle displayMode="table">
			<div className="w-full space-y-4">
				<div className="text-base-content/80 space-y-2">
					<p>{TableMetadata.project.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
			</div>
		</ExplorePage>
	);
}
