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
import { PrismaPromise } from "@prisma/client/runtime/client";
import { Attribution, Image } from "@/app/generated/prismaImages/client";

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

	let deleteDbImageOnError = false;
	try {
		const parsedImage = ImageOptionalDefaultsSchema.parse({ ...image, userId });
		let parsedAttribution;
		if (attribution) {
			parsedAttribution = AttributionOptionalDefaultsSchema.parse(attribution);
		}

		//create image and new attribution (if provided)
		const queries = [prismaImages.image.create({ data: parsedImage! })] as PrismaPromise<Image | Attribution>[];
		if (parsedAttribution) {
			queries.unshift(prismaImages.attribution.create({ data: parsedAttribution }));
			await prismaImages.$transaction(queries);
		} else {
			await queries[0];
		}
		deleteDbImageOnError = true;

		if (project_id) {
			await prisma.project.update({
				where: {
					project_id
				},
				data: {
					imageFileUrl_ODE: image.url
				}
			});
		}

		return { statusMessage: "success" };
	} catch (err: any) {
		await del(image.url);

		if (deleteDbImageOnError) {
			const queries = [prismaImages.image.delete({ where: { url: image.url } })] as PrismaPromise<
				Image | Attribution
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
			return { statusMessage: "error", error: prismaErr.error };
		} else {
			const error = err as Error;
			return { statusMessage: "error", error: error.message };
		}
	}
}
