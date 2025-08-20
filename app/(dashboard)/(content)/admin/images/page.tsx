import AddImageButton from "@/app/components/AddImageButton";
import { prismaImages } from "@/app/helpers/prismaImages";

export default async function AdminImages() {
	const attributions = await prismaImages.attribution.findMany();

	return <AddImageButton attributions={attributions} />;
}
