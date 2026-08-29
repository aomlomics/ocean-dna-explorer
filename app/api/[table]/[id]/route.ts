import { parseApiQuery } from "@/app/helpers/api";
import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { getTableName } from "@/app/helpers/schema";
import type { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string; id: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table, id } = await params;

	try {
		const model = getTableName(table);

		const parsedId = parseInt(id);
		if (Number.isNaN(parsedId)) {
			return NextResponse.json({ statusMessage: "error", error: `Invalid ID: ${parsedId}.` });
		}

		const { searchParams } = new URL(request.url);

		const { trusted, query } = parseApiQuery(model, searchParams, {
			features: {
				fields: true,
				relations: true,
				relCounts: true,
				relationsLimit: true
			},
			defaults: {
				filters: { id: Number(id) }
			}
		});
		const client = trusted ? trustedPrisma : prisma;

		//@ts-expect-error dynamically accessing prisma client
		const result = await client[model].findUnique(query);

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
