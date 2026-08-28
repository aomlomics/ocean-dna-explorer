import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { deepMerge, getLocationsInsideShapes } from "@/app/helpers/utils";
import { NextResponse } from "next/server";
import type { NetworkPacket } from "@/types/globals";
import { deepWhere } from "@/app/helpers/api/api";
import { parsePaginationQuery } from "@/app/helpers/api/parse";
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

		const parsedQuery = parsePaginationQuery(model, searchParams, {
			features: {
				filters: true,
				advanced: true,
				search: true,
				shapes: true,
				blast: true
			},
			skipPages: true,
			ignoreExtraFeatures: true
		});
		const { trusted, query, blast, shapes } = parsedQuery;
		let { sampleWhere } = parsedQuery;
		const client = trusted ? trustedPrisma : prisma;

		let featureidWhere;
		if (blast) {
			const { BlastQueryResults } = await fetchBlast(
				blast,
				{ role, token: await getToken({ expiresInSeconds: 60 }) },
				cookieStore
			);
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

		if (sampleWhere && shapes) {
			//TODO: breaks with a sample query in nested group
			//replace the where with samp_names that match the query and are inside the shapes
			const samples = await client.sample.findMany({
				where: sampleWhere,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			});

			const sampNamesWhere = deepWhere(model, "sample", {
				samp_name: { in: getLocationsInsideShapes(samples, shapes).map((samp) => samp.samp_name) }
			});
			//inject blast results if queried for
			query.where = featureidWhere ? deepMerge(sampNamesWhere, featureidWhere) : sampNamesWhere;
		}

		//@ts-expect-error dynamically accessing prisma client
		const result = await client[model].count({ where: query.where });

		return NextResponse.json({
			statusMessage: "success",
			result
		});
	} catch (err) {
		const error = err as Error;

		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
