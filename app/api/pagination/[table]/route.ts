import { deepWhere, prisma } from "@/app/helpers/prisma";
import { getZodType, parseNestedJson } from "@/app/helpers/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { NetworkPacket, ParamsArray, ParamsArrayField, ParamsArrayRelation, QueryMode } from "@/types/globals";
import TableMetadata from "@/types/tableMetadata";
import { QueryModes } from "@/types/objects";

function parseToQuery(
	table: Lowercase<Prisma.ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation
) {
	let relation = "" as Lowercase<Prisma.ModelName>;
	let field = "";
	let mode = "" as QueryMode;
	let value = "";
	if (queryArr.length === 2) {
		//search field for value
		field = queryArr[0];
		value = queryArr[1];
	} else if (queryArr.length === 3) {
		//search field for value with mode
		// relation = queryArr[0].toLowerCase() as Lowercase<Prisma.ModelName>;
		field = queryArr[0];
		mode = queryArr[1];
		value = queryArr[2] as string;
	} else if (queryArr.length === 4) {
		//search related table's field for value
		relation = queryArr[0].toLowerCase() as Lowercase<Prisma.ModelName>;
		field = queryArr[1];
		mode = queryArr[2];
		value = queryArr[3] as string;
	}

	if (mode && !QueryModes.includes(mode)) {
		throw new Error(`Query mode "${mode}" not supported.`);
	}

	if (TableMetadata[relation || table].relations.some((rel) => rel.field === field) && typeof value === "object") {
		return { [field]: value };
	}

	const type = getZodType(TableMetadata[relation || table].schema.shape[field]).type;
	if (!type) {
		throw new Error(
			`Could not find type of "${field}". Make sure a field named "${field}" exists on table named "${
				relation || table
			}".`
		);
	}

	let searchWhere;
	if (type === "string") {
		if (mode) {
			searchWhere = {
				[field]: {
					[mode]: value.replace("_", "\\_").replace("%", "\\%"),
					mode: "insensitive"
				}
			};
		} else {
			searchWhere = {
				[field]: {
					contains: value.replace("_", "\\_").replace("%", "\\%"),
					mode: "insensitive"
				}
			};
		}
	} else if (type === "integer" || type === "float") {
		if (mode === "range") {
			let gte;
			let lte;
			if (type === "integer") {
				gte = parseInt(value[0]);
				lte = parseInt(value[1]);
			} else {
				gte = parseFloat(value[0]);
				lte = parseFloat(value[1]);
			}

			if (isNaN(gte)) {
				throw new Error(`The field "${field}" is a number field, but "${gte}" is not a number.`);
			} else if (isNaN(lte)) {
				throw new Error(`The field "${field}" is a number field, but "${lte}" is not a number.`);
			}

			searchWhere = { AND: [{ [field]: { gte } }, { [field]: { lte } }] };
		} else {
			let val;
			if (type === "integer") {
				val = parseInt(value);
			} else {
				val = parseFloat(value);
			}

			if (isNaN(val)) {
				throw new Error(`The field "${field}" is a number field, but "${value}" is not a number.`);
			}

			if (!mode || mode === "equals") {
				searchWhere = { [field]: val };
			} else {
				searchWhere = { [field]: { [mode]: val } };
			}
		}
	} else if (type === "date") {
		if (mode === "range") {
			searchWhere = {
				AND: [{ [field]: { gte: new Date(value[0]) } }, { [field]: { lte: new Date(value[1]) } }]
			};
		} else {
			const dateVal = new Date(value);
			if (isNaN(dateVal.valueOf())) {
				throw new Error(`The field "${field}" is a date field, but "${value}" is not a date.`);
			}

			let lteOffset;
			if (value.includes("T")) {
				lteOffset = 60 * 60 * 1000;
			} else {
				lteOffset = 24 * 60 * 60 * 1000;
			}

			if (mode === "equals") {
				searchWhere = {
					AND: [{ [field]: { gte: dateVal } }, { [field]: { lte: new Date(dateVal.getTime() + lteOffset) } }]
				};
			} else {
				searchWhere = { [field]: { [mode]: dateVal } };
			}
		}
	} else if (type === "string[]") {
		//TODO: add string arrays back to schema once Prisma supports contains on arrays
	}

	if (searchWhere) {
		if (relation) {
			return deepWhere(table, relation, searchWhere);
		} else {
			return searchWhere;
		}
	} else {
		return {};
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ table: Uncapitalize<Prisma.ModelName> }> }
): Promise<NextResponse<NetworkPacket>> {
	const { table } = await params;
	const lowercaseTable = table.toLowerCase() as Uncapitalize<Prisma.ModelName>;

	if (Object.keys(Prisma.ModelName).some((t) => t.toLowerCase() === lowercaseTable)) {
		try {
			const { searchParams } = new URL(request.url);

			const query = {
				orderBy: {
					id: "asc"
				}
			} as {
				orderBy: { id: Prisma.SortOrder };
				where?: Record<string, any>;
				take?: number;
				skip?: number;
				// cursor?: { id: number };
				include?: { _count: { select: Record<string, boolean> } };
			};

			const orderBy = searchParams.get("orderBy");
			if (orderBy) {
				query.orderBy = JSON.parse(orderBy);
			}

			const whereStr = searchParams.get("where");
			if (whereStr) {
				const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

				if (parsed.advanced) {
					function parseAdvancedQuery(
						e: ParamsArray[0]
					): ReturnType<typeof parseToQuery> | { OR: ReturnType<typeof parseToQuery> } {
						if (typeof e[0] === "string") {
							return parseToQuery(lowercaseTable, e as ParamsArrayField | ParamsArrayRelation);
						} else {
							const paramsE = e as ParamsArray;
							return { OR: paramsE.map(parseAdvancedQuery) };
						}
					}

					const advanced = parsed.advanced as ParamsArray;
					delete parsed.advanced;

					try {
						query.where = { AND: advanced.map((e) => parseAdvancedQuery(e)) };
					} catch (err) {
						const error = err as Error;
						return NextResponse.json({ statusMessage: "error", error: error.message });
					}
				} else if (parsed.search) {
					const search = parsed.search.split(",");
					delete parsed.search;

					//search entire table for value
					const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
					for (const field of TableMetadata[table].enumSchema._def.values) {
						const type = getZodType(TableMetadata[table].schema.shape[field]).type;
						if (!type) {
							throw new Error(
								`Could not find type of "${field}". Make sure a field named "${field}" exists on table named "${table}".`
							);
						}

						if (type === "string") {
							ors.push({ [field]: { contains: search.replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" } });
						}
					}

					if (ors.length) {
						query.where = { OR: ors };
					}
				}

				for (const filter of Object.entries(parsed as Record<string, string>)) {
					query.where = { ...query.where, ...parseToQuery(lowercaseTable, filter) };
				}
			}

			const take = searchParams.get("take");
			if (!take) {
				throw new Error("take is required");
			}
			query.take = parseInt(take);

			const page = searchParams.get("page");
			if (page) {
				//offset pagination
				query.skip = (parseInt(page) - 1) * query.take;
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
				prisma[lowercaseTable].findMany(query),
				//@ts-ignore
				prisma[lowercaseTable].count({ where: query.where })
			]);

			return NextResponse.json({ statusMessage: "success", result, count });
		} catch (err) {
			const error = err as Error;

			return NextResponse.json({ statusMessage: "error", error: error.message });
		}
	} else {
		return NextResponse.json({ statusMessage: "error", error: `Invalid table name: "${table}".` });
	}
}
