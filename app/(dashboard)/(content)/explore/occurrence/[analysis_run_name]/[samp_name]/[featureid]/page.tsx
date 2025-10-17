import UnderConstruction from "@/app/components/UnderConstruction";
import { Occurrence } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Analysis_run_name_Samp_name_Featureid({
	params
}: {
	params: Promise<{
		analysis_run_name: Occurrence["analysis_run_name"];
		samp_name: Occurrence["samp_name"];
		featureid: Occurrence["featureid"];
	}>;
}) {
	let { analysis_run_name, samp_name, featureid } = await params;
	analysis_run_name = decodeURIComponent(analysis_run_name);
	samp_name = decodeURIComponent(samp_name);
	featureid = decodeURIComponent(featureid);

	const occurrence = await prisma.occurrence.findUnique({
		where: {
			analysis_run_name_samp_name_featureid: {
				analysis_run_name,
				samp_name,
				featureid
			}
		}
	});

	if (!occurrence) return <>Occurrence not found</>;

	return <UnderConstruction />;
}
