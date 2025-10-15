"use server";

import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { AnalysisSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

//TODO: delete files from blob store
export default async function analysisDeleteAction(target: string): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = AnalysisSchema.shape.analysis_run_name.safeParse(target);
	if (!parsed.success) {
		//TODO: make more specific, since the schema is only a string, and not an object
		return {
			statusMessage: "error",
			error: parsed.error.issues
				? parsed.error.issues.map((issue) => issue.message).join(" ")
				: "Invalid analysis_run_name"
		};
	}
	const analysis_run_name = parsed.data;

	try {
		await prisma.$transaction(
			async (tx) => {
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						}
					}
				});

				if (!analysis) {
					throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
				} else if (
					!analysis.Project.userIds.includes(userId) &&
					(!role || !RolePermissions[role].includes("manageUsers"))
				) {
					throw new Error("Unauthorized action.");
				}

				//analysis delete
				await tx.analysis.delete({
					where: {
						analysis_run_name
					}
				});

				//features delete
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
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
