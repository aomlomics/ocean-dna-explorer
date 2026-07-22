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
import { BlastResult, NetworkPacket, ParamsArray } from "@/types/globals";
import { deepWhere, parseAdvancedQuery, parseSearchQuery, parseToQuery } from "@/app/helpers/queries";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { Location } from "@/types/globals";
import { getDataTableName, getRelationPath, getTableName } from "@/app/helpers/schema";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const { sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

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

		let shapes = getShapesFromUrl(searchParams);
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

		const blastDatabase = searchParams.get("blastDatabase");
		const saveBlast = searchParams.get("saveBlast");
		const blastQueries = searchParams.getAll("blastQuery");
		if (blastDatabase != null) {
			if (!blastQueries.length) {
				throw new Error("Must provide a blast query with blastDatabase option.");
			}

			searchParams.delete("blastDatabase");
		}
		if (saveBlast != null) {
			if (!role || !RolePermissions[role].includes("contribute")) {
				throw new Error("You must be signed in with the contributor role to save BLAST queries.");
			}

			if (!blastQueries.length) {
				throw new Error("Must provide a blast query with saveBlast option.");
			}

			searchParams.delete("saveBlast");
		}

		let blastResult;
		let featureidWhere;
		if (blastQueries.length) {
			searchParams.delete("blastQuery");

			let res;
			try {
				res = await fetch(
					`${process.env.NEXT_PUBLIC_SERVER_URL}/blast/?${blastDatabase ? `assay_name=${blastDatabase}&` : ""}${blastQueries.map((q) => `query=${q}`).join("&")}`,
					saveBlast?.toLowerCase() === "true"
						? {
								headers: {
									Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
								}
							}
						: undefined
				);
			} catch (err) {
				throw new Error("Could not reach BLAST server.");
			}
			if (res.ok) {
				const response = (await res.json()) as NetworkPacket;
				if (response.statusMessage === "success") {
					blastResult = response.result as BlastResult;
					const baseFeatureWhere = {
						featureid: {
							in: blastResult.reduce(
								(acc, r) => [...acc, ...r.BlastQueryResults.map((bqr) => bqr.featureid)],
								[] as string[]
							)
						}
					};
					featureidWhere = deepWhere(model, "feature", baseFeatureWhere);

					if (sampleWhere) {
						sampleWhere = deepMerge(sampleWhere, deepWhere("sample", "feature", baseFeatureWhere));
					}
					query.where = query.where ? deepMerge(query.where, featureidWhere) : featureidWhere;
				} else if (response.statusMessage === "error") {
					throw new Error("Response from BLAST server: " + response.error);
				}
			} else {
				throw new Error("Could not reach BLAST server.");
			}
		}

		const orderByStr = searchParams.get("orderBy");
		if (orderByStr != null) {
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
		if (relCounts != null) {
			query.include = {
				_count: {
					select: relCounts
						.split(",")
						.reduce((acc: Record<string, boolean>, rel: string) => ({ ...acc, [rel]: true }), {})
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
			if (relationsAllFields != null) {
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
			if (deepRelations.toLowerCase() === "true") {
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
		let result;
		let count;
		if (hasLocationData && sampleWhere) {
			//skip extra database call on sample table
			samples = await prisma.sample.findMany(query);
			result = [...samples];
			count = result.length;

			//give last page if page is too large
			if (parsedPage && (parsedPage - 1) * parsedTake > count) {
				parsedPage = Math.floor(count / parsedTake) + 1;
			}
		} else {
			if (sampleWhere) {
				//replace the where with samp_names that match the query and are inside the shapes
				samples = await prisma.sample.findMany({
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

			const res = await prisma.$transaction(async (tx) => {
				//@ts-ignore
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

				//@ts-ignore
				const result = await tx[model].findMany(query);

				return { count, result };
			});
			count = res.count;
			result = res.result;
		}

		//paginate using shapes and location data
		if (shapes && hasLocationData) {
			result = getLocationsInsideShapes(result as Location[], shapes);
			count = result.length;
		}

		//manually paginate
		if (result.length > parsedTake) {
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

		return NextResponse.json({
			statusMessage: "success",
			result,
			count,
			blastResult,
			samples: getSamples ? samples : undefined
		});
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
