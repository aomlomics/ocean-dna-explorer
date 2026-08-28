import { NextResponse } from "next/server";
import type { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { getTableName, getZodType } from "@/app/helpers/schema";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	try {
		const model = getTableName(table);

		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		for (const f of TableMetadata[model].enumSchema.options) {
			if (f !== "userDefined") {
				const type = getZodType(model, f);
				result[f] = type;
			}
		}

		return NextResponse.json({ statusMessage: "success", result });
	} catch (err) {
		const error = err as Error;
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
