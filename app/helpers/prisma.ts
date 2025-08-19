import { RolePermissions } from "@/types/objects";
import { Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { ErrorPacket, Role } from "@/types/globals";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/library";
import { deepMerge } from "./utils";

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
			primer: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						args = args as { where?: Prisma.PrimerWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							signedOutQuery: {
								Assays: { some: { Samples: { some: { Project: { isPrivate: false } } } } }
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
								Sample: { Project: { isPrivate: false } }
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
			primer: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						args = args as { where?: Prisma.PrimerWhereInput; [key: string]: any };
						args.where = await getWhere({
							where: args.where,
							userId,
							role,
							signedOutQuery: {
								Assays: { some: { Samples: { some: { Project: { isPrivate: false } } } } }
							},
							noPermQuery: {
								OR: [
									{
										Assays: { some: { Samples: { some: { Project: { isPrivate: false } } } } }
									},
									{
										Assays: { some: { Samples: { some: { Project: { userIds: { has: userId } } } } } }
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
								Sample: { Project: { isPrivate: false } }
							},
							noPermQuery: {
								OR: [
									{
										Sample: { Project: { isPrivate: false } }
									},
									{
										Sample: { Project: { userIds: { has: userId } } }
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

export function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorPacket {
	if (err.code === "P2002") {
		return {
			statusMessage: "error",
			error: `${err.meta?.modelName} with provided ${(err.meta?.target as string[]).join(
				", "
			)} already exists in database.`
		};
	} else {
		return {
			statusMessage: "error",
			error: err.message
		};
	}
}

//TODO: make it work with arrays
export async function updateManyRaw(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id",
	fields?: string[]
) {
	let fs = undefined as string[] | undefined;
	if (fields) {
		fs = fields.filter((f) => f !== id);
	} else {
		const keys = Object.keys(data[0]);
		keys.splice(keys.indexOf(id), 1);
		fs = keys;
	}

	const setSql = fs.map((field) => `"${field}" = "t"."${field}"`).join(", ");
	const fieldsSql = fs.map((f) => `"${f}"`).join(", ");

	let paramIndex = 0;
	const valuesSql = data.map((row) => `(${Object.values(row).map(() => `\$${++paramIndex}`)})`).join(",");

	const sql = `UPDATE "${table}" SET ${setSql} FROM (VALUES ${valuesSql}) AS t("${id}", ${fieldsSql}) WHERE "${table}"."${id}" = "t"."${id}"`;

	return client.$executeRawUnsafe(
		sql,
		...data.reduce((acc: Array<string | number | boolean>, row) => [...acc, row[id], ...fs.map((f) => row[f])], [])
	);
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
