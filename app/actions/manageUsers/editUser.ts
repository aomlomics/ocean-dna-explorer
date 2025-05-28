"use server";

import { Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { RoleHeirarchy, RolePermissions, Roles } from "@/types/objects";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/app/helpers/prisma";

async function editRole(
	targetUserId: string,
	options: { action: "editRole"; newRole: Role | null } | { action: "delete" | "ban" }
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

	if (options.action === "editRole") {
		await client.users.updateUserMetadata(targetUserId, {
			publicMetadata: { role: options.newRole }
		});
	} else if (options.action === "delete") {
		await client.users.deleteUser(targetUserId);
	} else if (options.action === "ban") {
		await client.users.banUser(targetUserId);
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

export async function setRoleAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = roleSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Invalid form data for setting role.");
	}

	await editRole(parsed.data.targetUserId, { action: "editRole", newRole: parsed.data.role as Role });
}

export async function removeRoleAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to remove role from not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "editRole", newRole: null });
}

export async function deleteUserAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to delete not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "delete" });

	//TODO: test
	await prisma.$transaction(async (tx) => {
		const projects = await tx.project.findMany({
			where: {
				userIds: {
					has: parsed.data.targetUserId
				}
			},
			select: {
				userIds: true,
				project_id: true
			}
		});

		for (let p of projects) {
			const userIds = p.userIds.splice(p.userIds.indexOf(parsed.data.targetUserId), 1);

			if (userIds.length) {
				await tx.project.update({
					where: {
						project_id: p.project_id
					},
					data: {
						userIds
					}
				});
			} else {
				await tx.project.delete({
					where: {
						project_id: p.project_id
					}
				});
			}
		}
	});
}

export async function banUserAction(formData: FormData) {
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = userIdSchema.safeParse(formDataObject);
	if (!parsed.success) {
		throw new Error("Target userId to ban not provided.");
	}

	await editRole(parsed.data.targetUserId, { action: "ban" });
}
