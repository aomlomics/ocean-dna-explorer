"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export default async function projectDeleteAction(formData: FormData): Promise<NetworkPacket> {
	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const del = JSON.parse(formData.get("del") as string);

	await prisma.$transaction(
		async (tx: Prisma.TransactionClient) => {
			//project delete
			if (del.project_id) {
				console.log("project delete");
				await tx.project.delete({
					where: {
						project_id: del.project_id
					}
				});
			}

			// features delete
			// console.log("empty features delete");
			// await tx.feature.deleteMany({
			// 	where: {
			// 		Assignments: {
			// 			none: {}
			// 		}
			// 	}
			// });

			//taxonomies delete
			// console.log("empty taxonomies delete");
			// await tx.taxonomy.deleteMany({
			// 	where: {
			// 		Assignments: {
			// 			none: {}
			// 		}
			// 	}
			// });
		},
		{ timeout: 1.5 * 60 * 1000 }
	);

	return { statusMessage: "success" };
}
