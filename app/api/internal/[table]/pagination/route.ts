import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { capitalizeTable, deepMerge, getLocationsInsideShapes } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import type { NetworkPacket } from "@/types/globals";
import { deepWhere } from "@/app/helpers/api";
import { parseApiQuery } from "@/app/helpers/api";
import TableMetadata from "@/types/tableMetadata";
import type { MapLocation } from "@/types/globals";
import { getDataTableName } from "@/app/helpers/schema";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { fetchBlast } from "@/app/helpers/blast";

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

		const parsedQuery = parseApiQuery(model, searchParams, {
			features: {
				orderBy: true,
				relations: true,
				relCounts: true,
				limit: true,
				filters: true,
				advanced: true,
				search: true
			},
			extras: {
				blast: true,
				shapes: true,
				deepRelations: true
			}
		});
		const { query, blast, shapes, getSamples, hasLocationData, limit, page, deepRelsArray } = parsedQuery;
		let { sampleWhere } = parsedQuery;
		const client = parsedQuery.trusted ? trustedPrisma : prisma;

		if (!limit) {
			throw new Error("The limit option is required on this route.");
		}

		let BlastQueryResults;
		let existingBlastDate;
		let featureidWhere;
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

		let samples;
		let result: any[];
		if (hasLocationData && sampleWhere) {
			//skip extra database call on sample table
			samples = await client.sample.findMany(query);
			result = [...samples];
		} else {
			if (sampleWhere) {
				//TODO: breaks with a sample query in nested group
				//replace the where with samp_names that match the query and are inside the shapes
				samples = await client.sample.findMany({
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

			//skip database pagination if doing later
			if (!(shapes && hasLocationData)) {
				if (page) {
					//offset pagination
					query.skip = (page - 1) * limit;
				}
				query.take = limit;
			}

			//@ts-expect-error dynamically accessing prisma client
			result = await client[model].findMany(query);
		}

		//paginate using shapes and location data
		if (shapes && hasLocationData) {
			result = getLocationsInsideShapes(result as MapLocation[], shapes);
		}

		//manually paginate
		if (result.length > limit) {
			const start = page ? (page - 1) * limit : 0;
			result = result.slice(start, start + limit);
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

			const queryResults = await client.$transaction(
				queries.map((query) => client.$queryRaw<Record<string, string | number>[]>(query)),
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
			BlastQueryResults,
			existingBlastDate,
			samples: getSamples ? samples : undefined
		});
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
