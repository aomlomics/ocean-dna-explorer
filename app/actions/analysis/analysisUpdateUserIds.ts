"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { AnalysisSchema, ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export default async function analysisUpdateUserIdsAction(target: string, userIds: string[]): Promise<NetworkPacket> {
	const { userId } = await auth();

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
		const error = await prisma.$transaction(async (tx) => {
			const analysis = await tx.analysis.findUnique({
				where: {
					analysis_run_name
				},
				select: {
					userIds: true
				}
			});

			if (!analysis) {
				return `No Analysis with analysis_run_name of '${analysis_run_name}' found.`;
			} else if (!analysis.userIds.includes(userId)) {
				return "Unauthorized action.";
			} else if (!userIds.includes(userId)) {
				return "Can't remove self from userIds";
			}

			await tx.analysis.update({
				where: {
					analysis_run_name
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
