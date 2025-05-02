"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function removeRole(formData: FormData) {
	const client = await clerkClient();

	const { userId } = await auth();
	const id = formData.get("id") as string;
	if (id === userId) {
		// return { message: "Cannot edit own role" };
		return;
	}

	try {
		const res = await client.users.updateUserMetadata(formData.get("id") as string, {
			publicMetadata: { role: null }
		});
		// return { message: res.publicMetadata };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		// return { message: "Error", error: error.message };
	}
}
