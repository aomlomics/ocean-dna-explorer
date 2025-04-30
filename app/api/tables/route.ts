import { Prisma } from "@/app/generated/prisma/client";

export async function GET() {
	return Response.json({ message: "Success", result: Object.keys(Prisma.ModelName).map((s) => s.toLowerCase()) });
}
