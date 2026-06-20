import { prismaImages } from "@/app/helpers/prismaImages";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<NetworkPacket>> {
	const attributions = await prismaImages.attribution.findMany();

	return NextResponse.json({
		statusMessage: "success",
		result: attributions
	});
}
