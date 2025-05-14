import { getZodType } from "@/app/helpers/utils";
import { TableToEnumSchema, TableToRelations, TableToSchema } from "@/types/objects";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (
		Object.keys(Prisma.ModelName)
			.map((s) => s.toLowerCase())
			.includes(lowercaseTable)
	) {
		return NextResponse.json({ statusMessage: "success", result: TableToRelations[lowercaseTable] });
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
