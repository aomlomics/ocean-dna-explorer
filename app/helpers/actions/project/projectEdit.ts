"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../prisma";
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

	try {
		await prisma.project.update({
			where: {
				project_id
			},
			data: Object.fromEntries(formData)
		});

		revalidatePath("/explore");
		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
