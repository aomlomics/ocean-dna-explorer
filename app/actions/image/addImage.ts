"use server";

import {
	AttributionOptionalDefaults,
	AttributionOptionalDefaultsSchema,
	ImageOptionalDefaultsSchema
} from "@/prismaImages/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { prismaImages } from "@/app/helpers/prismaImages";

export default async function addImageAction(formData: FormData, newAttribution: boolean): Promise<NetworkPacket> {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		const formObj = Object.fromEntries(formData.entries());
		for (const key in formObj) {
			if (formObj[key] === "") {
				delete formObj[key];
			}
		}
		const image = ImageOptionalDefaultsSchema.parse(formObj);
		let attribution = undefined as undefined | AttributionOptionalDefaults;
		if (newAttribution) {
			attribution = AttributionOptionalDefaultsSchema.parse(formObj);
		}

		await prismaImages.$transaction(async (tx) => {
			if (attribution) {
				await tx.attribution.create({
					data: attribution
				});
			}

			await tx.image.create({
				data: image
			});
		});

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
