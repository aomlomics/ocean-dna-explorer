import { getZodType, parseSchemaToObject } from "./schema";
import { ErrorPacket } from "@/types/globals";
import { Assay, DeadBoolean, Prisma, PrismaClient } from "../generated/prisma/client";
import { DeadBooleanToEnum } from "@/types/enums";
import { parse } from "csv-parse";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "@/prisma/generated/zod";

export function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorPacket | undefined {
	try {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			if (err.code === "P2002") {
				console.log(err);
				return {
					statusMessage: "error",
					error: `${err.meta?.modelName} with provided ${(err.meta?.target as string[]).join(
						", "
					)} already exists in database.`
				};
			} else if (err.code === "P2003") {
				return {
					statusMessage: "error",
					error: `A ${err.meta?.modelName} has an invalid ${(err.meta?.constraint as string)
						.split("_")
						.slice(1, -1)
						.join("_")}.`
				};
			} else {
				return {
					statusMessage: "error",
					error: err.message
				};
			}
		}
	} catch {
		return {
			statusMessage: "error",
			error: err.message
		};
	}
}

//TODO: make it work with arrays
async function updateManyRawChunked(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id" as string | string[],
	fields: string[]
) {
	//get shape of table to allow typecasting
	//also verifies against SQL injection attacks
	const deadBooleanFields = [] as string[];

	//add set for provided fields
	const setSql = fields
		.map((f) => {
			const type = getZodType(table, f).type;
			let typecast = "";

			if (type === "DeadBoolean") {
				typecast = '::"DeadBoolean"';
				deadBooleanFields.push(f);
			} else if (type === "json") {
				typecast = "::jsonb";
			} else if (type === "integer") {
				typecast = "::integer";
			} else if (type === "float") {
				typecast = "::float";
			} else if (type === "boolean") {
				typecast = "::boolean";
			} else if (type === "date") {
				typecast = "::timestamp";
			}

			return `"${f}" = "t"."${f}"${typecast}`;
		})
		.join(", ");

	const deadBooleanOptions = Object.keys(DeadBooleanToEnum);
	//parameterized counts
	const valuesSqlArr = [] as string[];
	//parameterized values
	const flatData = [] as (typeof data)[0][keyof (typeof data)[0]][];
	let paramIndex = 0;
	for (const d of data) {
		//add parameterized count(s) for id field(s)
		const valuesStrArr = [
			...(typeof id === "string" ? [`\$${++paramIndex}`] : id.map(() => `\$${++paramIndex}`))
		] as string[];

		//add flat data for id field(s)
		flatData.push(...(typeof id === "string" ? [d[id]] : id.map((i) => d[i])));

		for (const f of fields) {
			//add parameterized counts
			valuesStrArr.push(`\$${++paramIndex}`);

			//flatten data
			if (d[f] === undefined) {
				flatData.push(null);
			} else {
				const foundOption = deadBooleanOptions.find(
					(db) => DeadBooleanToEnum[db as keyof typeof DeadBooleanToEnum] === d[f]
				);
				if (deadBooleanFields.includes(f) && foundOption) {
					if (foundOption === "0") {
						flatData.push(DeadBoolean.false);
					} else if (foundOption === "1") {
						flatData.push(DeadBoolean.true);
					} else {
						flatData.push(foundOption);
					}
				} else if (d[f] === "JsonNull") {
					flatData.push("[]");
				} else {
					flatData.push(d[f]);
				}
			}
		}
		valuesSqlArr.push("(" + valuesStrArr.join(",") + ")");
	}

	//list field names
	const idFieldsSql = typeof id === "string" ? `"${id}"` : id.map((i) => `"${i}"`).join(", ");
	const fieldsSql = fields.map((f) => `"${f}"`).join(", ");

	//create where statement
	const whereSql =
		typeof id === "string"
			? `"${table}"."${id}" = "t"."${id}"`
			: id.map((i) => `"${table}"."${i}" = "t"."${i}"`).join(" AND ");

	//combine into prepared statement
	const sql = `UPDATE "${table}" SET ${setSql} FROM (VALUES ${valuesSqlArr.join(
		","
	)}) AS t(${idFieldsSql}, ${fieldsSql}) WHERE ${whereSql}`;

	return client.$executeRawUnsafe(sql, ...flatData);
}

export async function updateManyRaw(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id" as string | string[]
) {
	//get fields from data
	const fieldsWithId = new Set() as Set<string>;
	for (const d of data) {
		for (const field in d) {
			fieldsWithId.add(field);
		}
	}
	const fields = Array.from(fieldsWithId) as string[];

	//remove id field(s) to be handled separately
	if (typeof id === "string") {
		const keyIndex = fields.indexOf(id);
		if (keyIndex === -1) {
			throw new Error(
				`No field named "${id}" found for raw update on table named "${table}" for ${data.length} entries.`
			);
		} else {
			fields.splice(keyIndex, 1);
		}
	} else {
		for (const i of id) {
			const keyIndex = fields.indexOf(i);
			if (keyIndex === -1) {
				throw new Error(
					`No field named "${i}" found in data for raw update on table named "${table}" for ${data.length} entries.`
				);
			} else {
				fields.splice(keyIndex, 1);
			}
		}
	}

	let rowsAffected = 0;
	const CHUNK_SIZE = 30000 / fieldsWithId.size; //Prisma prepared statements have a limit of 32,767
	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		rowsAffected += await updateManyRawChunked(client, table, data.slice(i, i + CHUNK_SIZE), id, fields);
	}

	return rowsAffected;
}

export async function seedAssays(client: PrismaClient, assayMasterListUrl = process.env.ASSAY_MASTER_LIST) {
	console.log("Seeding database with assays from " + assayMasterListUrl);

	const assaySeedFile = await fetch(assayMasterListUrl as string);
	if (!assaySeedFile.ok) {
		throw new Error(
			`Could not fetch seed file from Github. Verify that "${assayMasterListUrl}" is a valid URL. If the file location has moved, notify a maintainer.`
		);
	}

	const assays = [] as Prisma.AssayCreateManyInput[];
	const parser = parse(await assaySeedFile.text(), { columns: true, delimiter: "\t" });
	for await (const record of parser) {
		const recordList = Object.entries(record) as [string, string][];
		const assayRow = {} as Assay;

		for (const [field, v] of recordList) {
			if (AssayScalarFieldEnumSchema.safeParse(field).error) {
				throw new Error(`Could not validate field named ${field} for Assay.`);
			}

			parseSchemaToObject(field, v, assayRow, "assay");
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

	await client.$transaction(async (tx) => {
		//create new assays
		const newAssays = await tx.assay.createManyAndReturn({
			data: assays,
			skipDuplicates: true,
			select: {
				pcr_primer_forward: true,
				pcr_primer_reverse: true
			}
		});

		//update existing assays
		const assaysToUpdate = assays.filter(
			(a) =>
				!newAssays.some(
					(dbA) => dbA.pcr_primer_forward === a.pcr_primer_forward && dbA.pcr_primer_reverse === a.pcr_primer_reverse
				)
		);
		if (assaysToUpdate.length) {
			await updateManyRaw(tx, "Assay", assaysToUpdate, ["pcr_primer_forward", "pcr_primer_reverse"]);
		}

		//delete any removed assays that are unused
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
	});

	console.log("Seed successful");
}
