"use server";

import { NetworkPacket, Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { RoleHeirarchy, RolePermissions } from "@/types/objects";

async function editRole(id: string, newRole: Role | null): Promise<NetworkPacket> {
	const client = await clerkClient();

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (id === userId) {
		return { statusMessage: "error", error: "Can't edit own role" };
	}

	if (!role || !RolePermissions[role].includes("manageUsers")) {
		return { statusMessage: "error", error: "Not authorized" };
	}

	try {
		//TODO: fix potential race condition
		const user = await client.users.getUser(id);
		if (!role || !RoleHeirarchy[role].includes(user.publicMetadata.role as Role)) {
			return { statusMessage: "error", error: "Not authorized" };
		}

		const res = await client.users.updateUserMetadata(id, {
			publicMetadata: { role: newRole }
		});
		return { statusMessage: "success", result: res.publicMetadata };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}

export async function setRole(formData: FormData) {
	const id = formData.get("id") as string;
	const role = formData.get("role") as Role;
	await editRole(id, role);
}

export async function removeRole(formData: FormData) {
	const id = formData.get("id") as string;
	await editRole(id, null);
}
