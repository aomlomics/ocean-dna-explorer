import TableMetadata from "@/types/tableMetadata";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import { getTableName } from "@/app/helpers/schema";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const model = getTableName(table);

	return NextResponse.json({
		statusMessage: "success",
		result: TableMetadata[model].relations
	});
}
