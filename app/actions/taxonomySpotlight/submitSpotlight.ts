"use server";

import { validateBlobs } from "@/app/helpers/withDb";
import { TaxonomySpotlightPartial } from "@/prisma/generated/zod";
import { AttributionPartial, ImagePartial } from "@/prismaImages/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

//TODO: handle submission
export default async function submitSpotlightAction(
	spotlight: TaxonomySpotlightPartial,
	image: ImagePartial,
	Attribution?: AttributionPartial
): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in." };
	}

	if (!role || !RolePermissions[role].includes("manageDatabase")) {
		return { statusMessage: "error", error: "Invalid role." };
	}

	if (!image || !image.url || typeof image.url !== "string") {
		return { statusMessage: "error", error: "File URL is missing from image." };
	}

	if (!(await validateBlobs([image.url]))) {
		return { statusMessage: "error", error: "File is not valid." };
	}

	try {
		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
