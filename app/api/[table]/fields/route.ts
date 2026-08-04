import { NextResponse } from "next/server";
import { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { getTableName, getZodType } from "@/app/helpers/schema";
import { stripSecureFields } from "@/app/helpers/queries";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	const model = getTableName(table);

	const result = {} as Record<string, ReturnType<typeof getZodType>>;
	for (const f of TableMetadata[model].enumSchema.options) {
		if (f !== "userDefined") {
			const type = getZodType(model, f);
			result[f] = type;
		}
	}

	stripSecureFields(result);

	return NextResponse.json({ statusMessage: "success", result });
}
