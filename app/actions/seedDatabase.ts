"use server";

import { parse } from "csv-parse";
import { Assay, Prisma } from "../generated/prisma/client";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { parseSchemaToObject } from "../helpers/schema";
import { prisma } from "../helpers/prisma";
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

		console.log("Seeding database with assays from " + process.env.ASSAY_MASTER_LIST);

		const assaySeedFile = await fetch(process.env.ASSAY_MASTER_LIST as string);
		if (!assaySeedFile.ok) {
			throw new Error(
				`Could not fetch seed file from Github. Verify that "${process.env.ASSAY_MASTER_LIST}" is a valid URL. If the file location has moved, notify a maintainer.`
			);
		}

		const assays = [] as Prisma.AssayCreateManyInput[];
		const parser = parse(await assaySeedFile.text(), { columns: true, delimiter: "\t" });
		for await (const record of parser) {
			const assayRow = {} as Assay;

			for (const [field, v] of Object.entries(record)) {
				if (AssayScalarFieldEnumSchema.safeParse(field).error) {
					throw new Error(`Could not validate field named ${field} for Assay.`);
				}

				parseSchemaToObject(field, v as string, assayRow, "assay");
			}

			const parsed = AssayOptionalDefaultsSchema.parse(assayRow, {
				error: (iss) => {
					return {
						message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
					};
				}
			});
			assays.push(parsed);
		}

		const assayNames = assays.map((a) => a.assay_name);

		await prisma.$transaction(async (tx) => {
			const newAssays = await prisma.assay.createManyAndReturn({
				data: assays,
				skipDuplicates: true,
				select: {
					assay_name: true
				}
			});

			//TODO: fix updateManyRaw
			// const assaysToUpdate = assays.filter((a) => !newAssays.some((dbA) => dbA.assay_name === a.assay_name));
			// if (assaysToUpdate.length) {
			// 	await updateManyRaw(tx, "Assay", assaysToUpdate, "assay_name");
			// }

			await tx.assay.deleteMany({
				where: {
					assay_name: {
						notIn: assayNames
					},
					Libraries: {
						none: {}
					},
					Analyses: {
						none: {}
					}
				}
			});

			await tx.assay.updateMany({
				where: {
					assay_name: {
						notIn: assayNames
					},
					OR: [
						{
							Libraries: {
								some: {}
							}
						},
						{
							Analyses: {
								some: {}
							}
						}
					]
				},
				data: {
					deleted_ODE: true
				}
			});
		});

		console.log("Seed successful");
	} catch (err) {
		console.error(err);
	}
}
