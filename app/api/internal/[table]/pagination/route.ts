import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { capitalizeTable, deepMerge, getLocationsInsideShapes, uncapitalizeTable } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import type { NetworkPacket } from "@/types/globals";
import { apiObjectToPrisma, deepWhere } from "@/app/helpers/api";
import { parseApiToObject } from "@/app/helpers/api";
import TableMetadata from "@/types/tableMetadata";
import type { MapLocation } from "@/types/globals";
import { getDataTableName } from "@/app/helpers/schema";
import { auth } from "@clerk/nextjs/server";
import { fetchBlast } from "@/app/helpers/blast";
import { getImplicitJoinTable } from "@/app/helpers/withDb";
import { AppError, GLOBAL_SERVER_ERROR } from "@/types/objects";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const { sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

	try {
		const model = getDataTableName(table);

		const { searchParams } = new URL(request.url);

		const parsedQuery = parseApiToObject(model, searchParams, {
			features: {
				orderBy: true,
				relations: true,
				relCounts: true,
				filters: true,
				advanced: true,
				limit: true,
				search: true
			},
			extras: {
				blast: true,
				shapes: true,
				deepRelations: true
			}
		});
		const { queryObject, blast, shapes, getSamples, hasLocationData, getSampleWhere } = parsedQuery;
		const client = parsedQuery.trusted ? trustedPrisma : prisma;

		const prismaQueries = apiObjectToPrisma(model, queryObject, { getSampleWhere });
		const { query } = prismaQueries;
		let { sampleWhere } = prismaQueries;

		if (!query.take) {
			throw new Error("The limit option is required on this route.");
		}

		let BlastQueryResults;
		let existingBlastDate;
		let featureidWhere;
		if (blast) {
			({ BlastQueryResults, existingBlastDate } = await fetchBlast(blast, {
				role,
				token: await getToken({ expiresInSeconds: 60 })
			}));
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
			samples = await client.sample.findMany(
				query as Omit<typeof query, "distinct"> & { distinct?: Prisma.SampleScalarFieldEnum[] }
			);
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
			if (shapes && hasLocationData) {
				delete query.take;
				delete query.skip;
			}

			//@ts-expect-error dynamically accessing prisma client
			result = await client[model].findMany(query);
		}

		//paginate using shapes and location data
		if (shapes && hasLocationData) {
			result = getLocationsInsideShapes(result as MapLocation[], shapes);
		}

		//manually paginate
		if (result.length > query.take!) {
			const start = query.skip ?? 0;
			result = result.slice(start, start + query.take!);
		}

		//get deep relational counts
		if (result.length && queryObject.deepRels?.length) {
			const titleFieldArr =
				typeof TableMetadata[model].titleField === "string"
					? [TableMetadata[model].titleField]
					: TableMetadata[model].titleField;

			const queries = await Promise.all(
				queryObject.deepRels.map(async (targetModel) => {
					const path = TableMetadata[model].relationPaths[targetModel]!;
					const capsModel = capitalizeTable(model);

					const joins = [];
					for (const [i, step] of path.entries()) {
						if (step.type === "many-to-many") {
							const stepTitleTable = i ? path[i - 1]!.table : capsModel;

							const implicitJoin = await getImplicitJoinTable({
								from: uncapitalizeTable(stepTitleTable),
								to: uncapitalizeTable(step.table)
							});

							const joinAlias = `jt${i}`;
							joins.push(
								Prisma.sql`
									LEFT JOIN ${Prisma.raw(`"${implicitJoin.table}"`)} AS ${Prisma.raw(joinAlias)}
										ON ${Prisma.raw(`"${stepTitleTable}"."${implicitJoin.from.column}"`)}
											= ${Prisma.raw(`${joinAlias}."${implicitJoin.from.joinColumn}"`)}

									LEFT JOIN ${Prisma.raw(`"${step.table}"`)}
										ON ${Prisma.raw(`${joinAlias}."${implicitJoin.to.joinColumn}"`)}
											= ${Prisma.raw(`"${step.table}"."${implicitJoin.to.column}"`)}
								`
							);
						} else {
							const prevTable = i ? path[i - 1]!.table : capsModel;
							const stepTitleTable = step.type.startsWith("one") ? prevTable : step.table;

							const tf = TableMetadata[stepTitleTable].titleField;
							const stepTitleFieldArr = typeof tf === "string" ? [tf] : tf;

							joins.push(
								Prisma.sql`
									LEFT JOIN ${Prisma.raw(`"${step.table}"`)}
									ON ${Prisma.join(
										stepTitleFieldArr.map(
											(field) =>
												Prisma.sql`${Prisma.raw(`"${prevTable}"."${field}"`)}
													= ${Prisma.raw(`"${step.table}"."${field}"`)}`
										),
										" AND "
									)}
								`
							);
						}
					}

					const rootConditions = result.map(
						(row) =>
							Prisma.sql`(
								${Prisma.join(
									titleFieldArr.map((field) => Prisma.sql`${Prisma.raw(`"${capsModel}"."${field}"`)} = ${row[field]}`),
									" AND "
								)}
							)`
					);

					const selectFields = titleFieldArr.map((field) => Prisma.raw(`"${capsModel}"."${field}"`));

					return Prisma.sql`
						SELECT
							${Prisma.join(selectFields, ", ")},
							COUNT(DISTINCT ${Prisma.raw(`"${capitalizeTable(targetModel)}".id`)})::int AS count
						FROM ${Prisma.raw(`"${capsModel}"`)}
						${Prisma.join(joins, " ")}
						WHERE ${Prisma.join(rootConditions, " OR ")}
						GROUP BY ${Prisma.join(selectFields, ", ")}
					`;
				})
			);

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
					resRow._count[TableMetadata[queryObject.deepRels[i]!].plural] =
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
		console.error(err);

		if (err instanceof AppError) {
			return NextResponse.json({ statusMessage: "error", error: err.message }, { status: err.statusCode });
		}

		return NextResponse.json({ statusMessage: "error", error: GLOBAL_SERVER_ERROR }, { status: 500 });
	}
}
