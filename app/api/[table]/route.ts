import { Prisma } from "@/app/generated/prisma/client";
import { prisma, stripSecureFields } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((table) => table.toLowerCase() === lowercaseTable)) {
		try {
			const { searchParams } = new URL(request.url);

			const query = parseApiQuery(lowercaseTable, searchParams);

			//@ts-ignore
			const result = await prisma[table].findMany(query);

			if (result) {
				stripSecureFields(result);
				return NextResponse.json({ statusMessage: "success", result });
			} else {
				return NextResponse.json(
					{ statusMessage: "error", error: `No ${table} matching the search parameters could be found.` },
					{ status: 400 }
				);
			}
		} catch (err) {
			const error = err as Error;

			//bad select/include
			const unknownFieldSplit = error.message.split("Unknown field ");
			if (unknownFieldSplit.length > 1) {
				const unknownField = unknownFieldSplit[unknownFieldSplit.length - 1].split("`")[1];

				return NextResponse.json(
					{ statusMessage: "error", error: `No field named '${unknownField}' exists on table named '${table}'.` },
					{ status: 400 }
				);
			}

			//bad where
			const unknownArgSplit = error.message.split("Unknown argument ");
			if (unknownArgSplit.length > 1) {
				const unknownArg = unknownArgSplit[unknownArgSplit.length - 1].split("`")[1];

				return NextResponse.json(
					{ statusMessage: "error", error: `No field named '${unknownArg}' exists on table named '${table}'.` },
					{ status: 400 }
				);
			}

			//TODO: replace database error messages with generic error message
			return NextResponse.json({ statusMessage: "error", error: error.message }, { status: 400 });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
