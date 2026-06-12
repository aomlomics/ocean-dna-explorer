import { parseApiQuery } from "@/app/helpers/queries";
import { getTableName } from "@/app/helpers/schema";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string; distinctField: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table, distinctField } = await params;

	const model = getTableName(table);

	try {
		const { searchParams } = new URL(request.url);

		const { query, client } = parseApiQuery(model, searchParams, {
			features: {
				relationsLimit: true,
				filters: true,
				advanced: true,
				search: true
			},
			defaults: {
				fields: { [distinctField]: true },
				distinct: [distinctField]
			}
		});

		//@ts-ignore
		const result = await client[model].findMany(query);

		if (result) {
			return NextResponse.json({
				statusMessage: "success",
				result: result.map((e: { [distinctField]: string }) => e[distinctField])
			});
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
