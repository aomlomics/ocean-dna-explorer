import { Prisma } from "@prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/utils";

export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (
		Object.keys(Prisma.ModelName)
			.map((s) => s.toLowerCase())
			.includes(lowercaseTable)
	) {
		try {
			const { searchParams } = new URL(request.url);

			const query = parseApiQuery(lowercaseTable, searchParams);

			//@ts-ignore
			const result = await prisma[table].findMany(query);

			if (result) {
				return Response.json({ message: "Success", result });
			} else {
				return Response.json(
					{ message: "Error", error: `No ${table} matching the search parameters could be found.` },
					{ status: 400 }
				);
			}
		} catch (err) {
			const error = err as Error;

			//bad select/include
			const unknownFieldSplit = error.message.split("Unknown field ");
			if (unknownFieldSplit.length > 1) {
				const unknownField = unknownFieldSplit[unknownFieldSplit.length - 1].split("`")[1];

				return Response.json(
					{ message: "Error", error: `No field named '${unknownField}' exists on table named '${table}'.` },
					{ status: 400 }
				);
			}

			//bad where
			const unknownArgSplit = error.message.split("Unknown argument ");
			if (unknownArgSplit.length > 1) {
				const unknownArg = unknownArgSplit[unknownArgSplit.length - 1].split("`")[1];

				return Response.json(
					{ message: "Error", error: `No field named '${unknownArg}' exists on table named '${table}'.` },
					{ status: 400 }
				);
			}

			//TODO: replace database error messages with generic error message
			return Response.json({ message: "Error", error: error.message }, { status: 400 });
		}
	} else {
		return Response.json({ message: "Error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
