"use server";

import { Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { RoleHeirarchy, RolePermissions, Roles } from "@/types/objects";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/app/helpers/prisma";
import { Prisma } from "@/app/generated/prisma/client";

async function editRole(
	targetUserId: string,
	options: { action: "editRole"; newRole: Role | null } | { action: "delete" | "ban" | "unban" },
	preAction?: () => Promise<void>
) {
	const client = await clerkClient();

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;
	if (!userId) {
		throw new Error("Unauthorized");
	}

	if (targetUserId === userId) {
		throw new Error("Can't edit own role");
	}

	if (!role || !RolePermissions[role].includes("manageUsers")) {
		throw new Error("Not authorized");
	}

	//TODO: fix potential race condition
	const user = await client.users.getUser(targetUserId);
	if (!role || !RoleHeirarchy[role].includes(user.publicMetadata.role as Role)) {
		throw new Error("Not authorized");
	}

	if (preAction) {
		await preAction();
	}

	if (options.action === "editRole") {
		await client.users.updateUserMetadata(targetUserId, {
			publicMetadata: { role: options.newRole }
		});
	} else if (options.action === "delete") {
		await client.users.deleteUser(targetUserId);
	} else if (options.action === "ban") {
		await client.users.banUser(targetUserId);
	} else if (options.action === "unban") {
		await client.users.unbanUser(targetUserId);
	}

	revalidatePath("/admin");
}

const roleSchema = z.object({
	targetUserId: z.string(),
	role: z.enum(Roles as [string, ...string[]])
});
const userIdSchema = z.object({
	targetUserId: z.string()
});

//set role
export async function setRoleAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = roleSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Invalid form data for setting role.");
	}

	await editRole(parsed.data.targetUserId, { action: "editRole", newRole: parsed.data.role as Role });
}

//remove role
export async function removeRoleAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to remove role from not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "editRole", newRole: null });
}

//delete user
export async function deleteUserAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to delete not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "delete" }, async () => {
		//remove all data associated with user
		await prisma.$transaction(
			async (tx) => {
				//projects
				await tx.$executeRaw(
					Prisma.sql`UPDATE "Project" SET "userIds" = array_remove("userIds", ${parsed.data.targetUserId}) WHERE ${parsed.data.targetUserId} = ANY("userIds")`
				);
				await tx.project.deleteMany({
					where: {
						userIds: {
							isEmpty: true
						}
					}
				});

				//assays
				await tx.$executeRaw(
					Prisma.sql`UPDATE "Assay" SET "userIds" = array_remove("userIds", ${parsed.data.targetUserId}) WHERE ${parsed.data.targetUserId} = ANY("userIds")`
				);
				await tx.assay.deleteMany({
					where: {
						userIds: {
							isEmpty: true
						}
					}
				});

				//primers
				await tx.$executeRaw(
					Prisma.sql`UPDATE "Primer" SET "userIds" = array_remove("userIds", ${parsed.data.targetUserId}) WHERE ${parsed.data.targetUserId} = ANY("userIds")`
				);
				await tx.primer.deleteMany({
					where: {
						userIds: {
							isEmpty: true
						}
					}
				});

				//features
				await tx.$executeRaw(
					Prisma.sql`UPDATE "Feature" SET "userIds" = array_remove("userIds", ${parsed.data.targetUserId}) WHERE ${parsed.data.targetUserId} = ANY("userIds")`
				);
				//TODO: hangs on this delete call
				// await tx.feature.deleteMany({
				// 	where: {
				// 		userIds: {
				// 			isEmpty: true
				// 		}
				// 	}
				// });

				//taxonomies
				await tx.$executeRaw(
					Prisma.sql`UPDATE "Taxonomy" SET "userIds" = array_remove("userIds", ${parsed.data.targetUserId}) WHERE ${parsed.data.targetUserId} = ANY("userIds")`
				);
				//TODO: hangs on this delete call
				// await tx.taxonomy.deleteMany({
				// 	where: {
				// 		userIds: {
				// 			isEmpty: true
				// 		}
				// 	}
				// });
			},
			{
				timeout: 1 * 60 * 1000
			}
		);
	});
}

//ban user
export async function banUserAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to ban not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "ban" });
}

//unban user
export async function unbanUserAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to unban not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "unban" });
}
