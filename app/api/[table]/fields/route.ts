import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import { stripSecureFields } from "@/app/helpers/prisma";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { getZodType } from "@/app/helpers/schema";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;

	const model = TableNames.find((model) => model.toLowerCase() === table.toLowerCase()) as Prisma.ModelName;
	if (model) {
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		const shape = TableMetadata[model].schema.shape;
		for (const f of TableMetadata[model].enumSchema.options) {
			if (f !== "userDefined") {
				const type = getZodType(shape[f as keyof typeof shape]);
				result[f] = type;
			}
		}

		stripSecureFields(result);

		return NextResponse.json({ statusMessage: "success", result });
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
