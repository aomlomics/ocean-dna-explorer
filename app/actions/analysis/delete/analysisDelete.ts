"use server";

import { Analysis } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { AnalysisSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import z from "zod";

export default async function analysisDeleteAction(
	targetProject: Analysis["project_id"],
	targetAnalysis: Analysis["analysis_run_name"]
): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (
		!userId ||
		!role ||
		!(RolePermissions[role].includes("contribute") || RolePermissions[role].includes("manageUsers"))
	) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = z
		.object({
			project_id: AnalysisSchema.shape.project_id,
			analysis_run_name: AnalysisSchema.shape.analysis_run_name
		})
		.safeParse({ project_id: targetProject, analysis_run_name: targetAnalysis });
	if (!parsed.success) {
		//TODO: make more specific, since the schema is only a string, and not an object
		return {
			statusMessage: "error",
			error: parsed.error.issues
				? parsed.error.issues.map((issue) => issue.message).join(" ")
				: "Invalid analysis_run_name"
		};
	}
	const project_id = parsed.data.project_id;
	const analysis_run_name = parsed.data.analysis_run_name;

	try {
		const analysis = await prisma.analysis.findUnique({
			where: {
				project_id_analysis_run_name: {
					project_id,
					analysis_run_name
				}
			},
			select: {
				editHistory: true,
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
		} else if (!analysis.Project.userIds.includes(userId) || !RolePermissions[role].includes("manageUsers")) {
			throw new Error("Unauthorized action.");
		}

		await prisma.analysis.delete({
			where: {
				project_id_analysis_run_name: {
					project_id,
					analysis_run_name
				}
			}
		});

		await del([
			analysis.analysisMetadataFileUrl_ODE,
			analysis.asvFileUrl_ODE,
			analysis.occurrenceFileUrl_ODE,
			...(analysis.editHistory?.flatMap((edit) => edit.changes.map((c) => c.oldValue)) || [])
		]);

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
