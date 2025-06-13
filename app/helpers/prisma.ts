import { RolePermissions } from "@/types/objects";
import { Prisma } from "../generated/prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NetworkPacket } from "@/types/globals";
import { DynamicClientExtensionThis, InternalArgs } from "@prisma/client/runtime/library";

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

const secureFields = ["userIds"];

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
const omittableOperations = [
	"findUnique",
	"findFirst",
	"findMany",
	"create",
	"update",
	"upsert",
	"delete",
	"createManyAndReturn",
	"updateManyAndReturn"
];

//database initialization
const globalForPrisma = global as unknown as {
	unsafePrisma: PrismaClient;
	publicPrisma: PrismaExtension;
	prisma: PrismaExtension;
	securePrisma: PrismaExtension;
};

//prisma client with no restrictions
const unsafePrisma =
	globalForPrisma.unsafePrisma ||
	new PrismaClient({
		log: [
			// {
			// 	emit: "event",
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
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						//@ts-ignore
						args.where = {
							//@ts-ignore
							...args.where,
							isPrivate: false
						};
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
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;
						if (!role || !RolePermissions[role].includes("manageUsers")) {
							//@ts-ignore
							args.where = {
								//@ts-ignore
								...args.where,
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
							};
						}
					}

					return await query(args);
				}
			}
		}
	});

//prisma client that can never get private data and never includes secure fields
const securePrisma =
	globalForPrisma.securePrisma ||
	unsafePrisma.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					if (readOperations.includes(operation)) {
						const { userId, sessionClaims } = await auth();
						const role = sessionClaims?.metadata?.role;
						if (!role || !RolePermissions[role].includes("manageUsers")) {
							//@ts-ignore
							args.where = {
								//@ts-ignore
								...args.where,
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
							};
						}
					}

					//remove secure fields from every part of the query
					for (let [key, value] of Object.entries(args)) {
						if (Array.isArray(value)) {
							for (let field of secureFields) {
								const index = value.indexOf(field);
								if (index !== -1) {
									value.splice(index, 1);
								}
							}

							if (value.length === 0) {
								//@ts-ignore
								delete args[key];
							}
						} else if (typeof value === "object") {
							for (let field of secureFields) {
								if (field in value) {
									delete value[field];
								}
							}

							if (Object.keys(value).length === 0) {
								//@ts-ignore
								delete args[key];
							}
						}
					}

					if (omittableOperations.includes(operation)) {
						//@ts-ignore
						if (!args.select && !args.include) {
							let omit = {};
							//@ts-ignore
							if (args.omit) {
								//@ts-ignore
								omit = args.omit;
							}
							//@ts-ignore
							args.omit = { ...omit, ...secureFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}) };
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
	globalForPrisma.securePrisma = securePrisma;
}

export { unsafePrisma, publicPrisma, prisma, securePrisma };

//database helper functions
export async function batchSubmit(
	prisma: any,
	data: any[],
	table: Lowercase<Prisma.ModelName>,
	field: string,
	userId: string,
	isPrivate: boolean | undefined
) {
	const newRows = await prisma[table].createManyAndReturn({
		data,
		skipDuplicates: true,
		select: {
			[field]: true
		}
	});

	//add userId to existing (batching)
	const existingRowsSet = new Set(newRows.map((e: { [field]: any }) => e[field]));
	const existingRows = data.reduce((acc, e) => {
		if (!existingRowsSet.has(e[field])) {
			acc.push(e[field]);
		}
		return acc;
	}, [] as string[]);
	const userIdBatches = [];
	while (existingRows.length) {
		userIdBatches.push(existingRows.splice(0, 30000));
	}
	for (let batch of userIdBatches) {
		await prisma[table].updateMany({
			where: {
				[field]: {
					in: batch
				},
				NOT: {
					userIds: {
						has: userId
					}
				}
			},
			data: {
				userIds: {
					push: userId
				}
			}
		});
	}

	//private
	if (!isPrivate) {
		const privateBatches = [];
		const rows = data.map((e) => e[field]);
		while (rows.length) {
			privateBatches.push(rows.splice(0, 30000));
		}
		for (let batch of privateBatches) {
			await prisma[table].updateMany({
				where: {
					[field]: {
						in: batch
					},
					isPrivate: true
				},
				data: {
					isPrivate: false
				}
			});
		}
	}
}

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

export function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): NetworkPacket {
	if (err.code === "P2002") {
		return {
			statusMessage: "error",
			error: `${err.meta?.modelName} with provided ${(err.meta?.target as string[])[0]} already exists in database.`
		};
	} else {
		return {
			statusMessage: "error",
			error: err.message
		};
	}
}
