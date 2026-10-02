import { NextResponse } from "next/server";
import type { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { getTableName, getZodType } from "@/app/helpers/schema";
import { AppError, GLOBAL_SERVER_ERROR } from "@/types/objects";

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
		console.error(err);

		if (err instanceof AppError) {
			return NextResponse.json({ statusMessage: "error", error: err.message }, { status: err.statusCode });
		}

		return NextResponse.json({ statusMessage: "error", error: GLOBAL_SERVER_ERROR }, { status: 500 });
	}
}
