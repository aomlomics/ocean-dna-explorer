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
		const keys = TableToEnumSchema[lowercaseTable as keyof typeof TableToEnumSchema]._def.values;
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		for (const k of keys) {
			const shape = TableToSchema[lowercaseTable as keyof typeof TableToSchema].shape;
			const type = getZodType(shape[k as keyof typeof shape]);
			if (!type.type) {
				throw new Error(`Could not find type of ${k}.`);
			}
			result[k] = type;
		}

		return Response.json({
			message: "Success",
			result
		});
	} else {
		return Response.json({ message: "Error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
