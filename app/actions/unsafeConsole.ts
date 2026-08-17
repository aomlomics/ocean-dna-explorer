"use server";

import { auth } from "@clerk/nextjs/server";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { prisma } from "../helpers/prisma";
import JSON5 from "json5";
import { getTableName } from "../helpers/schema";

export default async function unsafeConsoleAction(
	table: string,
	modelQuery: string,
	query: string
): Promise<NetworkPacket> {
	try {
		const model = getTableName(table);

		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId || !role || !RolePermissions[role].includes("manageDatabase")) {
			return { statusMessage: "error", error: "Unauthorized" };
		}

		if (modelQuery && typeof modelQuery !== "string") {
			return { statusMessage: "error", error: "Model query must be string." };
		}

		if (!Object.keys(prisma[model]).includes(modelQuery)) {
			return { statusMessage: "error", error: "Invalid model query." };
		}

		if (query && typeof query !== "string") {
			return { statusMessage: "error", error: "Query must be string." };
		}

		JSON5.parse(query);
		// @ts-expect-error dynamically accessing prisma client
		await prisma[model][modelQuery](JSON.parse(query));

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;

		return { statusMessage: "error", error: error.message };
	}
}
