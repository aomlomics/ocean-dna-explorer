import { handlePrismaError } from "@/app/helpers/queries";
import { NetworkPacket } from "@/types/globals";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ statusMessage: "error", error: "Unauthorized" });
	}

	try {
		// console.log("empty features delete");
		// await prisma.feature.deleteMany({
		// 	where: {
		// 		Occurrences: {
		// 			none: {}
		// 		}
		// 	}
		// });

		// console.log("empty taxonomies delete");
		// await prisma.taxonomy.deleteMany({
		// 	where: {
		// 		Assignments: {
		// 			none: {}
		// 		}
		// 	}
		// });

		return NextResponse.json({ statusMessage: "success" });
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return NextResponse.json(prismaErr);
		}

		const error = err as Error;
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
