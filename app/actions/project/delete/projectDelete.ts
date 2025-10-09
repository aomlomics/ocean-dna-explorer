"use server";

import { Project } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function projectDeleteAction(target: Project["project_id"]): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = ProjectSchema.shape.project_id.safeParse(target);
	if (!parsed.success) {
		return {
			statusMessage: "error",
			error: parsed.error.issues ? parsed.error.issues.map((issue) => issue.message).join(" ") : "Invalid project_id"
		};
	}
	const project_id = parsed.data;

	try {
		await prisma.$transaction(
			async (tx) => {
				const project = await tx.project.findUnique({
					where: {
						project_id
					},
					select: {
						userIds: true
					}
				});

				if (!project) {
					throw new Error(`No Project with project_id of "${project_id}" found.`);
				} else if (!project.userIds.includes(userId) && (!role || !RolePermissions[role].includes("manageUsers"))) {
					throw new Error("Unauthorized action.");
				}

				//project delete
				await tx.project.delete({
					where: {
						project_id
					}
				});

				// features delete
				// await tx.feature.deleteMany({
				// 	where: {
				// 		Assignments: {
				// 			none: {}
				// 		}
				// 	}
				// });

				//taxonomies delete
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
