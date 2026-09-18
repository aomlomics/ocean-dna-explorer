"use server";

import {
	AttributionOptionalDefaultsSchema,
	type AttributionPartial,
	ImageOptionalDefaultsSchema,
	type ImagePartial
} from "@/prismaImages/generated/zod";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { prismaImages } from "@/app/helpers/prismaImages";
import { del } from "@vercel/blob";
import { validateBlobs } from "@/app/helpers/withDb";
import type { ProjectModel, TaxonomyModel } from "@/app/generated/prisma/models";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import type { AttributionModel, ImageModel } from "@/app/generated/prismaImages/models";
import type { PrismaPromise } from "@prisma/client/runtime/client";
import TableMetadata from "@/types/tableMetadata";

export default async function addImageAction({
	image,
	attribution,
	target
}: {
	image: ImagePartial;
	attribution?: AttributionPartial;
	target?:
		{ table: "project"; value: ProjectModel["project_id"] } | { table: "taxonomy"; value: TaxonomyModel["taxonomy"] };
}): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in." };
	}

	if (
		!role ||
		(!target && !RolePermissions[role].includes("manageDatabase")) ||
		(target && !RolePermissions[role].includes("contribute"))
	) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (!image || !image.url || typeof image.url !== "string") {
		return { statusMessage: "error", error: "File URL is missing from image." };
	}

	if (!(await validateBlobs([image.url]))) {
		return { statusMessage: "error", error: "File is not valid." };
	}

	let deleteDbImageOnError = false;
	try {
		const parsedImage = ImageOptionalDefaultsSchema.parse({ ...image, userId });
		let parsedAttribution;
		if (attribution) {
			parsedAttribution = AttributionOptionalDefaultsSchema.parse(attribution);
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
	} catch (err: any) {
		await del(image.url);

		if (deleteDbImageOnError) {
			const queries = [prismaImages.image.delete({ where: { url: image.url } })] as PrismaPromise<
				ImageModel | AttributionModel
			>[];
			if (attribution) {
				queries.push(prismaImages.attribution.delete({ where: { attributionTitle: attribution.attributionTitle } }));
				await prismaImages.$transaction(queries);
			} else {
				await queries[0];
			}
		}

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		console.error(err);
		return { statusMessage: "error", error: "An unknown server error occurred." };
	}

	if (target) {
		try {
			//@ts-expect-error dynamically accessing prisma client
			await prisma[target.table].update({
				where: {
					[TableMetadata[target.table].titleField as string]: target.value
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
				return prismaErr;
			}

			console.error(err);
			return { statusMessage: "error", error: "An unknown server error occurred." };
		}
	}

	return { statusMessage: "success" };
}
