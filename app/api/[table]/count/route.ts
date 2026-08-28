import { deepWhere, parseApiQuery } from "@/app/helpers/api";
import { getTableName } from "@/app/helpers/schema";
import { deepMerge, getLocationsInsideShapes } from "@/app/helpers/utils";
import type { NetworkPacket } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBlast } from "@/app/helpers/blast";
import { prisma, trustedPrisma } from "@/app/helpers/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const { sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata?.role;

	const cookieStore = await cookies();

	try {
		const model = getTableName(table);

		const { searchParams } = new URL(request.url);

		const { trusted, query, blast, shapes, sampleWhere } = parseApiQuery(model, searchParams, {
			features: {
				filters: true,
				advanced: true,
				search: true,
				shapes: true
			},
			sampleWhere: true
		});
		const client = trusted ? trustedPrisma : prisma;

		//replace the where with samp_names that match the query and are inside the shapes
		if (sampleWhere) {
			const samples = await client.sample.findMany({
				where: sampleWhere,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			});

			query.where = deepWhere(model, "sample", {
				samp_name: { in: getLocationsInsideShapes(samples, shapes!).map((samp) => samp.samp_name) }
			});
		}

		//inject blast results into queries
		let BlastQueryResults;
		let existingBlastDate;
		if (blast) {
			({ BlastQueryResults, existingBlastDate } = await fetchBlast(
				blast,
				{ role, token: await getToken({ expiresInSeconds: 60 }) },
				cookieStore
			));
			const featureWhere = deepWhere(model, "feature", {
				featureid: {
					in: BlastQueryResults.map((bqr) => bqr.featureid)
				}
			});

			query.where = query.where ? deepMerge(query.where, featureWhere) : featureWhere;
		}

		//@ts-expect-error dynamically accessing prisma client
		let result = await client[model].count(query);

		if (result) {
			//don't do this if already done
			if (shapes && !sampleWhere) {
				result = getLocationsInsideShapes(result, shapes);
			}

			return NextResponse.json({ statusMessage: "success", result, BlastQueryResults, existingBlastDate });
		} else {
			return NextResponse.json({
				statusMessage: "error",
				error: `No ${model} matching the search parameters could be found.`
			});
		}
	} catch (err) {
		const error = err as Error;

		//TODO: replace database error messages with generic error message
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
