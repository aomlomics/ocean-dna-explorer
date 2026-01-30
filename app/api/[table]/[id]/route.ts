import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { NetworkPacket } from "@/types/globals";
import { TableNames } from "@/types/tableMetadata";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string; id: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table, id } = await params;

	const model = TableNames.find((model) => model.toLowerCase() === table.toLowerCase());
	if (model) {
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
					relationsLimit: true,
					advanced: true,
					search: true
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
