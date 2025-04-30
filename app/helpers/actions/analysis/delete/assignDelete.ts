"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function assignDeleteAction(formData: FormData) {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const dbAssignments = JSON.parse(formData.get("del") as string);
	const assignmentChunks = [] as number[][];
	while (dbAssignments.length) {
		assignmentChunks.push(dbAssignments.splice(0, 30000));
	}

	//assignments
	console.log("assignments delete");
	await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
		for (const chunk of assignmentChunks) {
			await tx.assignment.deleteMany({
				where: {
					id: {
						in: chunk
					}
				}
			});
		}
	});

	return { message: "Success" };
}
