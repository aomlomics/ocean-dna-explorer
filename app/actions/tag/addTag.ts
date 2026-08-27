"use server";

import type { Tag } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { TagOptionalDefaultsSchema } from "@/prisma/generated/zod";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function addTagAction(tag: Omit<Tag, "id">): Promise<NetworkPacket> {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		const parsedTag = TagOptionalDefaultsSchema.parse(tag);

		await prisma.tag.create({
			data: parsedTag
		});

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
