import { Prisma } from "@/app/generated/prisma/client";
import { uncapitalizeTable } from "@/app/helpers/utils";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<NetworkPacket>> {
	return NextResponse.json({
		statusMessage: "success",
		result: Object.keys(Prisma.ModelName).map((model) => uncapitalizeTable(model as Prisma.ModelName))
	});
}
