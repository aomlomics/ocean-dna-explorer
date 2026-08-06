"use server";

import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

export default async function remakeBlastDatabaseAction(formData?: FormData) {
	const { userId, sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

	try {
		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		const database = formData?.get("database");
		fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/blast/remakeDb${database ? "?database=" + database : ""}`, {
			method: "POST",
			headers: {
				Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
			}
		});
	} catch (err) {
		console.error(err);
	}
}
