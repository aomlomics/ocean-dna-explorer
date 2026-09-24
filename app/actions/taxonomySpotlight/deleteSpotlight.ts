"use server";

import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import { prisma } from "@/app/helpers/prisma";
import { prismaImages } from "@/app/helpers/prismaImages";
import { handlePrismaError } from "@/app/helpers/queries";
import type { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

export default async function deleteSpotlightAction(
	project_id: TaxonomySpotlightModel["project_id"],
	taxonomy: TaxonomySpotlightModel["taxonomy"]
): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in." };
	}

	if (!role || !RolePermissions[role].includes("contribute")) {
		return { statusMessage: "error", error: "Invalid role." };
	}

	try {
		const spotlight = await prisma.taxonomySpotlight.findUnique({
			where: {
				project_id_taxonomy: {
					project_id,
					taxonomy
				}
			},
			select: {
				imageFileUrl_ODE: true,
				Project: {
					select: {
						userIds: true
					}
				}
			}
		});

		if (!spotlight) {
			return {
				statusMessage: "error",
				error: `Taxonomy Spotlight with project_id of "${project_id}" and taxonomy of "${taxonomy}" does not exist.`
			};
		} else if (!spotlight.Project.userIds.includes(userId)) {
			return {
				statusMessage: "error",
				error: `Permission denied for deleting Taxonomy Spotlight on the Project with project_id of "${project_id}".`
			};
		}

		const [, existingSpotlights] = await prisma.$transaction([
			prisma.taxonomySpotlight.delete({
				where: {
					project_id_taxonomy: {
						project_id,
						taxonomy
					}
				}
			}),
			prisma.taxonomySpotlight.count({
				where: {
					imageFileUrl_ODE: spotlight.imageFileUrl_ODE
				}
			})
		]);

		if (!existingSpotlights) {
			await prismaImages.image.delete({
				where: {
					url: spotlight.imageFileUrl_ODE
				}
			});
			await del(spotlight.imageFileUrl_ODE);
		}

		return { statusMessage: "success" };
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return { statusMessage: "error", error: prismaErr.error };
		}

		console.error(err);
		return { statusMessage: "error", error: "An unknown server error occurred." };
	}
}
