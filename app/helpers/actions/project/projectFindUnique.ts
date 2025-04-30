"use server";

import { Project } from "@/app/generated/prisma/client";
import { prisma } from "../../prisma";

export default async function projectFindUniqueAction(
	project_id: string
): Promise<{ message: string; project?: Project; error?: string }> {
	try {
		const project = await prisma.project.findUnique({
			where: {
				project_id
			}
		});

		if (project) {
			return { message: "Success", project };
		} else {
			return { message: "Error", error: `Project with project_id of ${project_id} does not exist.` };
		}
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
