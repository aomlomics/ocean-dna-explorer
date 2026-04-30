"use server";

import { Project } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

export default async function projectUpdateImageAction(
	target: Project["project_id"],
	imageFileUrl_ODE: Project["imageFileUrl_ODE"]
): Promise<NetworkPacket> {
	if (imageFileUrl_ODE) {
		const validBlob = await validateBlobs([imageFileUrl_ODE]);
		if (!validBlob) {
			return { statusMessage: "error", error: "File is invalid" };
		}
	}

	const { userId } = await auth();

	if (!userId) {
		if (imageFileUrl_ODE) {
			await del(imageFileUrl_ODE);
		}
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = ProjectSchema.shape.project_id.safeParse(target);
	if (!parsed.success) {
		if (imageFileUrl_ODE) {
			await del(imageFileUrl_ODE);
		}
		//TODO: make more specific, since the schema is only a string, and not an object
		return {
			statusMessage: "error",
			error: parsed.error.issues ? parsed.error.issues.map((issue) => issue.message).join(" ") : "Invalid project_id"
		};
	}
	const project_id = parsed.data;

	try {
		await prisma.$transaction(async (tx) => {
			const dbProject = await tx.project.findUnique({
				where: {
					project_id
				},
				select: {
					imageFileUrl_ODE: true,
					userIds: true
				}
			});

			if (!dbProject) {
				throw new Error(`Project with project_id of "${project_id}" was not found.`);
			} else if (!dbProject.userIds.includes(userId)) {
				throw new Error("Unauthorized action.");
			}

			await tx.project.update({
				where: {
					project_id
				},
				data: {
					imageFileUrl_ODE
				}
			});

			if (dbProject.imageFileUrl_ODE) {
				await del(dbProject.imageFileUrl_ODE);
			}
		});

		return { statusMessage: "success" };
	} catch (err: any) {
		if (imageFileUrl_ODE) {
			await del(imageFileUrl_ODE);
		}

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
