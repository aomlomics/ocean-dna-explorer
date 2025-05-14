import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		statusMessage: "success",
		result: Object.keys(Prisma.ModelName).map((s) => s.toLowerCase())
	});
}
