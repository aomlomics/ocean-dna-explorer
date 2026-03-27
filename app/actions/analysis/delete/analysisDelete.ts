"use server";

import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { AnalysisSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

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
		const analysis = await prisma.analysis.findUnique({
			where: {
				analysis_run_name
			},
			select: {
				analysisMetadataFileUrl_ODE: true,
				asvFileUrl_ODE: true,
				occurrenceFileUrl_ODE: true,
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

		await prisma.analysis.delete({
			where: {
				analysis_run_name
			}
		});

		await del([analysis.analysisMetadataFileUrl_ODE, analysis.asvFileUrl_ODE, analysis.occurrenceFileUrl_ODE]);

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
