import { Prisma } from "@/app/generated/prisma/client";

export async function GET() {
	return Response.json({ statusMessage: "success", result: Object.keys(Prisma.ModelName).map((s) => s.toLowerCase()) });
}
