"use server";

import { RoleHeirarchy } from "@/types/enums";
import { Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function setRole(formData: FormData) {
	const client = await clerkClient();

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role | undefined;

	const id = formData.get("id") as string;

	try {
		if (id === userId) {
			throw new Error("Can't edit own role");
		}

		if (role !== "admin" && role !== "moderator") {
			throw new Error("Not authorized");
		}

		//TODO: fix potential race condition
		const user = await client.users.getUser(id);
		if (!RoleHeirarchy[role].includes(user.publicMetadata.role as Role)) {
			throw new Error("Not authorized");
		}

		const res = await client.users.updateUserMetadata(id, {
			publicMetadata: { role: formData.get("role") }
		});
		// return { message: res.publicMetadata };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		// return { message: "Error", error: error.message };
	}
}
