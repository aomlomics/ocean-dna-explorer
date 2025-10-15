import { Assay, Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { parse } from "csv-parse";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "./generated/zod";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { updateManyRaw } from "@/app/helpers/prisma";

const prisma = new PrismaClient();
const ASSAY_SEED_URL =
	"https://raw.githubusercontent.com/NOAA-Omics/noaa-omics-metabarcoding-assays/refs/heads/main/assays.tsv";

async function load() {
	try {
		const assaySeedFile = await fetch(ASSAY_SEED_URL);
		if (!assaySeedFile.ok) {
			throw new Error(
				`Could not fetch seed file from Github. Verify that "${ASSAY_SEED_URL}" is a valid URL. If the file location has moved, notify a maintainer.`
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

			const oldAssays = assays.filter((a) => !newAssays.some((dbA) => dbA.assay_name === a.assay_name));
			if (oldAssays.length) {
				await updateManyRaw(tx, "Assay", oldAssays, "assay_name");
			}

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
	} catch (err) {
		console.error(err);
		await prisma.$disconnect();
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

load();
