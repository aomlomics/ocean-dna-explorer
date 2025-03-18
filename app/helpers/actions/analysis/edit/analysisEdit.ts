"use server";

import { prisma } from "@/app/helpers/prisma";
import { AnalysisPartialSchema } from "@/prisma/generated/zod";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export default async function analysisEditAction(formData: FormData) {
	console.log("analysis edit");

	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const analysis_run_name = formData.get("target") as string;
	if (!analysis_run_name) {
		return { message: "error", error: "No target specified" };
	}
	formData.delete("target");

	//TODO: validate all fields are valid analysis fields

	try {
		const error = await prisma.$transaction(async (tx) => {
			const analysis = await tx.analysis.findUnique({
				where: {
					analysis_run_name
				},
				select: {
					userId: true,
					...(Array.from(formData.keys()).reduce(
						(acc, field) => ({ ...acc, [field]: true }),
						{}
					) as Prisma.AnalysisSelect)
				}
			});

			if (!analysis) {
				return `No analysis with analysis_run_name of '${analysis_run_name}' found.`;
			} else if (userId !== analysis.userId) {
				return "Unauthorized action. You are not the owner of this analysis.";
			}

			await tx.edit.create({
				data: {
					analysis_run_name,
					changes: Array.from(formData.entries()).map(([field, value]) => ({
						field,
						oldValue: analysis[field as keyof typeof analysis]
							? analysis[field as keyof typeof analysis]!.toString()
							: "",
						newValue: value.toString()
					}))
				},
				select: {
					id: true
				}
			});

			await tx.analysis.update({
				where: {
					analysis_run_name
				},
				data: AnalysisPartialSchema.parse(Object.fromEntries(formData), {
					errorMap: (error, ctx) => {
						return { message: `AnalysisSchema: ${ctx.defaultError}` };
					}
				})
			});
		});

		if (error) {
			return { message: "Error", error };
		}

		revalidatePath("/explore");
		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
