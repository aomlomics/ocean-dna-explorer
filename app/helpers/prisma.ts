import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@/types/globals";
import { deepMerge, isObject, uncapitalizeTable } from "./utils";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/client";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getRelationPath } from "./schema";
import TableMetadata from "@/types/tableMetadata";

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

const projectTables = ["Sample", "AssayPrep", "Library"] as Prisma.ModelName[];
const analysisTables = [
	"Occurrence",
	"Assignment",
	"Feature",
	"Taxonomy",
	"AlphaDiversity",
	"AlphaDiversityIndex",
	"Assay",
	"Tag"
] as Prisma.ModelName[];
const privatableTables = ["Project", "Analysis"] as Prisma.ModelName[];
//these must be one step away from a project or analysis, otherwise a where clause can't be nested deep enough
const publicTables = ["Assay", "Tag"] as Prisma.ModelName[];

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
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					let typedArgs = args as { where?: any; [key: string]: any };

					if (readOperations.includes(operation)) {
						let { signedOutQuery } = buildNestedQueries(model);

						const newWhere = getWhere({
							where: typedArgs.where,
							signedOutQuery
						});

						if (publicTables.includes(model) || model === "Project") {
							//show correct analyses for projects (select, include, _count, etc.)
							if (model === "Project") {
								signedOutQuery = { Analyses: signedOutQuery };
							}

							const { where, ...rest } = typedArgs;
							typedArgs = {
								where:
									isObject(where) && privatableTables.some((t) => t in where || TableMetadata[t].plural in where)
										? newWhere
										: where,
								...mergePublicQuery({
									args: rest as Record<string, Record<string, any>>,
									signedOutQuery
								})
							};
						} else {
							typedArgs.where = newWhere;
						}
					}

					return await query(typedArgs);
				}
			}
		}
	});

//prisma client that can get private data only if current user is authorized to
const prisma =
	globalForPrisma.prisma ||
	unsafePrisma.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					let typedArgs = args as { where?: any; [key: string]: any };

					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						let { signedOutQuery, userIdsQuery } = buildNestedQueries(model, userId);

						const newWhere = getWhere({
							where: typedArgs.where,
							userId,
							role,
							signedOutQuery,
							noPermQuery: {
								OR: [signedOutQuery, userIdsQuery!]
							}
						});

						if (publicTables.includes(model) || model === "Project") {
							//show correct analyses for projects (select, include, _count, etc.)
							if (model === "Project") {
								signedOutQuery = { Analyses: signedOutQuery };
								userIdsQuery = { Analyses: userIdsQuery! };
							}

							const { where, ...rest } = typedArgs;
							typedArgs = {
								where:
									isObject(where) && privatableTables.some((t) => t in where || TableMetadata[t].plural in where)
										? newWhere
										: where,
								...mergePublicQuery({
									args: rest as Record<string, Record<string, any>>,
									userId,
									role,
									signedOutQuery,
									noPermQuery: {
										OR: [signedOutQuery, userIdsQuery!]
									}
								})
							};
						} else {
							typedArgs.where = newWhere;
						}
					}

					return await query(typedArgs);
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

type NestedSignedOutQuery =
	| {
			isPrivate: false;
	  }
	| { [key: string]: NestedSignedOutQuery | { some: NestedSignedOutQuery } };
type NestedUserIdsQuery =
	| {
			userIds: {
				has: string | null;
			};
	  }
	| { [key: string]: NestedUserIdsQuery | { some: NestedUserIdsQuery } };

function buildNestedQueries(model: Prisma.ModelName, userId?: string | null) {
	let signedOutQuery = {
		isPrivate: false
	} as NestedSignedOutQuery;
	let userIdsQuery = undefined as NestedUserIdsQuery | undefined;
	if (userId) {
		userIdsQuery = {
			userIds: {
				has: userId
			}
		};

		//only projects have userIds
		if (model === "Analysis" || analysisTables.includes(model)) {
			userIdsQuery = { Project: userIdsQuery };
		}
	}

	if (model !== "Project" && model !== "Analysis") {
		let path;
		if (projectTables.includes(model)) {
			path = getRelationPath(uncapitalizeTable(model), "project");
		} else if (analysisTables.includes(model)) {
			path = getRelationPath(uncapitalizeTable(model), "analysis");
		}

		for (const rel of path!.toReversed()) {
			if (rel.type.endsWith("many")) {
				//if relation is a -to-many, add a some to the query
				signedOutQuery = { [rel.field]: { some: signedOutQuery } };
				if (userIdsQuery) {
					userIdsQuery = { [rel.field]: { some: userIdsQuery } };
				}
			} else {
				signedOutQuery = { [rel.field]: signedOutQuery };
				if (userIdsQuery) {
					userIdsQuery = { [rel.field]: userIdsQuery };
				}
			}
		}
	}

	return { signedOutQuery, userIdsQuery };
}

function mergePublicQuery({
	args,
	userId,
	role,
	signedOutQuery,
	noPermQuery
}: {
	args: Record<string, Record<string, any>>;
	userId?: string | null;
	role?: Role | undefined;
	signedOutQuery: NestedSignedOutQuery;
	noPermQuery?: { OR: [NestedSignedOutQuery, NestedUserIdsQuery] };
}) {
	const results = {} as Record<string, any>;
	for (const key in args) {
		results[key] = args[key];

		if (privatableTables.some((t) => key === t || key === TableMetadata[t].plural)) {
			//inject where into query if it doesn't exist (select, include, _count, etc.)
			const obj = isObject(args[key]) ? args[key] : {};
			let where = getWhere({
				where: obj.where || {},
				userId,
				role,
				signedOutQuery,
				noPermQuery
			});

			if (Object.keys(where).length) {
				where = where[key];
				results[key] = {
					...obj,
					where: "some" in where ? where.some : where
				};
			}
		} else if (isObject(args[key])) {
			results[key] = mergePublicQuery({ args: args[key], userId, role, signedOutQuery, noPermQuery });
		}
	}

	return results;
}

function getWhere({
	where,
	userId,
	role,
	signedOutQuery,
	noPermQuery
}: {
	where: any;
	userId?: string | null;
	role?: Role | undefined;
	signedOutQuery: NestedSignedOutQuery;
	noPermQuery?: { OR: [NestedSignedOutQuery, NestedUserIdsQuery] };
}) {
	if (!userId) {
		if (where) {
			return deepMerge({ ...where }, signedOutQuery);
		} else {
			return signedOutQuery;
		}
	} else if (!role || !RolePermissions[role].includes("manageUsers")) {
		if (where) {
			if (noPermQuery) {
				return deepMerge({ ...where }, noPermQuery);
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
