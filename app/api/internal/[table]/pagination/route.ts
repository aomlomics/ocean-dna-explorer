import { trustedPrisma } from "@/app/helpers/prisma";
import {
	capitalizeTable,
	deepMerge,
	getLocationsInsideShapes,
	getShapesFromUrl,
	parseNestedJson,
	uncapitalizeTable
} from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import type { NetworkPacket, ParamsArray } from "@/types/globals";
import { deepWhere, parseAdvancedQuery, parseSearchQuery, parseToQuery } from "@/app/helpers/api";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import type { MapLocation } from "@/types/globals";
import { getDataTableName, getTableName } from "@/app/helpers/schema";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { fetchBlast, parseBlastRequest } from "@/app/helpers/blast";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const { sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

	const cookieStore = await cookies();

	try {
		const model = getDataTableName(table);

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

		const shapes = getShapesFromUrl(searchParams);
		if (shapes) {
			//skips database pagination
			searchParams.delete("polygon");
			searchParams.delete("circle");
		}
		const hasLocationData =
			TableMetadata[model].enumSchema.options.includes("decimalLatitude") &&
			TableMetadata[model].enumSchema.options.includes("decimalLongitude");

		let sampleWhere;
		const getSamples = searchParams.get("getSamples")?.toLowerCase() === "true";
		const whereStr = searchParams.get("where");
		if (whereStr != null) {
			const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

			if (parsed.advanced) {
				const advanced = parsed.advanced as ParamsArray;
				delete parsed.advanced;
				if (Object.keys(parsed).length) {
					throw new Error("Advanced search may not include other filter parameters.");
				}

				query.where = parseAdvancedQuery(model, advanced);

				//assemble secondary query if table doesn't have location data
				if (getSamples || (shapes && !hasLocationData)) {
					sampleWhere = parseAdvancedQuery(model, advanced, "sample");
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
				if (getSamples || (shapes && !hasLocationData)) {
					sampleWhere = deepWhere("sample", model, query.where);
				}
			}
		} else if (getSamples || (shapes && !hasLocationData)) {
			//still get samples
			sampleWhere = {};
		}

		let BlastQueryResults;
		let existingBlastDate;
		let featureidWhere;
		const blast = parseBlastRequest(searchParams);
		if (blast) {
			({ BlastQueryResults, existingBlastDate } = await fetchBlast(
				blast,
				{ role, token: await getToken({ expiresInSeconds: 60 }) },
				cookieStore
			));
			const baseFeatureWhere = {
				featureid: {
					in: BlastQueryResults.map((bqr) => bqr.featureid)
				}
			};
			featureidWhere = deepWhere(model, "feature", baseFeatureWhere);

			if (sampleWhere) {
				sampleWhere = deepMerge(sampleWhere, deepWhere("sample", "feature", baseFeatureWhere));
			}
			query.where = query.where ? deepMerge(query.where, featureidWhere) : featureidWhere;
		}

		const orderByStr = searchParams.get("orderBy");
		if (orderByStr != null) {
			const split = orderByStr?.split(",");
			if (split.length === 2 && split[0] && (split[1] === "asc" || split[1] === "desc")) {
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
		if (relCounts != null) {
			query.include = {
				_count: {
					select: relCounts.split(",").reduce(
						(acc: Record<string, boolean>, rel: string) => ({
							...acc,
							[TableMetadata[model].relations.find((mr) => mr.table === capitalizeTable(getDataTableName(rel)))!.field]:
								true
						}),
						{}
					)
				}
			};
		}

		const relations = searchParams.get("relations");
		if (relations != null) {
			if (!query.include) {
				query.include = {};
			}

			const relationsAllFields = searchParams.get("relationsAllFields");
			const relationsArr = relations.split(",");
			let includeVal = { select: { id: true } } as { select: { id: true } } | true;
			if (relationsAllFields != null) {
				includeVal = true;
			}
			for (const rel of relationsArr) {
				query.include[
					TableMetadata[model].relations.find((mr) => mr.table === capitalizeTable(getTableName(rel)))!.field
				] = includeVal;
			}
		}

		//get deep relation data
		let deepRelsArray = undefined as Uncapitalize<Prisma.ModelName>[] | undefined;
		const deepRelations = searchParams.get("deepRelations");
		if (deepRelations) {
			//get relation tables
			if (deepRelations.toLowerCase() === "true") {
				//all relations
				deepRelsArray = DataTableNames.filter(
					(name) =>
						name !== model &&
						TableMetadata[model].relations.every(
							(rel) => uncapitalizeTable(rel.table) !== name && TableMetadata[model].relationPaths[name]
						)
				);
			} else {
				//comma separated list of relations
				deepRelsArray = deepRelations.split(",").map((rel) => {
					const name = getDataTableName(rel, `Deep relation named "${rel}" does not exist.`);

					return name;
				});
			}

			const alreadyDone = [] as typeof deepRelsArray;
			for (const dr of deepRelsArray) {
				const path = TableMetadata[model].relationPaths[dr];

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

		const tempTake = searchParams.get("take");
		if (tempTake == null) {
			throw new Error("Take is required");
		}
		const parsedTake = parseInt(tempTake);
		if (isNaN(parsedTake) || parsedTake < 1) {
			throw new Error(`Take must be a positive integer, but is "${tempTake}".`);
		}

		const page = searchParams.get("page");
		let parsedPage = undefined as number | undefined;
		if (page != null) {
			parsedPage = parseInt(page);
			if (isNaN(parsedPage) || parsedPage < 1) {
				throw new Error(`Page must be a positive integer, but is "${page}".`);
			}
		}

		let samples;
		let result: any[];
		let count;
		if (hasLocationData && sampleWhere) {
			//skip extra database call on sample table
			samples = await trustedPrisma.sample.findMany(query);
			result = [...samples];
			count = result.length;

			//give last page if page is too large
			if (parsedPage && (parsedPage - 1) * parsedTake > count) {
				parsedPage = Math.floor(count / parsedTake) + 1;
			}
		} else {
			if (sampleWhere) {
				//TODO: breaks with a sample query in nested group
				//replace the where with samp_names that match the query and are inside the shapes
				samples = await trustedPrisma.sample.findMany({
					where: sampleWhere,
					select: getSamples
						? undefined
						: {
								samp_name: true,
								decimalLatitude: true,
								decimalLongitude: true
							}
				});

				if (shapes) {
					const sampNamesWhere = deepWhere(model, "sample", {
						samp_name: { in: getLocationsInsideShapes(samples, shapes).map((samp) => samp.samp_name) }
					});
					//inject blast results if queried for
					query.where = featureidWhere ? deepMerge(sampNamesWhere, featureidWhere) : sampNamesWhere;
				}
			}

			const res = await trustedPrisma.$transaction(
				async (tx) => {
					//@ts-expect-error dynamically accessing prisma client
					const count = await tx[model].count({ where: query.where });

					//give last page if page is too large
					if (parsedPage && (parsedPage - 1) * parsedTake > count) {
						parsedPage = Math.floor(count / parsedTake) + 1;
					}

					//skip database pagination if doing later
					if (!(shapes && hasLocationData)) {
						if (parsedPage) {
							//offset pagination
							query.skip = (parsedPage - 1) * parsedTake;
						}
						query.take = parsedTake;
					}

					//@ts-expect-error dynamically accessing prisma client
					const result = await tx[model].findMany(query);

					return { count, result };
				},
				{
					timeout: 0.5 * 60 * 1000
				}
			);
			count = res.count;
			result = res.result;
		}

		//paginate using shapes and location data
		if (shapes && hasLocationData) {
			result = getLocationsInsideShapes(result as MapLocation[], shapes);
			count = result.length;
		}

		//manually paginate
		if (result.length > parsedTake) {
			const start = parsedPage ? (parsedPage - 1) * parsedTake : 0;
			result = result.slice(start, start + parsedTake);
		}

		//get deep relational counts
		if (result.length && deepRelsArray?.length) {
			const titleFieldArr =
				typeof TableMetadata[model].titleField === "string"
					? [TableMetadata[model].titleField]
					: TableMetadata[model].titleField;

			const queries = deepRelsArray.map((targetModel) => {
				const path = TableMetadata[model].relationPaths[targetModel]!;

				//build JOIN for relation path
				const joins = [];
				for (const [i, step] of path.entries()) {
					let stepTitleTable;
					if (step.type === "one-to-one" || step.type === "one-to-many") {
						stepTitleTable = i ? path[i - 1]!.table : capitalizeTable(model);
					} else if (step.type === "many-to-one") {
						stepTitleTable = step.table;
					} else {
						//TODO: handle many-to-many case
						throw new Error("Deep relations with many-to-many is not yet supported");
					}

					const tf = TableMetadata[stepTitleTable].titleField;
					const stepTitleFieldArr = typeof tf === "string" ? [tf] : tf;

					joins.push(
						Prisma.sql`
							LEFT JOIN ${Prisma.raw(`"${step.table}"`)} USING (${Prisma.join(
								stepTitleFieldArr.map((f) => Prisma.raw(`"${f}"`)),
								", "
							)})
						`
					);
				}

				const capsModel = capitalizeTable(model);

				//only get records in the result
				const rootConditions = result.map(
					(row) =>
						Prisma.sql`(
							${Prisma.join(
								titleFieldArr.map((field) => Prisma.sql`${Prisma.raw(`"${capsModel}"."${field}"`)} = ${row[field]}`),
								" AND "
							)}
						)`
				);

				//select root fields to reassociate with row data
				const selectFields = titleFieldArr.map((field) => Prisma.raw(`"${capsModel}"."${field}"`));

				//final query
				return Prisma.sql`
					SELECT
						${Prisma.join(selectFields, ", ")},
						COUNT(DISTINCT ${Prisma.raw(`"${capitalizeTable(targetModel)}".id`)})::int AS count
					FROM ${Prisma.raw(`"${capsModel}"`)}
					${Prisma.join(joins, " ")}
					WHERE ${Prisma.join(rootConditions, " OR ")}
					GROUP BY ${Prisma.join(selectFields, ", ")}
				`;
			});

			const queryResults = await trustedPrisma.$transaction(
				queries.map((query) => trustedPrisma.$queryRaw<Record<string, string | number>[]>(query)),
				{
					timeout: 0.5 * 60 * 1000
				}
			);

			//using null character as separator for efficient map lookup
			const sep = "\0";
			//recombine counts on result
			for (const [i, rows] of queryResults.entries()) {
				//assemble counts
				const counts = new Map() as Map<string, number>;
				for (const r of rows) {
					counts.set(titleFieldArr.map((field) => String(r[field])).join(sep), Number(r.count));
				}

				//attach to results
				for (const resRow of result) {
					resRow._count ??= {};
					resRow._count[TableMetadata[deepRelsArray[i]!].plural] =
						counts.get(titleFieldArr.map((field) => String(resRow[field])).join(sep)) ?? 0;
				}
			}
		}

		return NextResponse.json({
			statusMessage: "success",
			result,
			count,
			BlastQueryResults,
			existingBlastDate,
			samples: getSamples ? samples : undefined
		});
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
