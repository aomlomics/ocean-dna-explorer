"use server";

import { Role } from "@/types/globals";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function setRole(formData: FormData) {
	const client = await clerkClient();

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role | undefined;
	if (role !== "admin" && role !== "moderator") {
		// return { message: "Not Authorized" };
		return;
	}

	const id = formData.get("id") as string;
	if (id === userId) {
		// return { message: "Cannot edit own role" };
		return;
	}

	try {
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
