"use server";

import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import type { AttributionModel, ImageModel } from "@/app/generated/prismaImages/models";
import { prisma } from "@/app/helpers/prisma";
import { prismaImages } from "@/app/helpers/prismaImages";
import { handlePrismaError } from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import { TaxonomySpotlightOptionalDefaultsSchema, type TaxonomySpotlightPartial } from "@/prisma/generated/zod";
import {
	AttributionOptionalDefaultsSchema,
	type AttributionPartial,
	ImageOptionalDefaultsSchema,
	type ImagePartial
} from "@/prismaImages/generated/zod";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import type { PrismaPromise } from "@prisma/client/runtime/client";
import { del } from "@vercel/blob";

export default async function submitSpotlightAction(
	project_id: TaxonomySpotlightModel["project_id"],
	spotlight: TaxonomySpotlightPartial,
	image?: ImagePartial,
	attribution?: AttributionPartial
): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in." };
	}

	if (!role || !RolePermissions[role].includes("contribute")) {
		return { statusMessage: "error", error: "Invalid role." };
	}

	let deleteImageOnError = false;
	let deleteDbImageOnError = false;

	async function handleImageDelete() {
		if (deleteImageOnError) {
			await del(image!.url!);
		}

		if (deleteDbImageOnError) {
			const queries = [prismaImages.image.delete({ where: { url: image!.url } })] as PrismaPromise<
				ImageModel | AttributionModel
			>[];
			if (attribution) {
				queries.push(prismaImages.attribution.delete({ where: { attributionTitle: attribution.attributionTitle } }));
				await prismaImages.$transaction(queries);
			} else {
				await queries[0];
			}
		}
	}

	try {
		const parsedSpotlight = TaxonomySpotlightOptionalDefaultsSchema.parse(spotlight);
		const parsedImage = image && ImageOptionalDefaultsSchema.parse({ ...image, userId, homePage: false });
		const parsedAttribution = attribution && AttributionOptionalDefaultsSchema.parse(attribution);

		const [dbProject, otherSpotlight, existingSpotlight] = await prisma.$transaction([
			prisma.project.findUnique({
				where: {
					project_id
				},
				select: {
					userIds: true
				}
			}),
			prisma.taxonomySpotlight.findUnique({
				where: {
					project_id_taxonomy: {
						project_id: parsedSpotlight.project_id,
						taxonomy: parsedSpotlight.taxonomy
					}
				},
				select: {
					id: true
				}
			}),
			prisma.taxonomySpotlight.findUnique({
				where: {
					project_id_taxonomy: {
						project_id,
						taxonomy: parsedSpotlight.taxonomy
					}
				},
				select: {
					id: true
				}
			})
		]);

		if (!dbProject) {
			return { statusMessage: "error", error: `Project with project_id of "${spotlight.project_id}" does not exist.` };
		} else if (!dbProject.userIds.includes(userId)) {
			return {
				statusMessage: "error",
				error: `Permission denied for adding Taxonomy Spotlight to Project with project_id of "${spotlight.project_id}". Please contact submission owner with a request to be added to the Project.`
			};
		}

		if (image) {
			if (!image.url || typeof image.url !== "string") {
				return { statusMessage: "error", error: "File URL is missing from image." };
			}

			if (!(await validateBlobs([image.url]))) {
				return { statusMessage: "error", error: "File is not valid." };
			}

			deleteImageOnError = true;

			if (existingSpotlight) {
				await handleImageDelete();
				return {
					statusMessage: "error",
					error: `A Taxonomy Spotlight for the taxonomy "${parsedSpotlight.taxonomy}" already exists for the project "${project_id}".`
				};
			}

			//create image and new attribution (if provided)
			const queries = [prismaImages.image.create({ data: parsedImage! })] as PrismaPromise<
				ImageModel | AttributionModel
			>[];
			if (parsedAttribution) {
				queries.unshift(prismaImages.attribution.create({ data: parsedAttribution }));
				await prismaImages.$transaction(queries);
			} else {
				await queries[0];
			}

			deleteDbImageOnError = true;
		} else if (!otherSpotlight) {
			return {
				statusMessage: "error",
				error: `Selected pre-existing Taxonomy Spotlight with project_id of "${parsedSpotlight.project_id}" and taxonomy of "${parsedSpotlight.taxonomy}" does not exist.`
			};
		}

		await prisma.taxonomySpotlight.create({
			data: { ...parsedSpotlight, project_id }
		});

		return { statusMessage: "success" };
	} catch (err: any) {
		await handleImageDelete();

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return { statusMessage: "error", error: prismaErr.error };
		}

		console.error(err);
		return { statusMessage: "error", error: "An unknown server error occurred." };
	}
}
