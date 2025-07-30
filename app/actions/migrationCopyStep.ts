"use server";

import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "../generated/prisma/client";
import { unsafePrisma, updateManyRaw } from "../helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

export default async function migrationCopyStepAction() {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata?.role;

	if (!userId) {
		throw new Error("Must be logged in.");
	}

	if (!role || !RolePermissions[role].includes("manageDatabase")) {
		throw new Error("Invalid role.");
	}

	const oldFieldsByTable = Object.keys(TableMetadata).reduce((acc, table) => {
		const tempFields = TableMetadata[table as Lowercase<Prisma.ModelName>].enumSchema._def.values.filter((f) =>
			f.endsWith("__TEMP")
		);
		if (tempFields.length) {
			acc[table as Lowercase<Prisma.ModelName>] = tempFields.map((f) => f.slice(0, f.length - 6));
		}

		return acc;
	}, {} as Record<Lowercase<Prisma.ModelName>, string[]>);

	await unsafePrisma.$transaction(async (tx) => {
		for (const table in oldFieldsByTable) {
			//@ts-ignore
			const result = await tx[table].findMany({
				select: {
					//@ts-ignore
					...oldFieldsByTable[table].reduce(
						(acc: Record<string, true>, field: string) => ({ ...acc, [field]: true }),
						{}
					),
					id: true
				}
			});

			for (let i = 0; i < result.length; i++) {
				for (const field of oldFieldsByTable[table as Lowercase<Prisma.ModelName>]) {
					result[i][field + "__TEMP"] = result[i][field];
					delete result[i][field];
				}
			}

			const modelName = (table.slice(0, 1).toUpperCase() + table.slice(1)) as Prisma.ModelName;
			await updateManyRaw(tx, modelName, result);
		}
	});
}
