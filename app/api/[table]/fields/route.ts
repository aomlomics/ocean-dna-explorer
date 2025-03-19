import { getZodType } from "@/app/helpers/utils";
import { TableToEnumSchema, TableToSchema } from "@/types/enums";
import { Prisma } from "@prisma/client";

export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (
		Object.keys(Prisma.ModelName)
			.map((s) => s.toLowerCase())
			.includes(lowercaseTable)
	) {
		const fields = TableToEnumSchema[lowercaseTable as keyof typeof TableToEnumSchema]._def.values;
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		const shape = TableToSchema[lowercaseTable as keyof typeof TableToSchema].shape;
		for (const f of fields) {
			if (f !== "userDefined") {
				const type = getZodType(shape[f as keyof typeof shape]);
				if (!type.type) {
					throw new Error(`Could not find type of ${f}.`);
				}
				result[f] = type;
			}
		}

		return Response.json({
			message: "Success",
			result
		});
	} else {
		return Response.json({ message: "Error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
