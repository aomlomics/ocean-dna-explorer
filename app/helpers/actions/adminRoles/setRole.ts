"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getRole } from "../../utils";

export async function setRole(formData: FormData) {
	const client = await clerkClient();

	const role = await getRole();
	if (role !== "admin") {
		// return { message: "Not Authorized" };
		return;
	}

	try {
		const res = await client.users.updateUserMetadata(formData.get("id") as string, {
			publicMetadata: { role: formData.get("role") }
		});
		// return { message: res.publicMetadata };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		// return { message: "Error", error: error.message };
	}
}
