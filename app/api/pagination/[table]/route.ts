import { securePrisma } from "@/app/helpers/prisma";
import { getZodType, parseNestedJson } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";

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

				const shape = TableMetadata[table].schema.shape;
				if (query.where?.search) {
					const search = query.where?.search.split(",");
					const field = search[0];
					const value = search[1];
					delete query.where?.search;

					const type = getZodType(shape[field as keyof typeof shape]).type;
					if (!type) {
						throw new Error(
							`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
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
					}

					if (!query.where[field] && searchWhere) {
						query.where[field] = searchWhere;
					}
				}
			}

			const take = searchParams.get("take");
			if (!take) {
				throw new Error("take is required");
			}
			query.take = parseInt(take);

			const page = searchParams.get("page");
			//const cursorId = searchParams.get("cursorId");
			if (page) {
				//offset pagination
				query.skip = (parseInt(page) - 1) * query.take;
			}
			//} else if (cursorId) {
			//	const dir = searchParams.get("dir");
			//	//cursor pagination
			//	findMany.skip = 1;
			//	findMany.cursor = {
			//		id: parseInt(cursorId)
			//	};
			//	if (dir) {
			//		findMany.take *= parseInt(dir);
			//	}
			//}

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

			const [result, count] = await securePrisma.$transaction([
				//@ts-ignore
				securePrisma[lowercaseTable].findMany(query),
				//@ts-ignore
				securePrisma[lowercaseTable].count({ where: query.where })
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
