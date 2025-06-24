import { NetworkPacket } from "@/types/globals";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const userId = (await params).userId;
	const client = await clerkClient();

	const result = await client.users.getUser(userId);

	return NextResponse.json({ statusMessage: "success", result });
}
