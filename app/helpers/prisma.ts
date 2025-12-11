import { RolePermissions } from "@/types/objects";
import { Assay, DeadBoolean, Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { DbType, ErrorPacket, Role } from "@/types/globals";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/library";
import { deepMerge } from "./utils";
import TableMetadata from "@/types/tableMetadata";
import { getZodType, parseSchemaToObject } from "./schema";
import { DeadBooleanEnum } from "@/types/enums";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { parse } from "csv-parse";

type PrismaExtension = DynamicClientExtensionThis<
	Prisma.TypeMap<
		InternalArgs & {
			result: {};
			model: {};
			query: {};
			client: {};
		},
		{}
	>,
	Prisma.TypeMapCb<Prisma.PrismaClientOptions>,
	{
		result: {};
		model: {};
		query: {};
		client: {};
	}
>;

export const secureFields = ["userIds"];

const readOperations = [
	"findUnique",
	"findUniqueOrThrow",
	"findFirst",
	"findFirstOrThrow",
	"findMany",
	"count",
	"aggregate",
	"groupBy"
];

//database initialization
const globalForPrisma = global as unknown as {
	unsafePrisma: PrismaClient;
	publicPrisma: PrismaExtension;
	prisma: PrismaExtension;
};

//prisma client with no restrictions
const unsafePrisma =
	globalForPrisma.unsafePrisma ||
	new PrismaClient({
		log: [
			// {
			// 	emit: "stdout",
			// 	level: "query"
			// },
			{
				emit: "stdout",
				level: "error"
			},
			{
				emit: "stdout",
				level: "info"
			},
			{
				emit: "stdout",
				level: "warn"
			}
		]
	});

//prisma client that can never get private data
const publicPrisma =
	globalForPrisma.publicPrisma ||
	unsafePrisma.$extends({
		query: {
			project: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.ProjectWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								isPrivate: false
							}
						});
					}

					return await query(args);
				}
			},
			sample: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.SampleWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Project: { isPrivate: false }
							}
						});
					}

					return await query(args);
				}
			},
			assayPrep: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.AssayPrepWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Project: { isPrivate: false }
							}
						});
					}

					return await query(args);
				}
			},
			library: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.LibraryWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Project: { isPrivate: false }
							}
						});
					}

					return await query(args);
				}
			},
			analysis: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.AnalysisWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								isPrivate: false
							}
						});
					}

					return await query(args);
				}
			},
			occurrence: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.OccurrenceWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Analysis: { isPrivate: false }
							}
						});
					}

					return await query(args);
				}
			},
			assignment: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.AssignmentWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Analysis: { isPrivate: false }
							}
						});
					}

					return await query(args);
				}
			},
			feature: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.FeatureWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Assignments: { some: { Analysis: { isPrivate: false } } }
							}
						});
					}

					return await query(args);
				}
			},
			taxonomy: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.TaxonomyWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Assignments: { some: { Analysis: { isPrivate: false } } }
							}
						});
					}

					return await query(args);
				}
			}
		}
	});

//prisma client that can get private data only if current user is authorized to
const prisma =
	globalForPrisma.prisma ||
	unsafePrisma.$extends({
		query: {
			project: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.ProjectWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								isPrivate: false
							},
							noPermQuery: {
								OR: [
									{
										isPrivate: false
									},
									{
										userIds: {
											has: userId
										}
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			sample: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.SampleWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Project: { isPrivate: false }
							},
							noPermQuery: {
								OR: [
									{
										Project: { isPrivate: false }
									},
									{
										Project: { userIds: { has: userId } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			assayPrep: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.AssayPrepWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Project: { isPrivate: false }
							},
							noPermQuery: {
								OR: [
									{
										Project: { isPrivate: false }
									},
									{
										Project: { userIds: { has: userId } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			library: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.LibraryWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Project: { isPrivate: false }
							},
							noPermQuery: {
								OR: [
									{
										Project: { isPrivate: false }
									},
									{
										Project: { userIds: { has: userId } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			analysis: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.AnalysisWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								isPrivate: false
							},
							noPermQuery: {
								OR: [
									{
										isPrivate: false
									},
									{
										Project: { userIds: { has: userId } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			occurrence: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.OccurrenceWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Analysis: { isPrivate: false }
							},
							noPermQuery: {
								OR: [
									{
										Analysis: { isPrivate: false }
									},
									{
										Analysis: { Project: { userIds: { has: userId } } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			assignment: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.AssignmentWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Analysis: { isPrivate: false }
							},
							noPermQuery: {
								OR: [
									{
										Analysis: { isPrivate: false }
									},
									{
										Analysis: { Project: { userIds: { has: userId } } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			feature: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.FeatureWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Assignments: { some: { Analysis: { isPrivate: false } } }
							},
							noPermQuery: {
								OR: [
									{
										Assignments: { some: { Analysis: { isPrivate: false } } }
									},
									{
										Assignments: { some: { Analysis: { Project: { userIds: { has: userId } } } } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			taxonomy: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.TaxonomyWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Assignments: { some: { Analysis: { isPrivate: false } } }
							},
							noPermQuery: {
								OR: [
									{
										Assignments: { some: { Analysis: { isPrivate: false } } }
									},
									{
										Assignments: { some: { Analysis: { Project: { userIds: { has: userId } } } } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			}
		}
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.unsafePrisma = unsafePrisma;
	globalForPrisma.publicPrisma = publicPrisma;
	globalForPrisma.prisma = prisma;
}

export { unsafePrisma, publicPrisma, prisma };

//database helper functions
export function stripSecureFields(queryResult: Record<string, any> | Record<string, any>[]) {
	if (Array.isArray(queryResult)) {
		for (let e of queryResult) {
			for (let f of secureFields) {
				delete e[f];
			}
		}
	} else {
		for (let f of secureFields) {
			delete queryResult[f];
		}
	}
}

export function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorPacket | undefined {
	try {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			if (err.code === "P2002") {
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
	} catch (newErr) {
		const error = newErr as Error;

		return {
			statusMessage: "error",
			error: err.message + "\n" + error.message
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
	const shape = TableMetadata[table].schema.shape;
	const deadBooleanFields = [] as string[];

	//add set for provided fields
	const setSql = fields
		.map((f) => {
			const type = getZodType(shape[f]).type;
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

	const deadBooleanOptions = Object.keys(DeadBooleanEnum);
	//parameterized counts
	const valuesSqlArr = [] as string[];
	//parameterized values
	const flatData = [] as (typeof data)[0][keyof (typeof data)[0]][];
	let paramIndex = 0;
	for (const d of data) {
		//add parameterized count(s) for id field(s)
		const valuesStrArr = [
			...(typeof id === "string" ? [`\$${++paramIndex}`] : id.map((i) => `\$${++paramIndex}`))
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
					(db) => DeadBooleanEnum[db as keyof typeof DeadBooleanEnum] === d[f]
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
		for (const field of Object.keys(d)) {
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

async function getWhere({
	where,
	userId,
	role,
	signedOutQuery,
	noPermQuery
}: {
	where: any;
	userId?: string | null;
	role?: Role | undefined;
	signedOutQuery: Record<string, any>;
	noPermQuery?: Record<string, any>;
}) {
	if (!userId) {
		if (where) {
			return deepMerge(where, signedOutQuery);
		} else {
			return signedOutQuery;
		}
	} else if (!role || !RolePermissions[role].includes("manageUsers")) {
		if (where) {
			if (noPermQuery) {
				return deepMerge(where, noPermQuery);
			} else {
				return where;
			}
		} else {
			return noPermQuery;
		}
	} else {
		return where;
	}
}

export async function seedAssays(client = unsafePrisma, assayMasterListUrl = process.env.ASSAY_MASTER_LIST) {
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
				assay_name: true
			}
		});

		//update existing assays
		const assaysToUpdate = assays.filter((a) => !newAssays.some((dbA) => dbA.assay_name === a.assay_name));
		if (assaysToUpdate.length) {
			await updateManyRaw(tx, "Assay", assaysToUpdate, "assay_name");
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

		//flag any removed assays that are still in use as deleted
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
}
