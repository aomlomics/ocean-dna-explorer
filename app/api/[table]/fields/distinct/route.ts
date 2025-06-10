import { Prisma, PrismaPromise } from "@/app/generated/prisma/client";
import { securePrisma } from "@/app/helpers/prisma";
import { NetworkPacket } from "@/types/globals";
import { TableToEnumSchema } from "@/types/objects";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const table = (await params).table;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((table) => table.toLowerCase() === lowercaseTable)) {
		try {
			const { searchParams } = new URL(request.url);

			const extraFieldsParams = searchParams.get("extraFields");
			let extraFields = [] as string[];
			if (extraFieldsParams) {
				searchParams.delete("extraFields");
				extraFields = extraFieldsParams.split(",");
			}

			const params = Array.from(searchParams.entries()) as Array<[string, string]>; //Array<field, value>
			const where = {} as Record<string, string>; //Record<field, value>

			//validate input
			//filtered
			for (let [field, value] of params) {
				//check if field exists on table
				const parsed = TableToEnumSchema[lowercaseTable].safeParse(field);
				if (!parsed.success) {
					return NextResponse.json(
						{ statusMessage: "error", error: `Field '${field}' does not exist on table '${table}'.` },
						{ status: 400 }
					);
				}

				where[field] = value;
			}
			//extra fields
			for (let field of extraFields) {
				//check if field exists on table
				const parsed = TableToEnumSchema[lowercaseTable].safeParse(field);
				if (!parsed.success) {
					return NextResponse.json(
						{ statusMessage: "error", error: `Field '${field}' does not exist on table '${table}'.` },
						{ status: 400 }
					);
				}
			}

			//assemble queries
			const queries = [] as PrismaPromise<any>[];
			//filtered
			for (let field of Object.keys(where)) {
				const temp = { ...where };
				delete temp[field];

				queries.push(
					//@ts-ignore
					securePrisma[lowercaseTable].findMany({
						distinct: [field],
						select: {
							[field]: true
						},
						where: temp
					})
				);
			}
			//extra fields
			for (let field of extraFields) {
				queries.push(
					//@ts-ignore
					securePrisma[lowercaseTable].findMany({
						distinct: [field],
						select: {
							[field]: true
						},
						where
					})
				);
			}

			const dbResult = (await securePrisma.$transaction(queries)) as Array<Array<{ [key: string]: string }>>;

			// for (let arr of dbResult) {
			// 	stripSecureFields(arr);
			// }

			const allFields = [...params.map((e) => e[0]), ...extraFields];
			const result = {} as Record<string, string[]>;

			for (let i = 0; i < dbResult.length; i++) {
				result[allFields[i]] = dbResult[i].reduce((acc, e) => {
					if (e[allFields[i]]) {
						acc.push(e[allFields[i]]);
					}

					return acc;
				}, [] as string[]);
			}

			return NextResponse.json({ statusMessage: "success", result });
		} catch (err) {
			const error = err as Error;
			return NextResponse.json({ statusMessage: "error", error: error.message }, { status: 400 });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: '${table}'.` }, { status: 400 });
	}
}
