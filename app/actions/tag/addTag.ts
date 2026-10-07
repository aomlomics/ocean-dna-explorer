"use server";

import type { TagModel } from "@/app/generated/prisma/models/Tag";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { TagOptionalDefaultsSchema } from "@/prisma/generated/zod";
import type { NetworkPacket } from "@/types/globals";
import { GLOBAL_SERVER_ERROR, RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function addTagAction(tag: Omit<TagModel, "id">): Promise<NetworkPacket> {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			return { statusMessage: "error", error: "Must be logged in." };
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			return { statusMessage: "error", error: "Invalid role." };
		}

		const parsedTag = TagOptionalDefaultsSchema.parse(tag);

		await prisma.tag.create({
			data: parsedTag
		});

		return { statusMessage: "success" };
	} catch (err: any) {
		console.error(err);

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		return { statusMessage: "error", error: GLOBAL_SERVER_ERROR };
	}
}
