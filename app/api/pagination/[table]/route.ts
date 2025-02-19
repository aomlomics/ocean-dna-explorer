import { prisma } from "@/app/helpers/prisma";
import { parsePaginationSearchParams } from "@/app/helpers/utils";
import { Prisma } from "@prisma/client";

export const dynamicParams = false;

export async function generateStaticParams() {
	const tables = Object.keys(Prisma.ModelName);

	return tables.map((t) => ({
		table: t.toLowerCase()
	}));
}

export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
	const table = (await params).table;

	try {
		const { searchParams } = new URL(request.url);

		const query = parsePaginationSearchParams(searchParams);

		const [result, count] = await prisma.$transaction([
			//@ts-ignore
			prisma[table].findMany(query),
			//@ts-ignore
			prisma[table].count({ where: query.where })
		]);

		return Response.json({ message: "Success", result, count });
	} catch (err) {
		const error = err as Error;

		return Response.json({ error: error.message }, { status: 400 });
	}
}
