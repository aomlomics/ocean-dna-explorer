"use server";

import { seedAssays } from "../helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

export default async function seedDatabaseAction() {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	try {
		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		await seedAssays();
	} catch (err) {
		console.error(err);
	}
}
