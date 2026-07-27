"use server";

import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { NetworkPacket } from "@/types/globals";

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
		console.log("remaking", database || "all", "blastdb");
		const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/blast/remakeDb`, {
			method: "POST",
			headers: {
				Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
			},
			body:
				database &&
				JSON.stringify({
					database
				})
		});

		if (res.ok) {
			console.error(res.statusText);
		}

		const response = (await res.json()) as NetworkPacket;
		if (response.statusMessage === "error") {
			console.error(response.error);
		}

		console.log(response);
	} catch (err) {
		console.error(err);
	}
}
