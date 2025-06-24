"use server";

import { prisma } from "@/app/helpers/prisma";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function projectDeleteAction(target: string): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = ProjectSchema.shape.project_id.safeParse(target);
	if (!parsed.success) {
		//TODO: make more specific, since the schema is only a string, and not an object
		return {
			statusMessage: "error",
			error: parsed.error.issues ? parsed.error.issues.map((issue) => issue.message).join(" ") : "Invalid project_id"
		};
	}
	const project_id = parsed.data;

	try {
		const error = await prisma.$transaction(
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
					return `No Project with project_id of '${project_id}' found.`;
				} else if (!project.userIds.includes(userId) && (!role || !RolePermissions[role].includes("manageUsers"))) {
					return "Unauthorized action.";
				}

				//project delete
				console.log("project delete");
				await tx.project.delete({
					where: {
						project_id
					}
				});

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

		if (error) {
			return { statusMessage: "error", error };
		}

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
