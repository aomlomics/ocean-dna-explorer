import { deepWhere, prisma } from "@/app/helpers/prisma";
import { getZodType, parseNestedJson } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";

type ParamsArray = Array<[string, string, string] | ParamsArray>;

function parseToQuery(
	table: Lowercase<Prisma.ModelName>,
	queryArr: [string] | [string, string] | [string, string, string]
) {
	if (queryArr.length === 1) {
		//search entire table for value
		const value = queryArr[0];
		const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
		for (const field of TableMetadata[table].enumSchema._def.values) {
			const type = getZodType(TableMetadata[table].schema.shape[field]).type;
			if (!type) {
				throw new Error(
					`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
				);
			}
			if (type === "string") {
				ors.push({ [field]: { contains: value, mode: "insensitive" } });
			}
		}

		if (ors.length) {
			return { OR: ors };
		}
	}

	let relation = "" as Lowercase<Prisma.ModelName>;
	let field = "";
	let value = null as unknown as string;
	if (queryArr.length === 2) {
		//search field for value
		field = queryArr[0];
		value = queryArr[1];
	} else if (queryArr.length === 3) {
		//search related table's field for value
		relation = queryArr[0].toLowerCase() as Lowercase<Prisma.ModelName>;
		field = queryArr[1];
		value = queryArr[2];
	}

	const type = getZodType(TableMetadata[relation || table].schema.shape[field]).type;
	if (!type) {
		throw new Error(
			`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${
				relation || table
			}'.`
		);
	}

	let searchWhere = undefined as unknown as string | number | Date | { contains: string; mode: "insensitive" };
	if (type === "string") {
		searchWhere = { contains: value, mode: "insensitive" };
	} else if (type === "integer") {
		const val = parseInt(value);
		if (isNaN(val)) {
			searchWhere = -1;
		} else {
			searchWhere = val;
		}
	} else if (type === "float") {
		const val = parseFloat(value);
		if (isNaN(val)) {
			searchWhere = -1;
		} else {
			searchWhere = val;
		}
	} else if (type === "date") {
		const val = Date.parse(value);
		if (isNaN(val)) {
			searchWhere = new Date(0);
		} else {
			searchWhere = val;
		}
	} else if (type === "string[]") {
		//TODO: add string arrays back to schema once Prisma supports contains on arrays
	} else if (type === "integer[]" || type === "float[]") {
		//TODO: add support to query ranges
	}

	if (searchWhere) {
		if (relation) {
			return deepWhere(table, relation, { [field]: value });
		} else {
			return { [field]: searchWhere };
		}
	} else {
		return {};
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName> }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((table) => table.toLowerCase() === lowercaseTable)) {
		try {
			const { searchParams } = new URL(request.url);

			const query = {
				orderBy: {
					id: "asc"
				}
			} as {
				orderBy: { id: Prisma.SortOrder };
				where?: Record<string, any>;
				take?: number;
				skip?: number;
				// cursor?: { id: number };
				include?: { _count: { select: Record<string, boolean> } };
			};

			const orderBy = searchParams.get("orderBy");
			if (orderBy) {
				query.orderBy = JSON.parse(orderBy);
			}

			const whereStr = searchParams.get("where");
			if (whereStr) {
				query.where = parseNestedJson(whereStr);

				if (query.where?.advanced) {
					function parseAdvancedQuery(
						e: ParamsArray[0]
					): ReturnType<typeof parseToQuery> | { OR: ReturnType<typeof parseToQuery> } {
						if (typeof e[0] === "string") {
							return parseToQuery(table, e as [string, string, string]);
						} else {
							const paramsE = e as ParamsArray;
							return { OR: paramsE.map(parseAdvancedQuery) };
						}
					}

					const advanced = query.where.advanced as ParamsArray;
					delete query.where.advanced;

					query.where = { ...advanced.reduce((acc, e) => ({ ...acc, ...parseAdvancedQuery(e) }), {}), ...query.where };
				}

				if (query.where?.search) {
					const search = query.where.search.split(",");
					delete query.where.search;

					query.where = { ...parseToQuery(table, search), ...query.where };
				}
			}

			const take = searchParams.get("take");
			if (!take) {
				throw new Error("take is required");
			}
			query.take = parseInt(take);

			const page = searchParams.get("page");
			if (page) {
				//offset pagination
				query.skip = (parseInt(page) - 1) * query.take;
			}

			const relCounts = searchParams.get("relCounts");
			if (relCounts) {
				query.include = {
					_count: {
						select: relCounts
							.split(",")
							.reduce((acc: Record<string, boolean>, rel: string) => ({ ...acc, [rel]: true }), {})
					}
				};
			}

			const [result, count] = await prisma.$transaction([
				//@ts-ignore
				prisma[lowercaseTable].findMany(query),
				//@ts-ignore
				prisma[lowercaseTable].count({ where: query.where })
			]);

			return NextResponse.json({ statusMessage: "success", result, count });
		} catch (err) {
			const error = err as Error;
			console.log(error.message);

			return NextResponse.json({ statusMessage: "error", error: error.message }, { status: 400 });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
