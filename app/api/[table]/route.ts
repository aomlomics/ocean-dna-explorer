import { Prisma } from "@prisma/client";
import { prisma } from "@/app/helpers/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName> }> }
) {
	const table = (await params).table;

	if (
		Object.keys(Prisma.ModelName)
			.map((s) => s.toLowerCase())
			.includes(table)
	) {
		try {
			const query = {
				orderBy: {
					id: "asc"
				}
			} as {
				orderBy: { [key: string]: Prisma.SortOrder };
				select?: Record<string, any>;
				include?: Record<string, any>;
				where?: Record<string, any>;
				take?: number;
			};

			const { searchParams } = new URL(request.url);

			//selecting fields
			const fields = searchParams.get("fields");
			if (fields) {
				searchParams.delete("fields");
				query.select = fields.split(",").reduce((acc, f) => ({ ...acc, [f]: true }), {});
			}

			//relations
			const relations = searchParams.get("relations");
			if (relations) {
				searchParams.delete("relations");

				//include all fields in relations
				let includeVal = { select: { id: true } } as any;
				const allFields = searchParams.get("relationsAllFields");
				if (allFields) {
					searchParams.delete("relationsAllFields");
					if (allFields.toLowerCase() === "true") {
						includeVal = true;
					} else if (allFields.toLowerCase() !== "false") {
						return Response.json(
							{
								message: "Error",
								error: `Invalid value for relationsAllFields: \`${allFields}\`. Value must be \`true\` or \`false\`.`
							},
							{ status: 400 }
						);
					}
				}

				const relsObj = relations
					.split(",")
					.reduce((acc, incl) => ({ ...acc, [incl[0].toUpperCase() + incl.slice(1)]: includeVal }), {});
				if (query.select) {
					query.select = { ...query.select, ...relsObj };
				} else {
					query.include = relsObj;
				}
			}

			const ids = searchParams.get("ids");
			if (ids) {
				//list of ids
				searchParams.delete("ids");

				const parsedIds = [] as number[];
				for (const id of ids.split(",")) {
					if (id) {
						const parsed = parseInt(id);
						if (Number.isNaN(parsed)) {
							return Response.json({ message: "Error", error: `Invalid ID: \`${id}\`.` }, { status: 400 });
						}
						parsedIds.push(parsed);
					}
				}

				query.where = {
					id: {
						in: parsedIds
					}
				};
			} else {
				//limit
				const take = searchParams.get("limit");
				if (take) {
					searchParams.delete("limit");
					query.take = parseInt(take);
					if (Number.isNaN(query.take)) {
						return Response.json({ message: "Error", error: `Invalid limit: \`${take}\`.` }, { status: 400 });
					}
				}

				//filtering
				searchParams.forEach((value, key) => {
					if (query.where) {
						query.where[key] = { contains: value };
					} else {
						query.where = { [key]: { contains: value } };
					}
				});
			}

			//@ts-ignore
			const result = await prisma[table].findMany(query);

			if (result) {
				return Response.json({ message: "Success", result });
			} else {
				return Response.json(
					{ message: "Error", error: `No ${table} matching the search parameters could be found.` },
					{ status: 400 }
				);
			}
		} catch (err) {
			const error = err as Error;

			//bad select/include
			const splt = error.message.split("Unknown field ");
			if (splt.length > 1) {
				const unknownField = splt[splt.length - 1].split(" ")[0];

				return Response.json({ message: "Error", error: `Invalid field: ${unknownField}.` }, { status: 400 });
			}

			return Response.json({ message: "Error", error: error.message }, { status: 400 });
		}
	} else {
		return Response.json({ message: "Error", error: `Invalid table name: \`${table}\`.` }, { status: 400 });
	}
}
