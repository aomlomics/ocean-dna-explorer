import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError, seedAssays } from "@/app/helpers/queries";
import type { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const authHeader = request.headers.get("authorization");
	if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ statusMessage: "error", error: "Unauthorized" });
	}

	try {
		await seedAssays(prisma);

		return NextResponse.json({ statusMessage: "success" });
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return NextResponse.json(prismaErr);
		}

		const error = err as Error;
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
