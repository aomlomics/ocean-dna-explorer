"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/helpers/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
					editHistory: true,
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

			await tx.project.update({
				where: {
					project_id
				},
				data: {
					//make changes to project
					...Object.fromEntries(formData),
					//replace changed fields in userDefined with new values
					userDefined: {
						//keep previous user defined data
						...project.userDefined,
						//override any changed fields
						...Array.from(formData.entries()).reduce((acc, [field, value]) => {
							if (project.userDefined && field.startsWith("userDefined")) {
								const userDefinedField = field.split(":")[1];
								if (userDefinedField in project.userDefined) {
									acc[userDefinedField] = value as string;
								}
							}

							return acc;
						}, {} as PrismaJson.UserDefinedType)
					},
					//add edit to edit history
					editHistory: project.editHistory.concat({
						dateEdited: new Date(),
						changes: Array.from(formData.entries()).map(([field, value]) => {
							if (field.startsWith("userDefined") && project.userDefined) {
								const userDefinedField = field.split(":")[1];
								return {
									field: userDefinedField,
									oldValue: project.userDefined[userDefinedField] || "",
									newValue: value as string
								};
							} else {
								return {
									field,
									oldValue: project[field as keyof typeof project]?.toString() || "",
									newValue: value.toString()
								};
							}
						})
					})
				}
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
