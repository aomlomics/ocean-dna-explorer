"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export default async function projectUpdateUserIdsAction(
	target: string,
	newUserIds: string[],
	deletedUserIds: string[]
): Promise<NetworkPacket> {
	const { userId } = await auth();

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
		const error = await prisma.$transaction(async (tx) => {
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
			} else if (!project.userIds.includes(userId)) {
				return "Unauthorized action.";
			} else if (deletedUserIds.includes(userId)) {
				return "Can't remove self from userIds";
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

		if (error) {
			return { statusMessage: "error", error };
		}

		return { statusMessage: "success" };
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
