"use server";

import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
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

	try {
		await prisma.analysis.update({
			where: {
				analysis_run_name
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
