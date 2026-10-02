"use server";

import { auth } from "@clerk/nextjs/server";
import { GLOBAL_SERVER_ERROR, RolePermissions } from "@/types/objects";
import type { NetworkPacket } from "@/types/globals";
import { prismaImages } from "@/app/helpers/prismaImages";
import { del } from "@vercel/blob";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";

export default async function deleteImageAction(id: number): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId || !role) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	try {
		// Find image to get its blob URL
		const image = await prismaImages.image.findUnique({
			where: {
				id
			},
			select: {
				url: true
			}
		});
		if (!image) {
			return { statusMessage: "error", error: "Image not found" };
		}

		// Check if image is tied to submission
		const projects = await prisma.project.findMany({
			where: {
				imageFileUrl_ODE: image.url
			},
			select: {
				userIds: true
			}
		});

		//TODO: check taxonomy spotlights
		if (projects.length) {
			if (!RolePermissions[role].includes("contribute")) {
				return { statusMessage: "error", error: "Image not found" };
			}
		} else {
			if (!RolePermissions[role].includes("manageDatabase")) {
				return { statusMessage: "error", error: "Image not found" };
			}
		}

		// Delete blob first; if this fails, abort
		if (image.url) {
			await del(image.url);
		}

		// Remove DB record
		await prismaImages.image.delete({ where: { id } });

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
