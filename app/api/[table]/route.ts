import { prisma } from "@/app/helpers/prisma";
import { deepWhere, parseApiQuery } from "@/app/helpers/queries";
import { getTableName } from "@/app/helpers/schema";
import { getLocationsInsideShapes } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;

	try {
		const model = getTableName(table);

		const { searchParams } = new URL(request.url);

		const { query, shapes, sampleWhere } = parseApiQuery(model, searchParams, { sampleWhere: true });

		//replace the where with samp_names that match the query and are inside the shapes
		if (shapes && sampleWhere) {
			const samples = await prisma.sample.findMany({
				where: sampleWhere,
				select: {
					samp_name: true,
					decimalLatitude: true,
					decimalLongitude: true
				}
			});

			query.where = deepWhere(model, "sample", {
				samp_name: { in: getLocationsInsideShapes(samples, shapes).map((samp) => samp.samp_name) }
			});
		}

		//@ts-ignore
		let result = await prisma[model].findMany(query);

		if (result) {
			//don't do this if already done
			if (shapes && !sampleWhere) {
				result = getLocationsInsideShapes(result, shapes);
			}

			return NextResponse.json({ statusMessage: "success", result });
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
