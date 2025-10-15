import UnderConstruction from "@/app/components/UnderConstruction";
import { Library } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";

export default async function Lib_id({ params }: { params: Promise<{ lib_id: Library["lib_id"] }> }) {
	let { lib_id } = await params;
	lib_id = decodeURIComponent(lib_id);

	const library = await prisma.library.findUnique({
		where: {
			lib_id
		}
	});

	if (!library) return <>Library not found</>;

	return <UnderConstruction />;
}
