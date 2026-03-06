import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { getTableName } from "@/app/helpers/schema";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string; id: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table, id } = await params;

	const model = getTableName(table);

	try {
		const parsedId = parseInt(id);
		if (Number.isNaN(parsedId)) {
			return NextResponse.json({ statusMessage: "error", error: `Invalid ID: ${parsedId}.` });
		}

		const { searchParams } = new URL(request.url);

		const { query } = parseApiQuery(model, searchParams, {
			features: {
				fields: true,
				relations: true,
				relationsLimit: true
			},
			defaults: {
				filters: { id: parseInt(id) }
			}
		});

		//@ts-ignore
		const result = await prisma[model].findUnique(query);

		if (result) {
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
