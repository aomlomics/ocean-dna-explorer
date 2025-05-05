"use server";

import { prisma } from "@/app/helpers/prisma";
import { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export default async function assignDeleteAction(formData: FormData): Promise<NetworkPacket> {
	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (!(formData instanceof FormData)) {
		return { statusMessage: "error", error: "Argument must be FormData" };
	}
	//TODO: use zod to validate the shape of the formData

	const dbAssignments = JSON.parse(formData.get("del") as string);
	const assignmentChunks = [] as number[][];
	while (dbAssignments.length) {
		assignmentChunks.push(dbAssignments.splice(0, 30000));
	}

	//assignments
	console.log("assignments delete");
	await prisma.$transaction(async (tx) => {
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

	return { statusMessage: "success" };
}
