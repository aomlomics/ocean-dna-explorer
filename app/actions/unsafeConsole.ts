"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "../generated/prisma/client";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { unsafePrisma } from "../helpers/prisma";
import JSON5 from "json5";
import { uncapitalizeTable } from "../helpers/utils";
import { TableNames } from "@/types/tableMetadata";

export default async function unsafeConsoleAction(
	table: Uncapitalize<Prisma.ModelName>,
	modelQuery: string,
	query: string
): Promise<NetworkPacket> {
	try {
		const model = TableNames.find((model) => model.toLowerCase() === table.toLowerCase()) as Prisma.ModelName;
		if (model) {
			const uncapsTable = uncapitalizeTable(model);

			const { userId, sessionClaims } = await auth();
			const role = sessionClaims?.metadata?.role;

			if (!userId) {
				return { statusMessage: "error", error: "Must be logged in." };
			}

			if (!role || !RolePermissions[role].includes("manageDatabase")) {
				return { statusMessage: "error", error: "Invalid role." };
			}

			if (modelQuery && typeof modelQuery !== "string") {
				return { statusMessage: "error", error: "Model query must be string." };
			}

			if (!Object.keys(unsafePrisma[uncapsTable]).includes(modelQuery)) {
				return { statusMessage: "error", error: "Invalid model query." };
			}

			if (query && typeof query !== "string") {
				return { statusMessage: "error", error: "Query must be string." };
			}

			//@ts-ignore
			JSON5.parse(query);
			// await unsafePrisma[uncapsTable][modelQuery](JSON.parse(query));

			return { statusMessage: "success" };
		} else {
			return { statusMessage: "error", error: `Invalid table name: "${table}".` };
		}
	} catch (err) {
		const error = err as Error;

		return { statusMessage: "error", error: error.message };
	}
}
