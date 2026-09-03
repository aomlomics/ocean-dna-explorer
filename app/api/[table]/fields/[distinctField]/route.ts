import { prisma, trustedPrisma } from "@/app/helpers/prisma";
import { getTableName } from "@/app/helpers/schema";
import type { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string; distinctField: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table, distinctField } = await params;

	try {
		const model = getTableName(table);
		const parsedField = TableMetadata[model].enumSchema.safeParse(distinctField);
		if (!parsedField.success) {
			return NextResponse.json({
				statusMessage: "error",
				error: `The field named "${distinctField}" does not exist on the table named "${model}".`
			});
		}

		const { searchParams } = new URL(request.url);
		const client = searchParams.get("trusted")?.toLowerCase() === "true" ? trustedPrisma : prisma;

		//@ts-expect-error dynamically accessing prisma client
		const result = await client[model].findMany({
			distinct: [distinctField],
			select: {
				[distinctField]: true
			}
		});

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
