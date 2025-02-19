import { parseSearchParams } from "@/app/helpers/utils";
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

		const query = parseSearchParams(searchParams);

		//@ts-ignore
		const result = await prisma[table].findMany(query);

		return Response.json({ message: "Success", result });
	} catch (err) {
		const error = err as Error;

		return Response.json({ error: error.message }, { status: 400 });
	}
}
