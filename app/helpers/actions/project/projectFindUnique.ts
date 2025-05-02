"use server";

import { prisma } from "../../prisma";
import { NetworkPacket } from "@/types/globals";

export default async function projectFindUniqueAction(project_id: string): Promise<NetworkPacket> {
	try {
		const project = await prisma.project.findUnique({
			where: {
				project_id
			}
		});

		if (project) {
			return { statusMessage: "success", result: project };
		} else {
			return { statusMessage: "error", error: `Project with project_id of ${project_id} does not exist.` };
		}
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
