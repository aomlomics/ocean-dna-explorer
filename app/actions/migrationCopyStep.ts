"use server";

import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "../generated/prisma/client";
import { unsafePrisma, updateManyRaw } from "../helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { parseSchemaToObject } from "../helpers/utils";

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
			for (const t in oldFieldsByTable) {
				const table = t as Lowercase<Prisma.ModelName>;
				console.log(table, oldFieldsByTable[table]);

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
							if (Array.isArray(result[i][field])) {
								if (exists(result[i][field][0])) {
									//at least one value in array
									parseSchemaToObject(field + "__TEMP", result[i][field][0].toString(), result[i], table);
								} else {
									//value is null
									result[i][field + "__TEMP"] = null;
								}
							} else {
								if (exists(result[i][field])) {
									parseSchemaToObject(field + "__TEMP", result[i][field].toString(), result[i], table);
								} else {
									result[i][field + "__TEMP"] = null;
								}
							}

							delete result[i][field];
						}
					}

					//only update rows where the changed fields had a value
					const filteredResult = result.filter((row) =>
						Object.entries(row).some(([field, value]) => field !== "id" && value)
					);
					console.log(filteredResult.length, JSON.stringify(filteredResult, undefined, 2));
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
