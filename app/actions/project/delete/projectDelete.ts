"use server";

import { Project } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

export default async function projectDeleteAction(target: Project["project_id"]): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (!role || !RolePermissions[role].includes("manageUsers")) {
		throw new Error("Unauthorized action.");
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
		const dbProject = await prisma.project.findUnique({
			where: {
				project_id
			},
			select: {
				userIds: true,
				imageFileUrl_ODE: true,
				projectMetadataFileUrl_ODE: true,
				sampleMetadataFileUrl_ODE: true,
				libraryMetadataFileUrl_ODE: true,
				Analyses: {
					select: {
						analysisMetadataFileUrl_ODE: true,
						asvFileUrl_ODE: true,
						occurrenceFileUrl_ODE: true
					}
				}
			}
		});

		if (!dbProject) {
			throw new Error(`No Project with project_id of "${project_id}" found.`);
		} else if (!dbProject.userIds.includes(userId)) {
			throw new Error("Unauthorized action.");
		}

		await prisma.project.delete({
			where: {
				project_id
			}
		});

		//delete files
		const delArr = [
			dbProject.projectMetadataFileUrl_ODE,
			dbProject.sampleMetadataFileUrl_ODE,
			dbProject.libraryMetadataFileUrl_ODE
		];
		if (dbProject.imageFileUrl_ODE) {
			delArr.push(dbProject.imageFileUrl_ODE);
		}
		for (const a of dbProject.Analyses) {
			delArr.push(a.analysisMetadataFileUrl_ODE, a.asvFileUrl_ODE, a.occurrenceFileUrl_ODE);
		}
		await del(delArr);

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
