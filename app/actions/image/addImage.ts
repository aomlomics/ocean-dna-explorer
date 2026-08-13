"use server";

import { AttributionOptionalDefaultsSchema, ImageOptionalDefaultsSchema } from "@/prismaImages/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { prismaImages } from "@/app/helpers/prismaImages";
import { del } from "@vercel/blob";
import { validateBlobs } from "@/app/helpers/withDb";
import { Project, Taxonomy } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import { handlePrismaError } from "@/app/helpers/queries";
import { AttributionCreateInput, ImageCreateInput } from "@/app/generated/prismaImages/models";

export default async function addImageAction(
	formData: FormData,
	newAttribution: boolean,
	target?: { table: "project"; value: Project["project_id"] } | { table: "taxonomy"; value: Taxonomy["taxonomy"] }
): Promise<NetworkPacket> {
	const url = formData.get("url");
	if (url && typeof url === "string") {
		const validBlob = await validateBlobs([url]);
		if (!validBlob) {
			return { statusMessage: "error", error: "File is not valid" };
		}
	}

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		return { statusMessage: "error", error: "Must be logged in." };
	}

	if (!role || !RolePermissions[role].includes("manageDatabase")) {
		return { statusMessage: "error", error: "Invalid role." };
	}

	if (target) {
		if (!DataTableNames.includes(target.table)) {
			return { statusMessage: "error", error: `Table with name of "${target.table}" does not exist.` };
		}
	}

	let attribution = undefined as undefined | AttributionCreateInput;
	let image = undefined as undefined | ImageCreateInput;
	try {
		const formObj = Object.fromEntries(formData) as Record<string, any>;
		for (const key in formObj) {
			if (formObj[key] === "") {
				delete formObj[key];
			}
		}
		if (formObj.homePage && formObj.homePage === "true") {
			formObj.homePage = true;
		} else {
			formObj.homePage = false;
		}
		formObj.userId = userId;

		image = ImageOptionalDefaultsSchema.parse(formObj);
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
				data: image as ImageCreateInput
			});
		});
	} catch (err: any) {
		if (url && typeof url === "string") {
			await del(url);
		}

		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return { statusMessage: "error", error: prismaErr.error };
		} else {
			const error = err as Error;
			return { statusMessage: "error", error: error.message };
		}
	}

	if (target) {
		try {
			//@ts-expect-error dynamically accessing table
			await prisma[target.table].update({
				where: {
					[TableMetadata[target.table].titleField as string]: target.value
				},
				data: {
					imageFileUrl_ODE: url
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
