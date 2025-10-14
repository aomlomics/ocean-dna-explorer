"use server";

import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "../generated/prisma/client";
import { unsafePrisma, updateManyRaw } from "../helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { parseSchemaToObject } from "../helpers/schema";
import { uncapitalizeTable } from "../helpers/utils";

function exists(value: any) {
	return value !== null && value !== undefined && value.toString;
}

export default async function migrationCopyStepAction() {
	try {
		const { userId, sessionClaims } = await auth();
		const role = sessionClaims?.metadata?.role;

		if (!userId) {
			throw new Error("Must be logged in.");
		}

		if (!role || !RolePermissions[role].includes("manageDatabase")) {
			throw new Error("Invalid role.");
		}

		const oldFieldsByTable = Object.keys(Prisma.ModelName).reduce((acc, t) => {
			const table = uncapitalizeTable(t as Prisma.ModelName);
			const tempFields = TableMetadata[table].enumSchema.options.filter((f) => f.endsWith("__TEMP"));
			if (tempFields.length) {
				acc[table] = tempFields.map((f) => f.slice(0, f.length - 6));
			}

			return acc;
		}, {} as Record<Uncapitalize<Prisma.ModelName>, string[]>);

		await unsafePrisma.$transaction(async (tx) => {
			for (const t in oldFieldsByTable) {
				const table = t as Uncapitalize<Prisma.ModelName>;

				// @ts-ignore
				const result = (await tx[table].findMany({
					select: {
						//@ts-ignore
						...oldFieldsByTable[t].reduce(
							(acc: Record<string, true>, field: string) => ({ ...acc, [field]: true }),
							{}
						),
						id: true
					}
				})) as Record<string, any>[];

				if (result.length) {
					for (let i = 0; i < result.length; i++) {
						for (const field of oldFieldsByTable[table]) {
							if (exists(result[i][field])) {
								parseSchemaToObject(field + "__TEMP", result[i][field].toString(), result[i], table);
							} else {
								result[i][field + "__TEMP"] = null;
							}

							delete result[i][field];
						}
					}

					//only update rows where the changed fields had a value
					const filteredResult = result.filter((row) =>
						Object.entries(row).some(([field, value]) => field !== "id" && value)
					);
					if (filteredResult.length) {
						const modelName = (t.slice(0, 1).toUpperCase() + t.slice(1)) as Prisma.ModelName;
						await updateManyRaw(tx, modelName, filteredResult);
					}
				}
			}
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
}
