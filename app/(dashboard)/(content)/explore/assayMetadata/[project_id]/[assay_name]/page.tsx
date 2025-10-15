import UnderConstruction from "@/app/components/UnderConstruction";
import { AssayMetadata } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Project_id_Assay_name({
	params
}: {
	params: Promise<{ project_id: AssayMetadata["project_id"]; assay_name: AssayMetadata["assay_name"] }>;
}) {
	let { project_id, assay_name } = await params;
	project_id = decodeURIComponent(project_id);
	assay_name = decodeURIComponent(assay_name);

	const assayMetadata = await prisma.assayMetadata.findUnique({
		where: {
			project_id_assay_name: {
				project_id,
				assay_name
			}
		}
	});

	if (!assayMetadata) return <>AssayMetadata not found</>;

	return <UnderConstruction />;
}
