import AlphaDiversityDisplay from "@/app/components/charts/wrappers/AlphaDiversityDisplay";
import { AlphaDiversityFindManyArgs } from "@/app/generated/prisma/models";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";

export default async function VisualizeMetadata({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = new URLSearchParams();
	for (const [key, val] of Object.entries(await searchParams)) {
		if (val != null) {
			if (Array.isArray(val)) {
				for (const v of val) {
					params.append(key, v);
				}
			} else {
				params.set(key, val);
			}
		}
	}

	const { query } = parseApiQuery("alphaDiversity", params, {
		features: { advanced: true, shapes: true },
		swapToTable: true
	});

	const diversities = await prisma.alphaDiversity.findMany({
		...(query as AlphaDiversityFindManyArgs),
		include: {
			AlphaDiversityIndexes: {
				select: {
					index: true,
					Library: {
						select: {
							Sample: true
						}
					}
				}
			}
		}
	});

	return <AlphaDiversityDisplay key={params.toString()} alphaDiversities={diversities} />;
}
