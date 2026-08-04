import { prisma } from "@/app/helpers/prisma";
import { getTableName } from "@/app/helpers/schema";
import { NetworkPacket } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { PrismaPromise } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: string }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;

	try {
		const model = getTableName(table);

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
			const parsed = TableMetadata[model].enumSchema.safeParse(field);
			if (!parsed.success) {
				return NextResponse.json({
					statusMessage: "error",
					error: `Field "${field}" does not exist on table "${table}".`
				});
			}

			where[field] = value;
		}
		//extra fields
		for (let field of extraFields) {
			//check if field exists on table
			const parsed = TableMetadata[model].enumSchema.safeParse(field);
			if (!parsed.success) {
				return NextResponse.json({
					statusMessage: "error",
					error: `Field "${field}" does not exist on table "${table}".`
				});
			}
		}

		//assemble queries
		const queries = [] as PrismaPromise<any>[];
		//filtered
		for (let field in where) {
			const temp = { ...where };
			delete temp[field];

			queries.push(
				//@ts-ignore
				prisma[model].findMany({
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
				prisma[model].findMany({
					distinct: [field],
					select: {
						[field]: true
					},
					where
				})
			);
		}

		const dbResult = (await prisma.$transaction(queries)) as Array<Array<{ [key: string]: string }>>;

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
		return NextResponse.json({ statusMessage: "error", error: error.message });
	}
}
