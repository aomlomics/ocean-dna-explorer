"use server";

import type { Project } from "@/app/generated/prisma/client";
import type { Attribution } from "@/app/generated/prismaImages/client";
import { prisma } from "@/app/helpers/prisma";
import { prismaImages } from "@/app/helpers/prismaImages";
import { handlePrismaError } from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import { ProjectSchema } from "@/prisma/generated/zod";
import {
	type AttributionOptionalDefaults,
	AttributionOptionalDefaultsSchema,
	type Image,
	type ImageOptionalDefaults,
	ImageOptionalDefaultsSchema
} from "@/prismaImages/generated/zod";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

export default async function projectUpdateImageAction(
	target: Project["project_id"],
	imageInfo: { image: ImageOptionalDefaults; attribution?: AttributionOptionalDefaults } | null
): Promise<NetworkPacket> {
	if (imageInfo) {
		const validBlob = await validateBlobs([imageInfo.image.url]);
		if (!validBlob) {
			return { statusMessage: "error", error: "File is invalid" };
		}
	}

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		if (imageInfo?.image.url) {
			await del(imageInfo.image.url);
		}
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = ProjectSchema.shape.project_id.safeParse(target);
	if (!parsed.success) {
		if (imageInfo?.image.url) {
			await del(imageInfo.image.url);
		}
		//TODO: make more specific, since the schema is only a string, and not an object
		return {
			statusMessage: "error",
			error: parsed.error.issues ? parsed.error.issues.map((issue) => issue.message).join(" ") : "Invalid project_id"
		};
	}
	const project_id = parsed.data;

	const dbProject = await prisma.project.findUnique({
		where: {
			project_id
		},
		select: {
			imageFileUrl_ODE: true,
			userIds: true
		}
	});

	if (!dbProject) {
		return { statusMessage: "error", error: `Project with project_id of "${project_id}" was not found.` };
	} else if (!dbProject.userIds.includes(userId)) {
		return { statusMessage: "error", error: "Unauthorized action." };
	}

	let deletedImage = undefined as Image | undefined;
	let parsedImage = undefined as Image | undefined;
	let parsedAttribution = undefined as Attribution | undefined;
	try {
		if (imageInfo) {
			if (imageInfo.image.homePage) {
				return { statusMessage: "error", error: "Not allowed to submit home page images." };
			} else {
				imageInfo.image.homePage = false;
			}
			imageInfo.image.userId = userId;
			parsedImage = ImageOptionalDefaultsSchema.parse(imageInfo.image) as Image;

			parsedAttribution =
				imageInfo.attribution && (AttributionOptionalDefaultsSchema.parse(imageInfo.attribution) as Attribution);

			await prismaImages.$transaction(async (tx) => {
				if (dbProject.imageFileUrl_ODE) {
					deletedImage = (await tx.image.findUnique({
						where: {
							url: dbProject.imageFileUrl_ODE
						}
					})) as Image;

					await tx.image.delete({
						where: {
							url: dbProject.imageFileUrl_ODE
						}
					});
				}

				if (parsedAttribution) {
					await tx.attribution.create({
						data: parsedAttribution
					});
				}

				await tx.image.create({
					data: parsedImage as Image
				});
			});
		} else {
			await prismaImages.$transaction(async (tx) => {
				if (dbProject.imageFileUrl_ODE) {
					deletedImage = (await tx.image.findUnique({
						where: {
							url: dbProject.imageFileUrl_ODE
						}
					})) as Image;

					await tx.image.delete({
						where: {
							url: dbProject.imageFileUrl_ODE
						}
					});
				}
			});
		}
	} catch (err: any) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}

	try {
		await prisma.$transaction(async (tx) => {
			await tx.project.update({
				where: {
					project_id
				},
				data: {
					imageFileUrl_ODE: imageInfo ? imageInfo.image.url : null
				}
			});

			if (dbProject.imageFileUrl_ODE) {
				await del(dbProject.imageFileUrl_ODE);
			}
		});

		return { statusMessage: "success" };
	} catch (err: any) {
		if (imageInfo?.image.url) {
			await del(imageInfo.image.url);
		}

		await prismaImages.$transaction([
			...(deletedImage
				? [
						prismaImages.image.create({
							data: deletedImage
						})
					]
				: []),
			...(parsedAttribution
				? [
						prismaImages.attribution.delete({
							where: {
								attributionTitle: parsedAttribution.attributionTitle
							}
						})
					]
				: []),
			...(parsedImage
				? [
						prismaImages.image.delete({
							where: {
								url: parsedImage.url
							}
						})
					]
				: [])
		]);

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
