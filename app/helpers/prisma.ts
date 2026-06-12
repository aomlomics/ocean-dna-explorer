import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@/types/globals";
import { deepMerge, uncapitalizeTable } from "./utils";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/client";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getRelationPath } from "./schema";

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
const publicTables = ["Assay", "Tag"] as Prisma.ModelName[];
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
					//TODO: handle assays and tags smarter (assays show private data on /explore/assay)
					if (readOperations.includes(operation)) {
						const { signedOutQuery } = buildNestedQueries(model);

						if (publicTables.includes(model)) {
							//find all instances of the key "analysis" or "analyses" and inject the queries into it
						} else {
							args = args as { where?: any; [key: string]: any };
							args.where = getWhere({
								where: args.where,
								signedOutQuery
							});
						}
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
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					//TODO: handle assays and tags smarter (assays show private data on /explore/assay)
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;

						const { signedOutQuery, userIdsQuery } = buildNestedQueries(model, userId);

						if (publicTables.includes(model)) {
							//find all instances of the key "analysis" or "analyses" and inject the queries into it
						} else {
							args = args as { where?: any; [key: string]: any };
							args.where = getWhere({
								where: args.where,
								userId,
								role,
								signedOutQuery,
								noPermQuery: {
									OR: [signedOutQuery, userIdsQuery!]
								}
							});
						}
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
