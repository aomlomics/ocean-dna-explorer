"use server";

import { seedAssays } from "../helpers/queries";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { prisma } from "../helpers/prisma";

export default async function seedDatabaseAction() {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	try {
		if (!userId || !role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Unauthorized");
		}

		await seedAssays(prisma);
	} catch (err) {
		console.error(err);
	}
}
