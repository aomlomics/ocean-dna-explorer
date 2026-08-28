import type { ParamsArray, ParamsArrayField, ParamsArrayRelation, ParamsArrayValue, QueryMode } from "@/types/globals";
import { getTableName, getZodType } from "../schema";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import { COMPRESSION_FORMAT, decompressURIComponent } from "../utils";
import { DeadValueEnum, DeadValueNumbers, DeadValues } from "@/types/enums";
import { insertBlastIntoQuery, parseBlastRequest } from "../blast";

export function buildWhereParams(
	searchParams: URLSearchParams,
	query: URLSearchParams,
	whereQuery?: Record<string, string | number>,
	ignoreParams?: string[]
) {
	const tempParams = new URLSearchParams(searchParams);

	insertBlastIntoQuery(parseBlastRequest(tempParams), query);

	//pull out shapes
	tempParams.getAll("polygon").forEach((poly) => query.set("polygon", poly));
	tempParams.delete("polygon");
	tempParams.getAll("circle").forEach((cir) => query.set("circle", cir));
	tempParams.delete("circle");

	//get rest of queries
	if (whereQuery) {
		tempParams.forEach((value, key) => (whereQuery[key] = value));
		if (ignoreParams) {
			for (const param of ignoreParams) {
				delete whereQuery[param];
			}
		}
	}
}

export function deepWhere(
	start: Uncapitalize<ModelName>,
	target: Uncapitalize<ModelName>,
	query: { [k: string]: any }
) {
	if (start === target) {
		return query;
	}

	//find all paths to target from start
	const path = TableMetadata[start].relationPaths[target];

	if (path) {
		if (Object.keys(query).length) {
			//assemble query
			let where = { ...query };
			for (const rel of path.toReversed()) {
				if (rel.type.endsWith("many")) {
					//if relation is a -to-many, add a some to the query
					where = { [rel.field]: { some: where } };
				} else {
					where = { [rel.field]: where };
				}
			}

			return where;
		} else {
			return {};
		}
	} else {
		throw new Error(`No path found from table "${start}" to table "${target}".`);
	}
}

const queryModes = [
	"equals",
	"contains",
	"startsWith",
	"endsWith",
	"lt",
	"lte",
	"gt",
	"gte",
	"range",
	"in",
	"notIn",
	"null",
	"notNull",
	"deadValue",
	"boolean"
];
export function parseToQuery(
	table: Uncapitalize<ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation,
	swapTo?: Uncapitalize<ModelName>
) {
	let relation = undefined as Uncapitalize<ModelName> | undefined;
	let field = "";
	let mode = "" as QueryMode;
	let value = "" as ParamsArrayValue;
	if (queryArr.length === 2) {
		field = queryArr[0];
		if (queryArr[1] === "null" || queryArr[1] === "notNull") {
			//search field for null/notNull
			mode = queryArr[1];
		} else {
			//search field for value
			value = queryArr[1] as string;
		}
	} else if (queryArr.length === 3) {
		if (swapTo) {
			relation = table;
		}

		//search field for value with mode
		field = queryArr[0];
		mode = queryArr[1];
		value = queryArr[2];
	} else if (queryArr.length === 4) {
		//search related table's field for value
		relation = getTableName(queryArr[0]);
		if (relation === swapTo) {
			relation = undefined;
		}

		field = queryArr[1];
		mode = queryArr[2];
		value = queryArr[3];
	}

	if (mode) {
		if (!queryModes.includes(mode)) {
			throw new Error(`Query mode "${mode}" not supported.`);
		}

		if ((mode === "null" || mode === "notNull") && queryArr[2] != null) {
			throw new Error('Modes "null" and "notNull" do not support values.');
		}
	}

	const model = relation || swapTo || table;

	if (TableMetadata[model].relations.some((rel) => rel.field === field) && typeof value === "object") {
		return { [field]: value };
	}

	const zodType = getZodType(model, field);

	let searchWhere;
	//universal mode behavior
	if (mode === "null" || mode === "notNull") {
		if (zodType.optional) {
			if (mode === "null") {
				searchWhere = {
					[field]: null
				};
			} else if (mode === "notNull") {
				searchWhere = {
					[field]: { not: null }
				};
			}
		} else {
			throw new Error(`Mode may not be null or notNull, as field named "${field}" is not optional.`);
		}
	} else if (mode === "in" || mode === "notIn") {
		//uncompress if necessary
		if (typeof value === "string" && value.startsWith(COMPRESSION_FORMAT)) {
			value = JSON.parse(decompressURIComponent(value));
			if (!Array.isArray(value) || !value.every((v) => typeof v !== "object")) {
				throw new Error(`If value is string, it must be an array of primitives in ${COMPRESSION_FORMAT} format.`);
			}
		}

		searchWhere = {
			[field]: {
				[mode]: value
			}
		};
	} else if (zodType.type === "boolean") {
		if (mode && mode !== "boolean") {
			throw new Error(`Mode must be boolean, but is ${mode}.`);
		}
		if (typeof value !== "boolean") {
			throw new Error(`Value must be boolean, but was provided ${typeof value}.`);
		}

		//TODO: test if booleans work properly
		searchWhere = {
			[field]: value
		};
	} else if (zodType.type === "string") {
		//string behavior
		const typedVal = value as string;
		if (mode) {
			if (mode === "deadValue") {
				if (!DeadValues.includes(typedVal) && typedVal.toLowerCase() !== "any") {
					throw new Error(`Invalid deadValue option "${typedVal}".`);
				}

				if (typedVal.toLowerCase() === "any") {
					searchWhere = {
						[field]: {
							in: DeadValues
						}
					};
				} else {
					searchWhere = {
						[field]: typedVal
					};
				}
			} else {
				searchWhere = {
					[field]: {
						[mode]: typedVal.replace("_", "\\_").replace("%", "\\%"),
						mode: "insensitive"
					}
				};
			}
		} else {
			searchWhere = {
				[field]: {
					contains: typedVal.replace("_", "\\_").replace("%", "\\%"),
					mode: "insensitive"
				}
			};
		}
	} else if (zodType.type === "integer" || zodType.type === "float") {
		//number behavior
		if (mode === "range") {
			const typedVal = value as [number, number];
			searchWhere = {
				AND: [
					{
						[field]: {
							gte: typedVal[0]
						}
					},
					{
						[field]: {
							lte: typedVal[1]
						}
					}
				]
			};
		} else if (mode === "deadValue") {
			const typedVal = value as string;

			if (!DeadValues.includes(typedVal) && typedVal.toLowerCase() !== "any") {
				throw new Error(`Invalid deadValue option "${typedVal}".`);
			}

			if (typedVal.toLowerCase() === "any") {
				searchWhere = {
					AND: [
						{
							[field]: {
								gte: DeadValueNumbers[0]
							}
						},
						{
							[field]: {
								lte: DeadValueNumbers[DeadValueNumbers.length - 1]
							}
						}
					]
				};
			} else {
				searchWhere = {
					[field]: DeadValueEnum[typedVal as keyof typeof DeadValueEnum]
				};
			}
		} else {
			const typedVal = value as number;

			if (!mode || mode === "equals") {
				searchWhere = { [field]: typedVal };
			} else {
				searchWhere = { [field]: { [mode]: typedVal } };
			}
		}
	} else if (zodType.type === "date") {
		//date behavior
		if (mode === "range") {
			const typedVal = value as [string, string];
			searchWhere = {
				AND: [
					{
						[field]: {
							gte: new Date(typedVal[0])
						}
					},
					{
						[field]: {
							lte: new Date(typedVal[1])
						}
					}
				]
			};
		} else if (mode === "deadValue") {
			const typedVal = value as string;

			if (!DeadValues.includes(typedVal) && typedVal.toLowerCase() !== "any") {
				throw new Error(`Invalid deadValue option "${typedVal}".`);
			}

			if (typedVal.toLowerCase() === "any") {
				searchWhere = {
					AND: [
						{
							[field]: {
								gte: new Date(DeadValueNumbers[0])
							}
						},
						{
							[field]: {
								lte: new Date(DeadValueNumbers.at(-1)!)
							}
						}
					]
				};
			} else {
				searchWhere = {
					[field]: new Date(DeadValueEnum[typedVal as keyof typeof DeadValueEnum])
				};
			}
		} else {
			const typedVal = value as string;

			const dateVal = new Date(typedVal);
			if (isNaN(dateVal.valueOf())) {
				throw new Error(`The field "${field}" is a date field, but "${typedVal}" is not a date.`);
			}

			let lteOffset;
			if (typedVal.includes("T")) {
				lteOffset = 60 * 60 * 1000;
			} else {
				lteOffset = 24 * 60 * 60 * 1000;
			}

			if (mode === "equals") {
				searchWhere = {
					AND: [
						{
							[field]: {
								gte: dateVal
							}
						},
						{
							[field]: {
								lte: new Date(dateVal.getTime() + lteOffset)
							}
						}
					]
				};
			} else {
				searchWhere = {
					[field]: {
						[mode]: dateVal
					}
				};
			}
		}
	} else if (zodType.type === "string[]") {
		//TODO: add string arrays back to schema once Prisma supports contains on arrays
	}

	if (searchWhere) {
		if (relation) {
			return deepWhere(swapTo || table, getTableName(relation), searchWhere);
		} else {
			return searchWhere;
		}
	} else {
		return {};
	}
}

function advancedRecurse(
	table: Uncapitalize<ModelName>,
	e: ParamsArray[0],
	swapTo?: Uncapitalize<ModelName>
): ReturnType<typeof parseToQuery> | { AND: any[] } | { OR: any[] } {
	// New logical group support: ["AND", ...children] or ["OR", ...children]
	if (typeof e[0] === "string") {
		const first = e[0] as string;

		if (first === "AND" || first === "OR") {
			const operator = first;
			const children = (e.slice(1) as ParamsArray).map((child) => advancedRecurse(table, child));
			return { [operator]: children } as { AND: any[] } | { OR: any[] };
		}

		// Backwards-compatible behaviour: a tuple starting with a string is a field or relation filter
		return parseToQuery(table, e as ParamsArrayField | ParamsArrayRelation, swapTo);
	}

	// Legacy nested array syntax: an inner ParamsArray represents an implicit OR group
	const paramsE = e as ParamsArray;
	return { OR: paramsE.map((child) => advancedRecurse(table, child)) };
}

export function parseAdvancedQuery(
	table: Uncapitalize<ModelName>,
	paramsArray: ParamsArray,
	swapTo?: Uncapitalize<ModelName>
) {
	return { AND: paramsArray.map((e) => advancedRecurse(table, e, swapTo)) };
}

export function parseSearchQuery(table: Uncapitalize<ModelName>, search: string) {
	//search entire table for value
	const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
	for (const field of TableMetadata[table].enumSchema.options) {
		const type = getZodType(table, field).type;

		if (type === "string") {
			ors.push({
				[field]: { contains: search.toString().replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" }
			});
		}
	}

	if (ors.length) {
		return { OR: ors };
	} else {
		throw new Error("Table has no string fields to search.");
	}
}
