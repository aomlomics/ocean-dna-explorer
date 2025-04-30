"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function analysisDeleteAction(formData: FormData) {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const del = JSON.parse(formData.get("del") as string);

	await prisma.$transaction(
		async (tx: Prisma.TransactionClient) => {
			//analysis delete
			if (del.analysis_run_name) {
				console.log("analysis delete");
				await tx.analysis.delete({
					where: {
						analysis_run_name: del.analysis_run_name
					}
				});
			}

			//features delete
			// console.log("empty features delete");
			// await tx.feature.deleteMany({
			// 	where: {
			// 		Assignments: {
			// 			none: {}
			// 		}
			// 	}

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

	return { message: "Success" };
}
