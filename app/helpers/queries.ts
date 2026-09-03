import { getZodType, parseSchemaToObject } from "./schema";
import type { ErrorPacket } from "@/types/globals";
import { DeadBoolean, Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { AssayModel } from "@/app/generated/prisma/models/Assay";
import { DeadBooleanToEnum } from "@/types/enums";
import { parse } from "csv-parse";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "@/prisma/generated/zod";
import type { ModelName } from "@/types/tableMetadata";
import TableMetadata from "@/types/tableMetadata";
import { capitalizeTable } from "./utils";
import { getImplicitJoinTable } from "./withDb";
import type { AssignmentModel, OccurrenceModel, ProjectModel } from "../generated/prisma/models";

//Prisma prepared statements have a limit of 32,767
const PARAM_LIMIT = 30000;

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
	table: Uncapitalize<ModelName>,
	data: Record<string, any>[],
	id: string | string[],
	fields: string[]
) {
	//get shape of table to allow typecasting
	//also verifies against SQL injection attacks
	const deadBooleanFields = [] as string[];

	//add set for provided fields
	const setSql = fields.map((f) => {
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

		return Prisma.sql`
			${Prisma.raw(`"${f}"`)} = ${Prisma.raw(`t."${f}"`)}${Prisma.raw(typecast)}
		`;
	});

	const deadBooleanOptions = Object.keys(DeadBooleanToEnum);

	//parameterized values
	const valuesSqlArr = data.map((d) => {
		//add parameterized count(s) for id field(s)
		const idValues = typeof id === "string" ? [d[id]] : id.map((i) => d[i]);

		//add flat data for id field(s)
		const fieldValues = fields.map((f) => {
			//flatten data
			if (d[f] === undefined) {
				return null;
			}

			const foundOption = deadBooleanOptions.find(
				(db) => DeadBooleanToEnum[db as keyof typeof DeadBooleanToEnum] === d[f]
			);

			if (deadBooleanFields.includes(f) && foundOption) {
				if (foundOption === "0") {
					return DeadBoolean.false;
				} else if (foundOption === "1") {
					return DeadBoolean.true;
				} else {
					return foundOption;
				}
			} else if (d[f] === "JsonNull") {
				return "[]";
			} else {
				return d[f];
			}
		});

		return Prisma.sql`(${Prisma.join([...idValues, ...fieldValues])})`;
	});

	//list field names
	const idFieldsSql =
		typeof id === "string"
			? Prisma.raw(`"${id}"`)
			: Prisma.join(
					id.map((i) => Prisma.raw(`"${i}"`)),
					", "
				);

	const fieldsSql = Prisma.join(
		fields.map((f) => Prisma.raw(`"${f}"`)),
		", "
	);

	//create where statement
	const capsTable = capitalizeTable(table);
	const whereSql =
		typeof id === "string"
			? Prisma.sql`${Prisma.raw(`"${capsTable}"."${id}"`)} = ${Prisma.raw(`t."${id}"`)}`
			: Prisma.join(
					id.map((i) => Prisma.sql`${Prisma.raw(`"${capsTable}"."${i}"`)} = ${Prisma.raw(`t."${i}"`)}`),
					" AND "
				);

	//combine into prepared statement
	const sql = Prisma.sql`
		UPDATE ${Prisma.raw(`"${capsTable}"`)}
		SET ${Prisma.join(setSql, ", ")}
		FROM (
			VALUES ${Prisma.join(valuesSqlArr, ", ")}
		) AS t(${idFieldsSql}, ${fieldsSql})
		WHERE ${whereSql}
	`;

	return client.$executeRaw(sql);
}

export async function updateManyRaw(
	client: any,
	table: Uncapitalize<ModelName>,
	data: Record<string, any>[],
	altId?: string | string[]
) {
	if (!data.length) return 0;

	//get fields from data
	const fieldsWithId = new Set() as Set<string>;
	for (const d of data) {
		for (const field in d) {
			fieldsWithId.add(field);
		}
	}

	if (fieldsWithId.size > PARAM_LIMIT) {
		throw new Error(`A singular row has more than the parameter limit of ${PARAM_LIMIT}.`);
	}

	const fields = Array.from(fieldsWithId) as string[];
	//remove id field(s) to be handled separately
	const id = altId || TableMetadata[table].titleField;
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
	const CHUNK_SIZE = Math.floor(PARAM_LIMIT / fieldsWithId.size);
	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		rowsAffected += await updateManyRawChunked(
			client,
			table,
			data.slice(i, i + CHUNK_SIZE),
			id as string | string[],
			fields
		);
	}

	return rowsAffected;
}

export async function connectTaxaToSamples(
	client: Prisma.TransactionClient,
	project_id: ProjectModel["project_id"],
	taxaByLibId: Record<OccurrenceModel["lib_id"], Set<AssignmentModel["taxonomy"]>>
) {
	const pairs = Object.entries(taxaByLibId).flatMap(([lib_id, taxa]) =>
		Array.from(taxa).map((taxonomy) => ({ lib_id, taxonomy }))
	);
	if (!pairs.length) return 0;

	const join = await getImplicitJoinTable({ from: "sample", to: "taxonomy" });
	let rowsAffected = 0;
	//project_id contributes 1 parameter
	//each pair contributes 2 parameters: lib_id + taxonomy
	const CHUNK_SIZE = Math.floor((PARAM_LIMIT - 1) / 2);
	for (let i = 0; i < pairs.length; i += CHUNK_SIZE) {
		rowsAffected += await client.$executeRaw`
			INSERT INTO ${Prisma.raw(`"${join.table}"`)}
				(${Prisma.raw(`"${join.from.joinColumn}"`)}, ${Prisma.raw(`"${join.to.joinColumn}"`)})
			SELECT DISTINCT
				s.id,
				t.id
			FROM (VALUES ${Prisma.join(
				pairs.slice(i, i + CHUNK_SIZE).map(({ lib_id, taxonomy }) => Prisma.sql`(${lib_id}, ${taxonomy})`),
				", "
			)}) AS v("lib_id", "taxonomy")
			JOIN "Library" l
				ON l."project_id" = ${project_id}
				AND l."lib_id" = v."lib_id"
			JOIN "Sample" s
				ON s."project_id" = l."project_id"
				AND s."samp_name" = l."samp_name"
			JOIN "Taxonomy" t
				ON t."taxonomy" = v."taxonomy"
			ON CONFLICT DO NOTHING
		`;
	}

	return rowsAffected;
}

export async function disconnectTaxaFromSamples(
	client: Prisma.TransactionClient,
	project_id: ProjectModel["project_id"],
	analysis_run_name: AssignmentModel["analysis_run_name"],
	removedTaxaByLibId: Record<OccurrenceModel["lib_id"], Set<AssignmentModel["taxonomy"]>>
) {
	const pairs = Object.entries(removedTaxaByLibId).flatMap(([lib_id, taxa]) =>
		Array.from(taxa).map((taxonomy) => ({ lib_id, taxonomy }))
	);
	if (!pairs.length) return 0;

	const join = await getImplicitJoinTable({ from: "sample", to: "taxonomy" });
	let rowsAffected = 0;
	// Each pair contributes 2 parameters: lib_id + taxonomy.
	// project_id + analysis_run_name contribute 2 additional parameters.
	const CHUNK_SIZE = Math.floor((PARAM_LIMIT - 2) / 2);
	for (let i = 0; i < pairs.length; i += CHUNK_SIZE) {
		const chunk = pairs.slice(i, i + CHUNK_SIZE);

		rowsAffected += await client.$executeRaw`
			DELETE FROM ${Prisma.raw(`"${join.table}"`)} AS jt
			USING "Sample" AS s, "Taxonomy" AS t
			WHERE jt.${Prisma.raw(`"${join.from.joinColumn}"`)} = s."id"
				AND jt.${Prisma.raw(`"${join.to.joinColumn}"`)} = t."id"

				-- get sample to taxonomy relations removed from the current analysis
				AND EXISTS (
					SELECT 1
					FROM "Library" AS l
					WHERE l."project_id" = ${project_id}
						AND l."samp_name" = s."samp_name"
						AND EXISTS (
							SELECT 1
							FROM (VALUES ${Prisma.join(
								chunk.map(({ lib_id, taxonomy }) => Prisma.sql`(${lib_id}, ${taxonomy})`),
								", "
							)}) AS removed("lib_id", "taxonomy")
							WHERE removed."lib_id" = l."lib_id"
								AND removed."taxonomy" = t."taxonomy"
						)
				)

				-- skip sample to taxonomy relations that exist in other analyses
				AND NOT EXISTS (
					SELECT 1
					FROM "Library" AS l
					JOIN "Occurrence" AS o
						ON o."project_id" = l."project_id"
						AND o."lib_id" = l."lib_id"
					JOIN "Assignment" AS a
						ON a."project_id" = o."project_id"
						AND a."analysis_run_name" = o."analysis_run_name"
						AND a."featureid" = o."featureid"
					WHERE l."project_id" = ${project_id}
						AND l."samp_name" = s."samp_name"
						AND a."taxonomy" = t."taxonomy"
						AND o."analysis_run_name" != ${analysis_run_name}
				)
		`;
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
		const assayRow = {} as AssayModel;

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
			await updateManyRaw(tx, "assay", assaysToUpdate, ["pcr_primer_forward", "pcr_primer_reverse"]);
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
