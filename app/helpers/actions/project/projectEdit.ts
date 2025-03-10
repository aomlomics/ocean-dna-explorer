"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ProjectPartialSchema } from "@/prisma/generated/zod";

export default async function projectEditAction(formData: FormData) {
	console.log("project edit");

	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const project_id = formData.get("target") as string;
	if (!project_id) {
		return { message: "error", error: "No target specified" };
	}
	formData.delete("target");

	//TODO: validate all fields are valid project fields

	try {
		const error = await prisma.$transaction(async (tx) => {
			const project = await tx.project.findUnique({
				where: {
					project_id
				},
				select: {
					userId: true,
					...(Array.from(formData.keys()).reduce(
						(acc, field) => ({ ...acc, [field]: true }),
						{}
					) as Prisma.ProjectSelect)
				}
			});

			if (!project) {
				return `No project with project_id of '${project_id}' found.`;
			} else if (userId !== project.userId) {
				return "Unauthorized action. You are not the owner of this project.";
			}

			const edit = await tx.edit.create({
				data: {
					project_id
				},
				select: {
					id: true
				}
			});

			await tx.change.createMany({
				data: Array.from(formData.entries()).map(([field, value]) => ({
					editId: edit.id,
					field,
					oldValue: project[field as keyof typeof project] ? project[field as keyof typeof project]!.toString() : "",
					newValue: value.toString()
				}))
			});

			await tx.project.update({
				where: {
					project_id
				},
				data: ProjectPartialSchema.parse(Object.fromEntries(formData), {
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
