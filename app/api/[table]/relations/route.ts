import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;

	const model = TableNames.find((model) => model.toLowerCase() === table.toLowerCase());
	if (model) {
		return NextResponse.json({
			statusMessage: "success",
			result: TableMetadata[model].relations
		});
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
