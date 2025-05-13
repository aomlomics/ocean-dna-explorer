"use server";

import { prisma, stripSecureFields } from "@/app/helpers/prisma";
import { NetworkPacket } from "@/types/globals";

export default async function projectFindUniqueAction(project_id: string): Promise<NetworkPacket> {
	if (typeof project_id !== "string") {
		return { statusMessage: "error", error: "Argument must be string" };
	}

	try {
		const result = await prisma.project.findUnique({
			where: {
				project_id
			}
		});

		if (result) {
			stripSecureFields(result);
			return { statusMessage: "success", result };
		} else {
			return { statusMessage: "error", error: `Project with project_id of ${project_id} does not exist.` };
		}
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
