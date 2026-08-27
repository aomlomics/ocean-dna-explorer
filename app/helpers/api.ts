import type { ParamsArray, ParamsArrayField, ParamsArrayRelation, ParamsArrayValue, QueryMode } from "@/types/globals";
import type { Prisma } from "../generated/prisma/client";
import { getTableName, getZodType } from "./schema";
import TableMetadata, { RelationMetadata } from "@/types/tableMetadata";
import { COMPRESSION_FORMAT, decompressURIComponent, deepMerge, getShapesFromUrl, uncapitalizeTable } from "./utils";
import { DeadValueEnum, DeadValueNumbers, DeadValues } from "@/types/enums";
import { insertBlastIntoQuery, parseBlastRequest } from "./blast";

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
	start: Uncapitalize<Prisma.ModelName>,
	target: Uncapitalize<Prisma.ModelName>,
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
			blast?: true;
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
	const newParams = new URLSearchParams(searchParams);

	const query = {} as {
		orderBy?: Record<string, Prisma.SortOrder | { _count: Prisma.SortOrder }>;
		select?: Record<string, any>;
		include?: Record<string, any>;
		where?: Record<string, any>;
		take?: number;
		distinct?: string[];
	};

	const trusted = newParams.get("trusted")?.toLowerCase() === "true" ? true : false;
	newParams.delete("trusted");

	//blast query
	let blast;
	if (!options?.features || options.features.blast) {
		blast = parseBlastRequest(newParams);
	}

	//construct shapes
	let shapes;
	if (!options?.features || options.features.shapes) {
		shapes = getShapesFromUrl(newParams);
		if (shapes) {
			newParams.delete("polygon");
			newParams.delete("circle");
		}
	}
	const hasLocationData =
		TableMetadata[table].enumSchema.options.includes("decimalLatitude") &&
		TableMetadata[table].enumSchema.options.includes("decimalLongitude");

	//ordering results
	if (!options?.features || options.features.orderBy) {
		const orderByStr = newParams.get("orderBy");
		if (orderByStr != null) {
			newParams.delete("orderBy");
			const [field, order] = orderByStr?.split(",");
			if (field && (order === "asc" || order === "desc")) {
				if (TableMetadata[table].enumSchema.options.includes(field)) {
					query.orderBy = {
						[field]: order
					};
				} else if (TableMetadata[table].relations.find((rel) => rel.field === field && rel.type.endsWith("many"))) {
					query.orderBy = {
						[field]: {
							_count: order
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
		const fields = newParams.get("fields");
		if (fields != null) {
			newParams.delete("fields");
			const split = fields.split(",").reduce(
				(acc, f) => {
					getZodType(table, f);
					acc[f] = true;
					return acc;
				},
				{} as Record<string, true>
			);
			query.select = query.select ? { ...query.select, ...split } : split;
		}
	}

	//distinct
	if (options?.defaults?.distinct) {
		query.distinct = options.defaults.distinct;
	}

	if (!options?.features || options.features.distinct) {
		const distinct = newParams.get("distinct");
		if (distinct != null) {
			newParams.delete("distinct");
			const split = distinct.split(",");
			query.distinct = query.distinct ? [...query.distinct, ...split] : split;
		}
	}

	//relations
	if (!options?.features || options.features.relations) {
		const relations = newParams.get("relations");
		if (relations != null) {
			newParams.delete("relations");

			const relTables = new Set() as Set<Uncapitalize<Prisma.ModelName>>;
			for (const r of relations.split(",")) {
				const relTableArr = getTableName(r.trim().toLowerCase());
				if (!relTableArr) {
					throw new Error(`Relation with name "${r}" does not exist in database.`);
				}
				relTables.add(relTableArr);
			}

			//relations limit
			let take;
			if (!options?.features || options.features.relationsLimit) {
				const relationsLimit = newParams.get("relationsLimit");
				if (relationsLimit != null) {
					newParams.delete("relationsLimit");
					take = parseInt(relationsLimit);
					if (Number.isNaN(take) || take < 1) {
						throw new Error(`Invalid relations limit: "${relationsLimit}". Limit must be a positive integer.`);
					}
				}
			}

			//include all fields in relations
			let allFields = undefined as undefined | boolean | Set<Uncapitalize<Prisma.ModelName>>;
			const relationsAllFields = newParams.get("relationsAllFields");
			if (relationsAllFields != null) {
				newParams.delete("relationsAllFields");
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
				const path = TableMetadata[table].relationPaths[rt];
				if (!path) {
					throw new Error(`No path exists from ${table} to ${rt}.`);
				}

				let add = true;
				for (let i = 0; i < relPaths.length; i++) {
					if (allFields) {
						const currRelPath = relPaths[i]!;
						const lastPath = path.at(-1)!;
						if (path.length < currRelPath.length && currRelPath.some((step) => lastPath.field === step.field)) {
							//already a part of another path
							if (allFields === true || allFields.has(uncapitalizeTable(lastPath.table))) {
								includeSteps.add(lastPath.field);
							}

							if (!take) {
								add = false;
							}
						} else {
							const lastRelPath = currRelPath.at(-1)!;
							if (path.length > currRelPath.length && path.some((step) => lastRelPath.field === step.field)) {
								//existing path is a part of new path
								if (allFields === true || allFields.has(uncapitalizeTable(lastRelPath.table))) {
									includeSteps.add(lastRelPath.field);
								}

								relPaths.splice(i, 1);
								i--;
							}
						}
					}
				}

				if (add) {
					relPaths.push([...path]);
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
				if (!allFields || (allFields !== true && !allFields.has(uncapitalizeTable(rp.at(-1)!.table)))) {
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
		const take = newParams.get("limit");
		if (take != null) {
			newParams.delete("limit");
			query.take = parseInt(take);
			if (Number.isNaN(query.take) || query.take < 1) {
				throw new Error(`Invalid limit: "${take}". Limit must be a positive integer.`);
			}
		}
	}

	let sampleWhere;

	const advanced = newParams.get("advanced");
	if ((!options?.features || options.features.advanced) && advanced != null) {
		//advanced search
		newParams.delete("advanced");

		if (Array.from(newParams).length) {
			throw new Error("Advanced search may not include other filter parameters.");
		}

		const parsed = JSON.parse(advanced) as ParamsArray;
		if (parsed.length) {
			query.where = parseAdvancedQuery(table, parsed, options && options.swapToTable ? table : undefined);
		}

		//assemble secondary query if table doesn't have location data
		if (shapes && !hasLocationData) {
			if (parsed.length) {
				sampleWhere = parseAdvancedQuery(table, parsed, "sample");
			} else {
				sampleWhere = {};
			}
		}
	} else {
		const ids = newParams.get("ids");
		const search = newParams.get("search");

		if ((!options?.features || options.features.ids) && ids != null) {
			//list of ids
			newParams.delete("ids");

			if (Array.from(newParams).length) {
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
		} else if ((!options?.features || options.features.search) && search != null) {
			//string search
			newParams.delete("search");

			if (Array.from(newParams).length) {
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

				newParams.forEach((value, key) => {
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
		if (shapes && !hasLocationData) {
			if (query.where && Object.keys(query.where).length) {
				sampleWhere = deepWhere("sample", table, query.where);
			} else {
				sampleWhere = {};
			}
		}
	}

	return { trusted, query, blast, shapes, sampleWhere };
}
