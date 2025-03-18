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
					...(Array.from(formData.keys()).reduce((acc, field) => {
						if (field.startsWith("userDefined") && !acc.userDefined) {
							acc.userDefined = true;
						} else {
							acc[field] = true;
						}

						return acc;
					}, {} as Record<string, true>) as Prisma.ProjectSelect)
				}
			});

			if (!project) {
				return `No project with project_id of '${project_id}' found.`;
			} else if (userId !== project.userId) {
				return "Unauthorized action. You are not the owner of this project.";
			}

			await tx.edit.create({
				data: {
					project_id,
					changes: Array.from(formData.entries()).reduce((acc, [field, value]) => {
						if (field.startsWith("userDefined") && project.userDefined) {
							const userDefinedField = field.split(":")[1];
							acc.push({
								field: userDefinedField,
								oldValue: project.userDefined[userDefinedField] || "",
								newValue: value as string
							});
						} else {
							acc.push({
								field,
								oldValue: project[field as keyof typeof project]?.toString() || "",
								newValue: value.toString()
							});
						}

						return acc;
					}, [] as PrismaJson.ChangesType)
				},
				select: {
					id: true
				}
			});

			//replace changed fields in userDefined to new values
			const userDefined = { ...project.userDefined };
			if (userDefined) {
				for (const entry of formData.entries()) {
					if (entry[0].startsWith("userDefined")) {
						const userDefinedField = entry[0].split(":")[1];
						if (userDefinedField in userDefined) {
							userDefined[userDefinedField] = entry[1] as string;
						}
					}
				}
			}

			await tx.project.update({
				where: {
					project_id
				},
				//@ts-ignore potential issue with JSON field userDefined
				data: ProjectPartialSchema.parse(
					{ ...Object.fromEntries(formData), userDefined },
					{
						errorMap: (error, ctx) => {
							return { message: `AnalysisSchema: ${ctx.defaultError}` };
						}
					}
				)
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
