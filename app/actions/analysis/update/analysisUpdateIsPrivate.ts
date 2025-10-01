"use server";

import { Analysis } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { AnalysisSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export default async function analysisUpdateIsPrivateAction(
	target: Analysis["analysis_run_name"],
	isPrivate: Analysis["isPrivate"]
): Promise<NetworkPacket> {
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
		await prisma.$transaction(async (tx) => {
			const analysis = await tx.analysis.findUnique({
				where: {
					analysis_run_name
				},
				select: {
					Project: {
						select: {
							isPrivate: true,
							userIds: true
						}
					}
				}
			});

			if (!analysis) {
				throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
			} else if (!analysis.Project.userIds.includes(userId)) {
				throw new Error("Unauthorized action.");
			}

			if (analysis.Project.isPrivate && isPrivate === false) {
				return "Analysis cannot be made public because parent Project is private. You must first make the parent Project public before making this Analysis public.";
			}

			await tx.analysis.update({
				where: {
					analysis_run_name
				},
				data: {
					isPrivate
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
