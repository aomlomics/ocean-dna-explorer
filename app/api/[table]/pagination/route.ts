import { prisma } from "@/app/helpers/prisma";
import {
	deepMerge,
	getLocationsInsideShapes,
	getShapesFromUrl,
	parseNestedJson,
	uncapitalizeTable
} from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket, ParamsArray } from "@/types/globals";
import { deepWhere, parseAdvancedQuery, parseSearchQuery, parseToQuery } from "@/app/helpers/queries";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { Location } from "@/types/globals";
import { getDataTableName, getRelationPath, getTableName } from "@/app/helpers/schema";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const model = getDataTableName(table);

	try {
		const { searchParams } = new URL(request.url);

		const query = {} as {
			orderBy?: { [field: string]: Prisma.SortOrder | { _count: Prisma.SortOrder } };
			where?: Record<string, any>;
			take?: number;
			skip?: number;
			include?: {
				_count?: { select: Record<string, boolean> };
				[key: string]: any;
			};
		};

		const polygons = searchParams.getAll("polygon");
		const circles = searchParams.getAll("circle");
		let shapes;
		// Only process shapes if at least one polygon or circle was provided
		if (polygons.length || circles.length) {
			//skip database pagination
			shapes = getShapesFromUrl(searchParams);
			searchParams.delete("polygon");
			searchParams.delete("circle");
		}

		let shapesSampleWhere;
		const whereStr = searchParams.get("where");
		if (whereStr) {
			const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

			if (parsed.advanced) {
				const advanced = parsed.advanced as ParamsArray;
				delete parsed.advanced;
				if (Object.keys(parsed).length) {
					throw new Error("Advanced search may not include other filter parameters.");
				}

				query.where = parseAdvancedQuery(model, advanced);

				//assemble secondary query if table doesn't have location data
				if (
					shapes &&
					(!TableMetadata[model].enumSchema.options.includes("decimalLatitude") ||
						!TableMetadata[model].enumSchema.options.includes("decimalLongitude"))
				) {
					shapesSampleWhere = parseAdvancedQuery(model, advanced, "sample");
				}
			} else {
				if (parsed.search) {
					const search = parsed.search;
					delete parsed.search;

					if (Object.keys(parsed).length) {
						throw new Error("Search may not include other filter parameters.");
					}

					query.where = parseSearchQuery(model, search);
				} else {
					query.where = {};
					for (const filter of Object.entries(parsed as Record<string, string>)) {
						query.where = { ...query.where, ...parseToQuery(model, filter) };
					}
				}

				//assemble secondary query if table doesn't have location data
				if (
					shapes &&
					(!TableMetadata[model].enumSchema.options.includes("decimalLatitude") ||
						!TableMetadata[model].enumSchema.options.includes("decimalLongitude"))
				) {
					shapesSampleWhere = deepWhere("sample", model, query.where);
				}
			}
		} else if (shapes) {
			shapesSampleWhere = {};
		}

		//replace the where with samp_names that match the query and are inside the shapes
		if (shapesSampleWhere) {
			const samples = await prisma.sample.findMany({
				where: shapesSampleWhere,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			});

			const sampsNamesInside = getLocationsInsideShapes(samples, shapes!).map((samp) => samp.samp_name);
			query.where = deepWhere(model, "sample", { samp_name: { in: sampsNamesInside } });
		}

		//@ts-ignore
		let count = await prisma[model].count({ where: query.where });

		const orderByStr = searchParams.get("orderBy");
		if (orderByStr) {
			const split = orderByStr?.split(",");
			if (split.length === 2 && (split[1] === "asc" || split[1] === "desc")) {
				if (TableMetadata[model].enumSchema.options.includes(split[0])) {
					query.orderBy = {
						[split[0]]: split[1]
					};
				} else if (TableMetadata[model].relations.find((rel) => rel.field === split[0] && rel.type.endsWith("many"))) {
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

		//get deep relation data
		let deepRelsArray = undefined as Uncapitalize<Prisma.ModelName>[] | undefined;
		const deepRelations = searchParams.get("deepRelations");
		if (deepRelations) {
			//get relation tables
			if (deepRelations === "true") {
				//all relations
				deepRelsArray = TableNames.filter(
					(name) =>
						name !== table &&
						TableMetadata[model].relations.every(
							(rel) => uncapitalizeTable(rel.table) !== name && getRelationPath(model, name)
						)
				);
			} else {
				//comma separated list of relations
				deepRelsArray = deepRelations.split(",").map((rel) => {
					const name = getTableName(rel, `Deep relation named "${rel}" does not exist.`);

					return name;
				});
			}

			const alreadyDone = [] as typeof deepRelsArray;
			for (const dr of deepRelsArray) {
				const path = getRelationPath(model, dr);

				if (!path) {
					throw new Error(`No path exists from "${model}" to "${dr}".`);
				}

				if (!path.some((p) => p.type.endsWith("many"))) {
					alreadyDone.push(dr);

					if (!query.include) {
						query.include = {};
					}

					let include =
						typeof TableMetadata[dr].titleField === "string"
							? { [TableMetadata[dr].titleField]: true }
							: TableMetadata[dr].titleField.reduce((acc, f) => ({ ...acc, [f]: true }), {});

					for (const rel of path.toReversed()) {
						include = { [rel.field]: { select: include } };
					}

					//maintain previous includes
					deepMerge(query.include, include);
				}
			}

			//remove deep relations that are already included in the query
			for (const ad of alreadyDone) {
				deepRelsArray.splice(deepRelsArray.indexOf(ad), 1);
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

		//skip pagination if doing it after the database call
		if (!(shapes && !shapesSampleWhere)) {
			query.take = parsedTake;

			if (parsedPage) {
				//offset pagination
				query.skip = (parsedPage - 1) * query.take;
			}
		}

		//@ts-ignore
		let result = await prisma[model].findMany(query);

		if (shapes && !shapesSampleWhere) {
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

		if (deepRelsArray?.length) {
			//do queries
			const deepTransactionResult = await prisma.$transaction(
				//for each row
				result.reduce(
					(acc: any[], res: Record<string, any>) => [
						...acc,
						//for each deep relation
						...deepRelsArray.map((dr) => {
							const path = getRelationPath(dr, model);

							if (path) {
								let where = { id: res.id } as Record<string, any>;

								//assemble full path
								for (const rel of path.toReversed()) {
									if (rel.type.endsWith("many")) {
										//if relation is a -to-many, add a some to the query
										where = { [rel.field]: { some: where } };
									} else {
										where = { [rel.field]: where };
									}
								}

								//only deep relations that are -to-many need to be gathered here
								//@ts-ignore
								return prisma[dr].count({
									where
								});
							} else {
								throw new Error(`Deep relation named "${dr}" has no path to target "${model}".`);
							}
						})
					],
					[]
				)
			);

			//assemble rows with extra data
			for (let i = 0; i < result.length; i++) {
				for (const rel of deepRelsArray) {
					const res = deepTransactionResult.shift();

					if (typeof res === "number") {
						result[i]._count[TableMetadata[rel].plural] = res;
					} else {
						result[i] = { ...result[i], ...res };
					}
				}
			}
		}

		return NextResponse.json({ statusMessage: "success", result, count });
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
