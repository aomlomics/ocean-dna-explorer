import UnderConstruction from "@/app/components/UnderConstruction";
import { Assignment } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Analysis_run_name_Featureid({
	params
}: {
	params: Promise<{ analysis_run_name: Assignment["analysis_run_name"]; featureid: Assignment["featureid"] }>;
}) {
	let { analysis_run_name, featureid } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);
	featureid = decodeURIComponent(featureid);

	const assignment = await prisma.assignment.findUnique({
		where: {
			analysis_run_name_featureid: {
				analysis_run_name,
				featureid
			}
		}
	});

	if (!assignment) return <>Assignment not found</>;

	return <UnderConstruction />;
}
