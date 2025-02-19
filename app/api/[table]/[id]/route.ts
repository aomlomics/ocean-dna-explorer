import { Prisma } from "@prisma/client";
import { prisma } from "@/app/helpers/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName>; id: string }> }
) {
	const { table, id } = await params;

	if (
		Object.keys(Prisma.ModelName)
			.map((s) => s.toLowerCase())
			.includes(table)
	) {
		try {
			//@ts-ignore
			const result = await prisma[table].findUnique({
				where: {
					id: parseInt(id)
				}
			});

			return Response.json(result);
		} catch (err) {
			const error = err as Error;

			return Response.json({ error: error.message }, { status: 400 });
		}
	} else {
		return Response.json({ error: "Invalid model name", status: 400 });
	}
}
