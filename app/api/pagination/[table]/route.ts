import { prisma } from "@/app/helpers/prisma";
import { parseNestedJson } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket, ParamsArray } from "@/types/globals";
import { parseAdvancedQuery, parseSearchQuery, parseToQuery } from "@/app/helpers/queries";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName> }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((t) => t.toLowerCase() === lowercaseTable)) {
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
				const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

				if (parsed.advanced) {
					const advanced = parsed.advanced as ParamsArray;
					delete parsed.advanced;

					try {
						query.where = parseAdvancedQuery(lowercaseTable, advanced);
					} catch (err) {
						const error = err as Error;
						return NextResponse.json({ statusMessage: "error", error: error.message });
					}
				} else if (parsed.search) {
					const search = parsed.search;
					delete parsed.search;

					query.where = parseSearchQuery(lowercaseTable, search);
				}

				for (const filter of Object.entries(parsed as Record<string, string>)) {
					query.where = { ...query.where, ...parseToQuery(lowercaseTable, filter) };
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

			return NextResponse.json({ statusMessage: "error", error: error.message });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
