"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function removeRole(formData: FormData) {
	const client = await clerkClient();

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
