import { prisma } from "@/app/helpers/prisma";
import { deepWhere, parseApiQuery } from "@/app/helpers/queries";
import { getLocationsInsideShapes } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { TableNames } from "@/types/tableMetadata";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;

	const model = TableNames.find((model) => model.toLowerCase() === table.toLowerCase());
	if (model) {
		try {
			const { searchParams } = new URL(request.url);

			const getSamples = searchParams.get("getSamples");
			if (getSamples) {
				searchParams.delete("getSamples");
			}

			const { query, shapes, sampleWhere } = parseApiQuery(model, searchParams);

			//retrieve only the samples that match the query
			if (getSamples) {
				const samples = await prisma.sample.findMany({
					where: sampleWhere
				});

				return NextResponse.json({ statusMessage: "success", samples });
			}

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
					error: `No ${table} matching the search parameters could be found.`
				});
			}
		} catch (err) {
			const error = err as Error;

			//bad select/include
			const unknownFieldSplit = error.message.split("Unknown field ");
			if (unknownFieldSplit.length > 1) {
				const unknownField = unknownFieldSplit[unknownFieldSplit.length - 1].split("`")[1];

				return NextResponse.json({
					statusMessage: "error",
					error: `No field named "${unknownField}" exists on table named "${table}".`
				});
			}

			//bad where
			const unknownArgSplit = error.message.split("Unknown argument ");
			if (unknownArgSplit.length > 1) {
				const unknownArg = unknownArgSplit[unknownArgSplit.length - 1].split("`")[1];

				return NextResponse.json({
					statusMessage: "error",
					error: `No field named "${unknownArg}" exists on table named "${table}".`
				});
			}

			//TODO: replace database error messages with generic error message
			return NextResponse.json({ statusMessage: "error", error: error.message });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
