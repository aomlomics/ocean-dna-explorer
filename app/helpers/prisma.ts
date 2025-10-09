import { RolePermissions } from "@/types/objects";
import { DeadBoolean, Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { ErrorPacket, Role } from "@/types/globals";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/library";
import { deepMerge } from "./utils";
import TableMetadata from "@/types/tableMetadata";
import { getZodType } from "./schema";
import { DeadBooleanEnum } from "@/types/enums";

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
			assay: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.AssayWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Samples: { some: { Project: { isPrivate: false } } }
							}
						});
					}

					return await query(args);
				}
			},
			assayMetadata: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.AssayMetadataWhereInput; [key: string]: any };
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
			assay: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.AssayWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Samples: { some: { Project: { isPrivate: false } } }
							},
							noPermQuery: {
								OR: [
									{
										Samples: { some: { Project: { isPrivate: false } } }
									},
									{
										Samples: { some: { Project: { userIds: { has: userId } } } }
									}
								]
							}
						});
					}

					return await query(args);
				}
			},
			assayMetadata: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.AssayMetadataWhereInput; [key: string]: any };
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

	//list field names
	const idFieldsSql = typeof id === "string" ? `"${id}"` : id.map((i) => `"${i}"`).join(", ");
	const fieldsSql = fields.map((f) => `"${f}"`).join(", ");

	//add parameterized counts
	let paramIndex = 0;
	const valuesSql = data.map((row) => `(${Object.values(row).map(() => `\$${++paramIndex}`)})`).join(",");

	//create where statement
	const whereSql =
		typeof id === "string"
			? `"${table}"."${id}" = "t"."${id}"`
			: id.map((i) => `"${table}"."${i}" = "t"."${i}"`).join(" AND ");

	//combine into prepared statement
	const sql = `UPDATE "${table}" SET ${setSql} FROM (VALUES ${valuesSql}) AS t(${idFieldsSql}, ${fieldsSql}) WHERE ${whereSql}`;

	const deadBooleanKeys = Object.keys(DeadBooleanEnum);
	return client.$executeRawUnsafe(
		sql,
		//flatten rows and columns
		...data.reduce(
			(acc: Array<string | number | boolean>, row) => [
				...acc,
				//add values for id field(s)
				...(typeof id === "string" ? [row[id]] : id.map((i) => row[i])),
				//add values for each rows's columns
				...fields.map((f) => {
					const deadBooleanFoundKey = deadBooleanKeys.find(
						(db) => DeadBooleanEnum[db as keyof typeof DeadBooleanEnum] === row[f]
					);
					if (deadBooleanFields.includes(f) && deadBooleanFoundKey) {
						if (deadBooleanFoundKey === "0") {
							return DeadBoolean.false;
						} else if (deadBooleanFoundKey === "1") {
							return DeadBoolean.true;
						} else {
							return deadBooleanFoundKey;
						}
					} else if (row[f] === "JsonNull") {
						return "[]";
					} else {
						return row[f];
					}
				})
			],
			[]
		)
	);
}

export async function updateManyRaw(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id" as string | string[],
	fields?: string[]
) {
	let fs = undefined as string[] | undefined;
	let numFields = NaN;
	if (fields) {
		numFields = fields.length;
		fs = fields.filter((f) => f !== id);
	} else {
		//TODO: verify that all data has these fields
		const keys = Object.keys(data[0]);
		numFields = keys.length;

		//remove id field(s) to be handled separately
		if (typeof id === "string") {
			const keyIndex = keys.indexOf(id);
			if (keyIndex === -1) {
				throw new Error(
					`No field named "${id}" found for raw update on table named "${table}" for ${data.length} entries.`
				);
			} else {
				keys.splice(keyIndex, 1);
			}
		} else {
			for (const i of id) {
				const keyIndex = keys.indexOf(i);
				if (keyIndex === -1) {
					throw new Error(
						`No field named "${i}" found in data for raw update on table named "${table}" for ${data.length} entries.`
					);
				} else {
					keys.splice(keyIndex, 1);
				}
			}
		}

		fs = keys;
	}

	let rowsAffected = 0;
	const CHUNK_SIZE = 30000 / numFields; //Prisma prepared statements have a limit of 32,767
	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		rowsAffected += await updateManyRawChunked(client, table, data.slice(i, i + CHUNK_SIZE), id, fs);
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
