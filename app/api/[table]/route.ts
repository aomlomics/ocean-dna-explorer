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
	const { searchParams } = new URL(request.url);

	return Response.json({ message: "Success", table });
}
