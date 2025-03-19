import { prisma } from "@/app/helpers/prisma";
import { parseNestedJson } from "@/app/helpers/utils";
import { Prisma } from "@prisma/client";

//TODO: convert to server action
export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
	const { table } = await params;

	try {
		const { searchParams } = new URL(request.url);

		const query = {
			orderBy: {
				id: "asc"
			}
		} as {
			orderBy: { id: Prisma.SortOrder };
			take: number;
			skip?: number;
			cursor?: { id: number };
			include?: { _count: { select: Record<string, boolean> } };
			where?: Record<string, any>;
		};

		const orderBy = searchParams.get("orderBy");
		if (orderBy) {
			query.orderBy = JSON.parse(orderBy);
		}

		const take = searchParams.get("take");
		if (!take) {
			throw new Error("take is required");
		}
		query.take = parseInt(take);

		const page = searchParams.get("page");
		//const cursorId = searchParams.get("cursorId");
		if (page) {
			//offset pagination
			query.skip = (parseInt(page) - 1) * query.take;
		}
		//} else if (cursorId) {
		//	const dir = searchParams.get("dir");
		//	//cursor pagination
		//	findMany.skip = 1;
		//	findMany.cursor = {
		//		id: parseInt(cursorId)
		//	};
		//	if (dir) {
		//		findMany.take *= parseInt(dir);
		//	}
		//}

		const whereStr = searchParams.get("where");
		if (whereStr) {
			query.where = parseNestedJson(whereStr);
		}

		const relCounts = searchParams.get("relCounts");
		if (relCounts) {
			query.include = {
				_count: {
					select: relCounts
						.split(",")
						.reduce((acc: Record<string, boolean>, rel: string) => ({ ...acc, [rel]: true }), {})
				}
			};
		}

		const [result, count] = await prisma.$transaction([
			//@ts-ignore
			prisma[table].findMany(query),
			//@ts-ignore
			prisma[table].count({ where: query.where })
		]);

		return Response.json({ message: "Success", result, count });
	} catch (err) {
		const error = err as Error;

		return Response.json({ message: "Error", error: error.message }, { status: 400 });
	}
}
