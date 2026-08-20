import { cookies } from "next/headers";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import TableMetadata from "@/types/tableMetadata";

type PrismaArgs = Record<string, any>;

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
const uniqueOperations = ["findUnique", "findUniqueOrThrow"];

//database initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient; trustedPrisma: PrismaClient };

//client that gets all data
const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL }) });

//client that uses cookie to determine whether to only read trusted data
const trustedPrisma =
	globalForPrisma.trustedPrisma ||
	prisma.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					let typedArgs = args as PrismaArgs;

					if (readOperations.includes(operation)) {
						const cookieStore = await cookies();
						const trusted = cookieStore.get("trusted")?.value !== "false";
						if (trusted) {
							typedArgs = injectTrustedIntoQuery(model, typedArgs, operation);
						}
					}

					return await query(typedArgs);
				}
			}
		}
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
	globalForPrisma.trustedPrisma = trustedPrisma;
}

export { prisma, trustedPrisma };

function isObject(item: any) {
	return item && typeof item === "object" && item !== null && !Array.isArray(item);
}

function mergeWhere(
	existingWhere: Record<string, any> | undefined,
	trustedWhere: Record<string, any> | undefined,
	operation?: (typeof readOperations)[number]
) {
	if (!trustedWhere) return existingWhere;

	if (!existingWhere || Object.keys(existingWhere).length === 0) {
		return trustedWhere;
	}

	//merge directly if operation doesn't support root AND
	if (operation && uniqueOperations.includes(operation)) {
		return {
			...existingWhere,
			...trustedWhere
		};
	}

	return {
		AND: [existingWhere, trustedWhere]
	};
}

function getTrustedWhere(table: Prisma.ModelName) {
	let where: Record<string, any> = {
		trusted: true
	};

	if (table === "Analysis") {
		return where;
	}

	const path = TableMetadata[table].relationPaths.analysis;
	if (path) {
		return path.toReversed().reduce<Record<string, any>>((where, relation) => {
			if (relation.type.endsWith("many")) {
				return {
					[relation.field]: {
						some: where
					}
				};
			} else {
				return {
					[relation.field]: where
				};
			}
		}, where);
	}
}

function injectTrustedIntoCountSelection(selection: Record<string, any>, model: Prisma.ModelName): Record<string, any> {
	const result: Record<string, any> = {};

	for (const [field, value] of Object.entries(selection)) {
		const relation = TableMetadata[model].relations.find((rel) => rel.field === field);

		if (!relation) {
			result[field] = value;
		} else {
			const trustedWhere = getTrustedWhere(relation.table);

			if (!trustedWhere) {
				result[field] = value;
			} else if (value === true) {
				result[field] = {
					where: trustedWhere
				};
			} else if (isObject(value)) {
				result[field] = {
					...value,
					where: mergeWhere(value.where, trustedWhere)
				};
			} else {
				result[field] = value;
			}
		}
	}

	return result;
}

function buildTrustedCountSelection(model: Prisma.ModelName) {
	return {
		select: injectTrustedIntoCountSelection(
			Object.fromEntries(
				TableMetadata[model].relations.filter((rel) => rel.type.endsWith("many")).map((rel) => [rel.field, true])
			),
			model
		)
	};
}

//recursively transforms select/include arguments
function injectTrustedIntoSelection(selection: Record<string, any>, model: Prisma.ModelName): Record<string, any> {
	const result: Record<string, any> = {};

	for (const [field, value] of Object.entries(selection)) {
		//_count can occur inside both select and include
		if (field === "_count") {
			if (value === true) {
				result[field] = buildTrustedCountSelection(model);
			} else if (isObject(value)) {
				result[field] = {
					...value,
					...(isObject(value.select)
						? {
								select: injectTrustedIntoCountSelection(value.select, model)
							}
						: {})
				};
			} else {
				result[field] = value;
			}
		} else if (!isObject(value)) {
			//ignore scalar field
			result[field] = value;
		} else {
			const relation = TableMetadata[model].relations.find((rel) => rel.field === field);

			if (!relation) {
				//ignore any field that's not a relation
				result[field] = value;
			} else {
				const relatedModel = relation.table;

				//including everything with "true" becomes an empty argument object so we can inject where
				const relationArgs = value === true ? {} : value;

				//recursively process nested select/include/_count
				const nestedArgs = injectTrustedIntoArgs(relationArgs, relatedModel);

				//only add where on -to-many relations
				if (relation.type.endsWith("many")) {
					nestedArgs.where = mergeWhere(nestedArgs.where, getTrustedWhere(relatedModel));
				}

				result[field] = nestedArgs;
			}
		}
	}

	return result;
}

function injectTrustedIntoArgs(args: Record<string, any>, model: Prisma.ModelName): Record<string, any> {
	const result = {
		...args
	};

	//nested select
	if (isObject(args.select)) {
		result.select = injectTrustedIntoSelection(args.select, model);
	}

	//nested include
	if (isObject(args.include)) {
		result.include = injectTrustedIntoSelection(args.include, model);
	}

	//relation counts
	if (args._count === true) {
		result._count = buildTrustedCountSelection(model);
	} else if (isObject(args._count) && isObject(args._count.select)) {
		result._count = {
			...args._count,
			select: injectTrustedIntoCountSelection(args._count.select, model)
		};
	}

	return result;
}

function injectTrustedIntoQuery(
	model: Prisma.ModelName,
	args: Record<string, any>,
	operation: (typeof readOperations)[number]
) {
	const trustedWhere = getTrustedWhere(model);

	return injectTrustedIntoArgs(
		{
			...args,
			...(trustedWhere
				? {
						where: mergeWhere(args.where, trustedWhere, operation)
					}
				: {})
		},
		model
	);
}
