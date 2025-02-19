import { Prisma } from "@prisma/client";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName>; id: string }> }
) {
	const { table, id } = await params;

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
}
