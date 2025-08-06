import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, unsafePrisma } from "@/app/helpers/prisma";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ statusMessage: "error", error: "Unauthorized" });
	}

	try {
		console.log("empty assays delete");
		await unsafePrisma.assay.deleteMany({
			where: {
				Samples: {
					none: {}
				}
			}
		});

		console.log("empty primers delete");
		await unsafePrisma.primer.deleteMany({
			where: {
				Assays: {
					none: {}
				}
			}
		});

		console.log("empty features delete");
		await unsafePrisma.feature.deleteMany({
			where: {
				Occurrences: {
					none: {}
				}
			}
		});

		console.log("empty taxonomies delete");
		await unsafePrisma.taxonomy.deleteMany({
			where: {
				Assignments: {
					none: {}
				}
			}
		});

		return NextResponse.json({ statusMessage: "success" });
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return NextResponse.json(handlePrismaError(err));
		}

		const error = err as Error;
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
