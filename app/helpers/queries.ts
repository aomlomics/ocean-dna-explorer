import TableMetadata, { RelationMetadata } from "@/types/tableMetadata";
import { getRelationPath, getTableName, getZodType, parseSchemaToObject } from "./schema";
import {
	ErrorPacket,
	ParamsArray,
	ParamsArrayField,
	ParamsArrayRelation,
	ParamsArrayValue,
	QueryMode
} from "@/types/globals";
import { Assay, DeadBoolean, Prisma, PrismaClient } from "../generated/prisma/client";
import { Prisma as PrismaImage } from "../generated/prismaImages/client";
import { deepMerge, getShapesFromUrl, uncapitalizeTable } from "./utils";
import { decompressFromEncodedURIComponent } from "lz-string";
import { DeadBooleanToEnum, DeadValueEnum, DeadValueNumbers, DeadValues } from "@/types/enums";
import { parse } from "csv-parse";
import { AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { $ZodIssue, ParseContext } from "zod/v4/core";
import { ZodError } from "zod";

export function deepWhere(
	start: Uncapitalize<Prisma.ModelName>,
	target: Uncapitalize<Prisma.ModelName>,
	query: { [k: string]: any }
) {
	//find all paths to target from start
	const path = getRelationPath(start, target);

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
	table: Uncapitalize<Prisma.ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation,
	swapTo?: Uncapitalize<Prisma.ModelName>
) {
	let relation = undefined as Uncapitalize<Prisma.ModelName> | undefined;
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
		if (typeof value === "string" && value.startsWith("compressed/lz-string:")) {
			value = JSON.parse(decompressFromEncodedURIComponent(value.substring("compressed/lz-string:".length)));
			if (!Array.isArray(value) || !value.every((v) => typeof v !== "object")) {
				throw new Error("Value must be an array of primitives compressed with lz-string.");
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
								lte: new Date(DeadValueNumbers[DeadValueNumbers.length - 1])
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
	table: Uncapitalize<Prisma.ModelName>,
	e: ParamsArray[0],
	swapTo?: Uncapitalize<Prisma.ModelName>
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
	table: Uncapitalize<Prisma.ModelName>,
	paramsArray: ParamsArray,
	swapTo?: Uncapitalize<Prisma.ModelName>
) {
	return { AND: paramsArray.map((e) => advancedRecurse(table, e, swapTo)) };
}

export function parseSearchQuery(table: Uncapitalize<Prisma.ModelName>, search: string) {
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

export function parseApiQuery(
	table: Uncapitalize<Prisma.ModelName>,
	searchParams: URLSearchParams,
	options?: {
		features?: {
			orderBy?: true;
			fields?: true;
			distinct?: true;
			relations?: true;
			relationsLimit?: true;
			ids?: true;
			limit?: true;
			filters?: true;
			advanced?: true;
			search?: true;
			shapes?: true;
		};
		defaults?: {
			fields?: Record<string, true>;
			distinct?: string[];
			// relations?: Record<
			// 	string,
			// 	| true
			// 	| { take: number }
			// 	| {
			// 			take?: number;
			// 			select: { id: true };
			// 	  }
			// >;
			// relationsLimit?: number;
			// ids?: number[];
			// limit?: number;
			filters?: Record<string, string | number>;
		};
		swapToTable?: true;
		sampleWhere?: true;
	}
) {
	//copy search params
	const params = new URLSearchParams(searchParams);

	const query = {} as {
		orderBy?: Record<string, Prisma.SortOrder | { _count: Prisma.SortOrder }>;
		select?: Record<string, any>;
		include?: Record<string, any>;
		where?: Record<string, any>;
		take?: number;
		distinct?: string[];
	};

	//construct shapes
	let shapes;
	if (!options?.features || options.features.shapes) {
		const tempShapes = getShapesFromUrl(params);

		if (tempShapes) {
			shapes = tempShapes;
			params.delete("polygon");
			params.delete("circle");
		}
	}

	//ordering results
	if (!options?.features || options.features.orderBy) {
		const orderByStr = params.get("orderBy");
		if (orderByStr) {
			params.delete("orderBy");
			const split = orderByStr?.split(",");
			if (split.length === 2 && (split[1] === "asc" || split[1] === "desc")) {
				if (TableMetadata[table].enumSchema.options.includes(split[0])) {
					query.orderBy = {
						[split[0]]: split[1]
					};
				} else if (TableMetadata[table].relations.find((rel) => rel.field === split[0] && rel.type.endsWith("many"))) {
					query.orderBy = {
						[split[0]]: {
							_count: split[1]
						}
					};
				} else {
					throw new Error("The orderBy must be a field or a -to-many relation.");
				}
			} else {
				throw new Error("The orderBy must be a field and order separated by a comma.");
			}
		}
	}

	//selecting fields
	if (options?.defaults?.fields) {
		query.select = options.defaults.fields;
	}

	if (!options?.features || options.features.fields) {
		const fields = params.get("fields");
		if (fields) {
			params.delete("fields");
			const split = fields.split(",").reduce((acc, f) => ({ ...acc, [f]: true }), {});
			query.select = query.select ? { ...query.select, ...split } : split;
		}
	}

	//distinct
	if (options?.defaults?.distinct) {
		query.distinct = options.defaults.distinct;
	}

	if (!options?.features || options.features.distinct) {
		const distinct = params.get("distinct");
		if (distinct) {
			params.delete("distinct");
			const split = distinct.split(",");
			query.distinct = query.distinct ? [...query.distinct, ...split] : split;
		}
	}

	//relations
	if (!options?.features || options.features.relations) {
		const relations = params.get("relations");
		if (relations) {
			params.delete("relations");

			const relTables = new Set() as Set<Uncapitalize<Prisma.ModelName>>;
			for (const r of relations.split(",")) {
				const relTableArr = getTableName(
					r.trim().toLowerCase(),
					`Relation with name "${r}" does not exist in database.`
				);
				relTables.add(relTableArr);
			}

			//relations limit
			let take;
			if (!options?.features || options.features.relationsLimit) {
				const relationsLimit = params.get("relationsLimit");
				if (relationsLimit) {
					params.delete("relationsLimit");
					take = parseInt(relationsLimit);
					if (Number.isNaN(take) || take < 1) {
						throw new Error(`Invalid relations limit: "${relationsLimit}". Limit must be a positive integer.`);
					}
				}
			}

			//include all fields in relations
			let allFields = undefined as undefined | boolean | Set<Uncapitalize<Prisma.ModelName>>;
			const relationsAllFields = params.get("relationsAllFields");
			if (relationsAllFields) {
				params.delete("relationsAllFields");
				if (!relationsAllFields || relationsAllFields.toLowerCase() === "false") {
					allFields = false;
				} else if (relationsAllFields.toLowerCase() === "true") {
					allFields = true;
				} else {
					allFields = new Set() as Set<Uncapitalize<Prisma.ModelName>>;
					for (const r of relationsAllFields.split(",")) {
						const trimmed = r.trim().toLowerCase();
						const allFieldsArr = Object.entries(TableMetadata).find(
							([t, metadata]) => trimmed === t.toLowerCase() || trimmed === metadata.plural.toLowerCase()
						);
						if (!allFieldsArr) {
							throw new Error(
								`Invalid value for relationsAllFields: "${relationsAllFields}". Value must be "true", "false", or a relation provided in the "relations" field. Value was "${r}".`
							);
						}
						allFields.add(allFieldsArr[0] as Uncapitalize<Prisma.ModelName>);
					}
				}
			}

			const relPaths = [] as RelationMetadata[][];
			const includeSteps = new Set() as Set<string>;
			for (const rt of relTables) {
				const path = getRelationPath(table, rt);
				if (!path) {
					throw new Error(`No path exists from ${table} to ${rt}.`);
				}

				let add = true;
				for (let i = 0; i < relPaths.length; i++) {
					if (allFields) {
						if (
							path.length < relPaths[i].length &&
							relPaths[i].some((step) => path[path.length - 1].field === step.field)
						) {
							//already a part of another path
							if (allFields === true || allFields.has(uncapitalizeTable(path[path.length - 1].table))) {
								includeSteps.add(path[path.length - 1].field);
							}

							if (!take) {
								add = false;
							}
						} else {
							if (
								path.length > relPaths[i].length &&
								path.some((step) => relPaths[i][relPaths[i].length - 1].field === step.field)
							) {
								//existing path is a part of new path
								if (allFields === true || allFields.has(uncapitalizeTable(relPaths[i][relPaths[i].length - 1].table))) {
									includeSteps.add(relPaths[i][relPaths[i].length - 1].field);
								}

								relPaths.splice(i, 1);
								i--;
							}
						}
					}
				}

				if (add) {
					relPaths.push(path);
				}
			}

			//assemble final query step before checking allFields
			let relationVal = true as
				| true
				| { take: number }
				| {
						take?: number;
						select: { id: true };
				  };
			if (take) {
				relationVal = { take };
			}

			type FinalVal = typeof relationVal | { [key: string]: FinalVal };
			const relObjs = relPaths.map((rp) => {
				let currVal = relationVal as FinalVal;
				if (!allFields || (allFields !== true && !allFields.has(uncapitalizeTable(rp[rp.length - 1].table)))) {
					if (typeof relationVal === "object") {
						currVal = { ...relationVal, select: { id: true } };
					} else {
						currVal = { select: { id: true } };
					}
				}

				const last = rp.pop()!;
				currVal = { [last.field]: currVal };

				for (const rel of rp.toReversed()) {
					currVal = {
						[rel.field]: includeSteps.has(rel.field) ? { include: currVal } : { select: { id: true, ...currVal } }
					};
				}

				return currVal as { [key: string]: FinalVal };
			});

			if (query.select) {
				query.select = deepMerge(query.select, ...relObjs);
			} else {
				query.include = deepMerge({}, ...relObjs);
			}
		}
	}

	//limit
	if (!options?.features || options.features.limit) {
		const take = params.get("limit");
		if (take) {
			params.delete("limit");
			query.take = parseInt(take);
			if (Number.isNaN(query.take) || query.take < 1) {
				throw new Error(`Invalid limit: "${take}". Limit must be a positive integer.`);
			}
		}
	}

	let sampleWhere;

	const advanced = params.get("advanced");
	if ((!options?.features || options.features.advanced) && advanced) {
		//advanced search
		params.delete("advanced");

		if (Array.from(params).length) {
			throw new Error("Advanced search may not include other filter parameters.");
		}

		const parsed = JSON.parse(advanced) as ParamsArray;
		if (parsed.length) {
			query.where = parseAdvancedQuery(table, parsed, options && options.swapToTable ? table : undefined);
		}

		//assemble secondary query if table doesn't have location data
		if (
			sampleWhere &&
			(!TableMetadata[table].enumSchema.options.includes("decimalLatitude") ||
				!TableMetadata[table].enumSchema.options.includes("decimalLongitude"))
		) {
			if (parsed.length) {
				sampleWhere = parseAdvancedQuery(table, parsed, "sample");
			} else {
				sampleWhere = {};
			}
		}
	} else {
		const ids = params.get("ids");
		const search = params.get("search");

		if ((!options?.features || options.features.ids) && ids) {
			//list of ids
			params.delete("ids");

			if (Array.from(params).length) {
				throw new Error("Filtering with a list of ids may not include other filter parameters.");
			}

			const parsedIds = [] as number[];
			for (const id of ids.split(",")) {
				if (id) {
					const parsed = parseInt(id);
					if (Number.isNaN(parsed)) {
						throw new Error(`Invalid ID: "${id}". ID must be an integer.`);
					}
					parsedIds.push(parsed);
				}
			}

			query.where = {
				id: {
					in: parsedIds
				}
			};
		} else if ((!options?.features || options.features.search) && search) {
			//string search
			params.delete("search");

			if (Array.from(params).length) {
				throw new Error("Search may not include other filter parameters.");
			}

			query.where = parseSearchQuery(table, search);
		} else {
			//filtering
			if (options?.defaults?.filters) {
				query.where = options.defaults.filters;
			}

			if (!options?.features || options.features.filters) {
				if (!query.where) {
					query.where = {} as Record<string, any>;
				}

				params.forEach((value, key) => {
					const type = getZodType(table, key).type;

					const arr = value.split(",");
					if (arr.length > 1) {
						query.where!.OR = [];
						if (type === "string") {
							for (const val of arr) {
								query.where!.OR.push({
									[key]: { contains: val.replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" }
								});
							}
						} else if (type === "integer") {
							for (const val of arr) {
								query.where!.OR.push({ [key]: parseInt(val) });
							}
						} else if (type === "float") {
							for (const val of arr) {
								query.where!.OR.push({ [key]: parseFloat(val) });
							}
						} else {
							for (const val of arr) {
								query.where!.OR.push({ [key]: val });
							}
						}
					} else {
						if (type === "string") {
							query.where![key] = {
								contains: value.replace("_", "\\_").replace("%", "\\%"),
								mode: "insensitive"
							};
						} else if (type === "integer") {
							query.where![key] = parseInt(value);
						} else if (type === "float") {
							query.where![key] = parseFloat(value);
						} else {
							query.where![key] = value;
						}
					}
				});
			}
		}

		//assemble secondary query if table doesn't have location data
		if (
			sampleWhere &&
			(!TableMetadata[table].enumSchema.options.includes("decimalLatitude") ||
				!TableMetadata[table].enumSchema.options.includes("decimalLongitude"))
		) {
			if (query.where && Object.keys(query.where).length) {
				sampleWhere = deepWhere("sample", table, query.where);
			} else {
				sampleWhere = {};
			}
		}
	}

	return { query, shapes, sampleWhere };
}

const secureFields = ["userIds"];
export function stripSecureFields(queryResult: Record<string, any> | Record<string, any>[]) {
	if (Array.isArray(queryResult)) {
		for (let e of queryResult) {
			for (let f of secureFields) {
				delete e[f];
			}
		}
	} else {
		for (let f of secureFields) {
			delete queryResult[f];
		}
	}
}

export function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorPacket | undefined {
	try {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			if (err.code === "P2002") {
				return {
					statusMessage: "error",
					error: `${err.meta?.modelName} with provided ${(err.meta?.target as string[]).join(
						", "
					)} already exists in database.`
				};
			} else if (err.code === "P2003") {
				return {
					statusMessage: "error",
					error: `A ${err.meta?.modelName} has an invalid ${(err.meta?.constraint as string)
						.split("_")
						.slice(1, -1)
						.join("_")}.`
				};
			} else {
				return {
					statusMessage: "error",
					error: err.message
				};
			}
		}
	} catch (newErr) {
		const error = newErr as Error;

		return {
			statusMessage: "error",
			error: err.message + "\n" + error.message
		};
	}
}

//TODO: make it work with arrays
async function updateManyRawChunked(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id" as string | string[],
	fields: string[]
) {
	//get shape of table to allow typecasting
	//also verifies against SQL injection attacks
	const deadBooleanFields = [] as string[];

	//add set for provided fields
	const setSql = fields
		.map((f) => {
			const type = getZodType(table, f).type;
			let typecast = "";

			if (type === "DeadBoolean") {
				typecast = '::"DeadBoolean"';
				deadBooleanFields.push(f);
			} else if (type === "json") {
				typecast = "::jsonb";
			} else if (type === "integer") {
				typecast = "::integer";
			} else if (type === "float") {
				typecast = "::float";
			} else if (type === "boolean") {
				typecast = "::boolean";
			} else if (type === "date") {
				typecast = "::timestamp";
			}

			return `"${f}" = "t"."${f}"${typecast}`;
		})
		.join(", ");

	const deadBooleanOptions = Object.keys(DeadBooleanToEnum);
	//parameterized counts
	const valuesSqlArr = [] as string[];
	//parameterized values
	const flatData = [] as (typeof data)[0][keyof (typeof data)[0]][];
	let paramIndex = 0;
	for (const d of data) {
		//add parameterized count(s) for id field(s)
		const valuesStrArr = [
			...(typeof id === "string" ? [`\$${++paramIndex}`] : id.map((i) => `\$${++paramIndex}`))
		] as string[];

		//add flat data for id field(s)
		flatData.push(...(typeof id === "string" ? [d[id]] : id.map((i) => d[i])));

		for (const f of fields) {
			//add parameterized counts
			valuesStrArr.push(`\$${++paramIndex}`);

			//flatten data
			if (d[f] === undefined) {
				flatData.push(null);
			} else {
				const foundOption = deadBooleanOptions.find(
					(db) => DeadBooleanToEnum[db as keyof typeof DeadBooleanToEnum] === d[f]
				);
				if (deadBooleanFields.includes(f) && foundOption) {
					if (foundOption === "0") {
						flatData.push(DeadBoolean.false);
					} else if (foundOption === "1") {
						flatData.push(DeadBoolean.true);
					} else {
						flatData.push(foundOption);
					}
				} else if (d[f] === "JsonNull") {
					flatData.push("[]");
				} else {
					flatData.push(d[f]);
				}
			}
		}
		valuesSqlArr.push("(" + valuesStrArr.join(",") + ")");
	}

	//list field names
	const idFieldsSql = typeof id === "string" ? `"${id}"` : id.map((i) => `"${i}"`).join(", ");
	const fieldsSql = fields.map((f) => `"${f}"`).join(", ");

	//create where statement
	const whereSql =
		typeof id === "string"
			? `"${table}"."${id}" = "t"."${id}"`
			: id.map((i) => `"${table}"."${i}" = "t"."${i}"`).join(" AND ");

	//combine into prepared statement
	const sql = `UPDATE "${table}" SET ${setSql} FROM (VALUES ${valuesSqlArr.join(
		","
	)}) AS t(${idFieldsSql}, ${fieldsSql}) WHERE ${whereSql}`;

	return client.$executeRawUnsafe(sql, ...flatData);
}

export async function updateManyRaw(
	client: any,
	table: Prisma.ModelName,
	data: Record<string, any>[],
	id = "id" as string | string[]
) {
	//get fields from data
	const fieldsWithId = new Set() as Set<string>;
	for (const d of data) {
		for (const field in d) {
			fieldsWithId.add(field);
		}
	}
	const fields = Array.from(fieldsWithId) as string[];

	//remove id field(s) to be handled separately
	if (typeof id === "string") {
		const keyIndex = fields.indexOf(id);
		if (keyIndex === -1) {
			throw new Error(
				`No field named "${id}" found for raw update on table named "${table}" for ${data.length} entries.`
			);
		} else {
			fields.splice(keyIndex, 1);
		}
	} else {
		for (const i of id) {
			const keyIndex = fields.indexOf(i);
			if (keyIndex === -1) {
				throw new Error(
					`No field named "${i}" found in data for raw update on table named "${table}" for ${data.length} entries.`
				);
			} else {
				fields.splice(keyIndex, 1);
			}
		}
	}

	let rowsAffected = 0;
	const CHUNK_SIZE = 30000 / fieldsWithId.size; //Prisma prepared statements have a limit of 32,767
	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		rowsAffected += await updateManyRawChunked(client, table, data.slice(i, i + CHUNK_SIZE), id, fields);
	}

	return rowsAffected;
}

export async function seedAssays(client: PrismaClient, assayMasterListUrl = process.env.ASSAY_MASTER_LIST) {
	console.log("Seeding database with assays from " + assayMasterListUrl);

	const assaySeedFile = await fetch(assayMasterListUrl as string);
	if (!assaySeedFile.ok) {
		throw new Error(
			`Could not fetch seed file from Github. Verify that "${assayMasterListUrl}" is a valid URL. If the file location has moved, notify a maintainer.`
		);
	}

	const assays = [] as Prisma.AssayCreateManyInput[];
	const parser = parse(await assaySeedFile.text(), { columns: true, delimiter: "\t" });
	for await (const record of parser) {
		const recordList = Object.entries(record) as [string, string][];
		const assayRow = {} as Assay;

		for (const [field, v] of recordList) {
			if (AssayScalarFieldEnumSchema.safeParse(field).error) {
				throw new Error(`Could not validate field named ${field} for Assay.`);
			}

			parseSchemaToObject(field, v, assayRow, "assay");
		}

		const parsed = AssayOptionalDefaultsSchema.parse(assayRow, {
			error: (iss) => {
				return {
					message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
				};
			}
		});
		assays.push(parsed);
	}

	const assayNames = assays.map((a) => a.assay_name);

	await client.$transaction(async (tx) => {
		//create new assays
		const newAssays = await tx.assay.createManyAndReturn({
			data: assays,
			skipDuplicates: true,
			select: {
				pcr_primer_forward: true,
				pcr_primer_reverse: true
			}
		});

		//update existing assays
		const assaysToUpdate = assays.filter(
			(a) =>
				!newAssays.some(
					(dbA) => dbA.pcr_primer_forward === a.pcr_primer_forward && dbA.pcr_primer_reverse === a.pcr_primer_reverse
				)
		);
		if (assaysToUpdate.length) {
			await updateManyRaw(tx, "Assay", assaysToUpdate, ["pcr_primer_forward", "pcr_primer_reverse"]);
		}

		//delete any removed assays that are unused
		await tx.assay.deleteMany({
			where: {
				assay_name: {
					notIn: assayNames
				},
				Libraries: {
					none: {}
				},
				Analyses: {
					none: {}
				}
			}
		});
	});

	console.log("Seed successful");
}

export function schemaParseErrorFunction(iss: Parameters<NonNullable<ParseContext<$ZodIssue>["error"]>>[0]) {
	return {
		message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
	};
}

export function getSchemaParseError(error: ZodError, table: Prisma.ModelName | PrismaImage.ModelName, keys: string[]) {
	return (
		`Table: ${table}\n` +
		keys?.map((k) => `Key: ${k}`).join("\n") +
		`\n${error.issues.map((e) => e.message).join("\n\n")}`
	);
}
