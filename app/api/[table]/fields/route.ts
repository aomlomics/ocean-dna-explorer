import { getZodType } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import { stripSecureFields } from "@/app/helpers/prisma";
import TableMetadata from "@/types/tableMetadata";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((table) => table.toLowerCase() === lowercaseTable)) {
		const fields = TableMetadata[lowercaseTable].enumSchema._def.values;
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		const shape = TableMetadata[lowercaseTable].schema.shape;
		for (const f of fields) {
			if (f !== "userDefined") {
				const type = getZodType(shape[f as keyof typeof shape]);
				if (!type.type) {
					throw new Error(`Could not find type of ${f}.`);
				}
				result[f] = type;
			}
		}

		stripSecureFields(result);

		return NextResponse.json({ statusMessage: "success", result });
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
