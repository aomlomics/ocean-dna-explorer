import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@/types/globals";
import { deepMerge } from "./utils";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/client";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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
	new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL }) });

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
