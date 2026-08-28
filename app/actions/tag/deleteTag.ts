"use server";

import type { TagModel } from "@/app/generated/prisma/models/Tag";
import { prisma } from "@/app/helpers/prisma";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function deleteTagAction(id: TagModel["id"]): Promise<NetworkPacket> {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		await prisma.tag.delete({
			where: {
				id
			}
		});

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
