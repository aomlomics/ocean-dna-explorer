"use server";

import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { NetworkPacket } from "@/types/globals";
import { prismaImages } from "@/app/helpers/prismaImages";
import { del } from "@vercel/blob";

export default async function deleteImageAction(imageId: number): Promise<NetworkPacket> {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			throw new Error("Must be logged in.");
		}
		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		// Find image to get its blob URL
		const image = await prismaImages.image.findUnique({ where: { id: imageId } });
		if (!image) {
			return { statusMessage: "error", error: "Image not found" };
		}

		// Delete blob first; if this fails, abort
		if (image.url) {
			await del(image.url);
		}

		// Remove DB record
		await prismaImages.image.delete({ where: { id: imageId } });

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
} 