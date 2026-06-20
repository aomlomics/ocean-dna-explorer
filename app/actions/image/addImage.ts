"use server";

import {
	AttributionOptionalDefaultsSchema,
	AttributionPartial,
	ImageOptionalDefaultsSchema,
	ImagePartial
} from "@/prismaImages/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { prismaImages } from "@/app/helpers/prismaImages";
import { del } from "@vercel/blob";
import { validateBlobs } from "@/app/helpers/withDb";
import { Project } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { AttributionCreateInput, ImageCreateInput } from "@/app/generated/prismaImages/models";

export default async function addImageAction({
	image,
	attribution,
	project_id
}: {
	image: ImagePartial;
	attribution?: AttributionPartial;
	project_id?: Project["project_id"];
}): Promise<NetworkPacket> {
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

	let parsedAttribution = undefined as undefined | AttributionCreateInput;
	let parsedImage = undefined as undefined | ImageCreateInput;
	try {
		parsedImage = ImageOptionalDefaultsSchema.parse({ ...image, userId });
		if (attribution) {
			parsedAttribution = AttributionOptionalDefaultsSchema.parse(attribution);
		}

		await prismaImages.$transaction(async (tx) => {
			if (parsedAttribution) {
				await tx.attribution.create({
					data: parsedAttribution
				});
			}

			await tx.image.create({
				data: parsedImage!
			});
		});
	} catch (err: any) {
		await del(image.url);

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return { statusMessage: "error", error: prismaErr.error };
		} else {
			const error = err as Error;
			return { statusMessage: "error", error: error.message };
		}
	}

	if (project_id) {
		try {
			await prisma.project.update({
				where: {
					project_id
				},
				data: {
					imageFileUrl_ODE: image.url
				}
			});
		} catch (err: any) {
			await prismaImages.$transaction(async (tx) => {
				if (attribution) {
					await tx.attribution.delete({
						where: {
							attributionTitle: attribution.attributionTitle
						}
					});
				}

				await tx.image.delete({
					where: {
						url: image.url
					}
				});
			});

			const prismaErr = handlePrismaError(err);
			if (prismaErr) {
				return { statusMessage: "error", error: prismaErr.error };
			} else {
				const error = err as Error;
				return { statusMessage: "error", error: error.message };
			}
		}
	}

	return { statusMessage: "success" };
}
