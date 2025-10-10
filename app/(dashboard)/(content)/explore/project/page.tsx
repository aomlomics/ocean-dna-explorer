import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import { assay_type } from "@/app/generated/prisma/client";
import Link from "next/link";
import { getOptions } from "@/app/helpers/utils";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";

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
        <ExplorePage table="project" tableConfig={tableConfig} title="Projects">
            <div className="w-full space-y-4">
                <div className="text-base-content/80 pb-4 space-y-2">
                    <p>
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
                <ExploreTabButtons />
            </div>
        </ExplorePage>
    );
}
