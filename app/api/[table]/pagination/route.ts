import { prisma } from "@/app/helpers/prisma";
import { getLocationsInsideShapes, getShapesFromUrl, parseNestedJson, uncapitalizeTable } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket, ParamsArray } from "@/types/globals";
import { parseAdvancedQuery, parseSearchQuery, parseToQuery } from "@/app/helpers/queries";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import { Location } from "@/types/globals";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: String }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const model = DataTableNames.find((model) => model.toLowerCase() === table.toLowerCase()) as Prisma.ModelName;
	if (model) {
		const uncapsTable = uncapitalizeTable(model);

		try {
			const { searchParams } = new URL(request.url);

			const query = {
				orderBy: {
					id: "desc"
				}
			} as {
				orderBy: { [field: string]: Prisma.SortOrder | { _count: Prisma.SortOrder } };
				where?: Record<string, any>;
				take?: number;
				skip?: number;
				include?: {
					_count?: { select: Record<string, boolean> };
					[key: string]: any;
				};
			};

			const whereStr = searchParams.get("where");
			if (whereStr) {
				const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

				if (parsed.advanced) {
					const advanced = parsed.advanced as ParamsArray;
					delete parsed.advanced;

					try {
						query.where = parseAdvancedQuery(uncapsTable, advanced);
					} catch (err) {
						const error = err as Error;
						return NextResponse.json({ statusMessage: "error", error: error.message });
					}
				} else if (parsed.search) {
					const search = parsed.search;
					delete parsed.search;

					query.where = parseSearchQuery(uncapsTable, search);
				}

				for (const filter of Object.entries(parsed as Record<string, string>)) {
					query.where = { ...query.where, ...parseToQuery(uncapsTable, filter) };
				}
			}

			//@ts-ignore
			let count = await prisma[uncapsTable].count({ where: query.where });

			const orderByStr = searchParams.get("orderBy");
			if (orderByStr) {
				const split = orderByStr?.split(",");
				if (split.length === 2 && (split[1] === "asc" || split[1] === "desc")) {
					if (TableMetadata[uncapsTable].enumSchema.options.includes(split[0])) {
						query.orderBy = {
							[split[0]]: split[1]
						};
					} else if (
						TableMetadata[uncapsTable].relations.find((rel) => rel.field === split[0] && rel.type.endsWith("many"))
					) {
						query.orderBy = {
							[split[0]]: {
								_count: split[1]
							}
						};
					} else {
						throw new Error("The orderBy must be a field or a -to-many relation.");
					}
				} else {
					throw new Error("The orderBy must be a field and order separated by a comma.");
				}
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

			const relations = searchParams.get("relations");
			if (relations) {
				if (!query.include) {
					query.include = {};
				}

				const relationsAllFields = searchParams.get("relationsAllFields");
				const relationsArr = relations.split(",");
				if (relationsAllFields) {
					for (const rel of relationsArr) {
						query.include[rel] = true;
					}
				} else {
					for (const rel of relationsArr) {
						query.include[rel] = { select: { id: true } };
					}
				}
			}

			let take = searchParams.get("take");
			if (!take) {
				throw new Error("Take is required");
			}
			const parsedTake = parseInt(take);
			if (isNaN(parsedTake) || parsedTake < 1) {
				throw new Error(`Take must be a positive integer, but is "${take}".`);
			}

			const page = searchParams.get("page");
			let parsedPage;
			if (page) {
				parsedPage = parseInt(page);
				if (isNaN(parsedPage) || parsedPage < 1) {
					throw new Error(`Page must be a positive integer, but is "${page}".`);
				}
			}

			//give last page if page is too large
			if (parsedPage && (parsedPage - 1) * parsedTake > count) {
				parsedPage = Math.floor(count / parsedTake) + 1;
			}

			const polygons = searchParams.getAll("polygon");
			const circles = searchParams.getAll("circle");
			let shapes;
			// Only process shapes if at least one polygon or circle was provided
			if (polygons.length || circles.length) {
				//skip database pagination
				shapes = getShapesFromUrl(searchParams);
			} else {
				query.take = parsedTake;

				if (parsedPage) {
					//offset pagination
					query.skip = (parsedPage - 1) * query.take;
				}
			}

			//@ts-ignore
			let result = await prisma[uncapsTable].findMany(query);

			if (shapes) {
				result = getLocationsInsideShapes(result as Location[], shapes);
				count = result.length;
				//give last page if page is too large
				if (parsedPage && (parsedPage - 1) * parsedTake > count) {
					parsedPage = Math.floor(count / parsedTake) + 1;
				}
				//manually paginate
				const start = parsedPage ? (parsedPage - 1) * parsedTake : 0;
				result = result.slice(start, start + parsedTake);
			}

			return NextResponse.json({ statusMessage: "success", result, count });
		} catch (err) {
			const error = err as Error;

			return NextResponse.json({ statusMessage: "error", error: error.message });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
