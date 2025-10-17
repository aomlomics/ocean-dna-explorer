import UnderConstruction from "@/app/components/UnderConstruction";
import { AssayPrep } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Project_id_Assay_name({
	params
}: {
	params: Promise<{ project_id: AssayPrep["project_id"]; assay_name: AssayPrep["assay_name"] }>;
}) {
	let { project_id, assay_name } = await params;
	project_id = decodeURIComponent(project_id);
	assay_name = decodeURIComponent(assay_name);

	const assayPrep = await prisma.assayPrep.findUnique({
		where: {
			project_id_assay_name: {
				project_id,
				assay_name
			}
		}
	});

	if (!assayPrep) return <>AssayPrep not found</>;

	return <UnderConstruction />;
}
