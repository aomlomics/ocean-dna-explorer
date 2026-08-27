import { DeadValueEnum } from "@/types/enums";
import type { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<NetworkPacket>> {
	return NextResponse.json({ statusMessage: "success", result: DeadValueEnum });
}
