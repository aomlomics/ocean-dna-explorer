"use server";

import { Project } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket, Role } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function projectUpdateUserIdsAction(
	target: Project["project_id"],
	newUserIds: Project["userIds"],
	deletedUserIds: Project["userIds"]
): Promise<NetworkPacket> {
	const client = await clerkClient();
	const { userId } = await auth();

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const users = (await client.users.getUserList({ userId: newUserIds })).data;
	for (const u of users) {
		const uRole = u.publicMetadata.role as Role;
		if (!uRole || !RolePermissions[uRole].includes("contribute")) {
			throw new Error(`${u.fullName} does not have permission to contribute.`);
		}
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
		await prisma.$transaction(async (tx) => {
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
			} else if (!project.userIds.includes(userId)) {
				throw new Error("Unauthorized action.");
			} else if (deletedUserIds.includes(userId)) {
				throw new Error("Can't remove self from userIds");
			}

			const userIds = [...project.userIds.filter((id) => !deletedUserIds.includes(id)), ...newUserIds];

			await tx.project.update({
				where: {
					project_id
				},
				data: {
					userIds
				}
			});
		});

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
