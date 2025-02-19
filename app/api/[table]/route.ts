import { Prisma } from "@prisma/client";

export const dynamicParams = false;

export async function generateStaticParams() {
	const tables = Object.keys(Prisma.ModelName);

	return tables.map((t) => ({
		table: t.toLowerCase()
	}));
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName> }> }
) {
	const table = (await params).table;

	try {
		const { searchParams } = new URL(request.url);

		const query = {
			orderBy: {
				id: "asc"
			}
		} as {
			orderBy: { id: Prisma.SortOrder };
			where?: Record<string, any>;
		};

		searchParams.forEach((value, key) => {
			if (query.where) {
				query.where[key] = { contains: value };
			} else {
				query.where = { [key]: { contains: value } };
			}
		});

		//@ts-ignore
		const result = await prisma[table].findMany(query);

		return Response.json(result);
	} catch (err) {
		const error = err as Error;

		return Response.json({ error: error.message }, { status: 400 });
	}
}
