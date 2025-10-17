import { NetworkPacket } from "@/types/globals";
import { TableNames } from "@/types/tableMetadata";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<NetworkPacket>> {
	return NextResponse.json({
		statusMessage: "success",
		result: TableNames
	});
}
