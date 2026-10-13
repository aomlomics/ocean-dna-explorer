import type { ParamsArray, ParamsArrayField, ParamsArrayRelation, ParamsArrayValue, QueryMode } from "@/types/globals";
import type { Prisma } from "@/app/generated/prisma/browser";
import { getDataTableName, getTableName, getZodType } from "./schema";
import TableMetadata, { DataTableNames, type ModelName, type RelationMetadata } from "@/types/tableMetadata";
import {
	capitalizeTable,
	COMPRESSION_FORMAT,
	decompressURIComponent,
	deepMerge,
	getShapesFromUrl,
	parseNestedJson,
	uncapitalizeTable
} from "./utils";
import { DeadValueEnum, DeadValueNumbers, DeadValues } from "@/types/enums";
import { insertBlastIntoQuery, parseBlastRequest } from "./blast";
import { AppError } from "@/types/objects";

export function buildParams(searchParams: URLSearchParams, query: URLSearchParams, ignoreParams?: string[]) {
	const tempParams = new URLSearchParams(searchParams);

	insertBlastIntoQuery(parseBlastRequest(tempParams), query);

	//pull out shapes
	tempParams.getAll("polygon").forEach((poly) => query.set("polygon", poly));
	tempParams.delete("polygon");
	tempParams.getAll("circle").forEach((cir) => query.set("circle", cir));
	tempParams.delete("circle");

	//get rest of queries
	if (query) {
		tempParams.forEach((value, key) => query.set(key, value));
		ignoreParams?.forEach((param) => query.delete(param));
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
		throw new AppError(`No path found from table "${start}" to table "${target}".`);
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
function parseToQuery(
	table: Uncapitalize<ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation,
	options: { swapTo?: Uncapitalize<ModelName>; invalidFieldError?: string }
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
		if (options.swapTo) {
			relation = table;
		}

		//search field for value with mode
		field = queryArr[0];
		mode = queryArr[1];
		value = queryArr[2];
	} else if (queryArr.length === 4) {
		//search related table's field for value
		relation = getTableName(queryArr[0]);
		if (relation === options.swapTo) {
			relation = undefined;
		}

		field = queryArr[1];
		mode = queryArr[2];
		value = queryArr[3];
	}

	if (mode) {
		if (!queryModes.includes(mode)) {
			throw new AppError(`Query mode "${mode}" not supported.`);
		}

		if ((mode === "null" || mode === "notNull") && queryArr[2] != null) {
			throw new AppError('Modes "null" and "notNull" do not support values.');
		}
	}

	const model = relation || options.swapTo || table;

	if (TableMetadata[model].relations.some((rel) => rel.field === field) && typeof value === "object") {
		return { [field]: value };
	}

	const zodType = getZodType(model, field, options.invalidFieldError);

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
			throw new AppError(`Mode may not be null or notNull, as field named "${field}" is not optional.`);
		}
	} else if (mode === "in" || mode === "notIn") {
		//uncompress if necessary
		if (typeof value === "string" && value.startsWith(COMPRESSION_FORMAT)) {
			value = JSON.parse(decompressURIComponent(value));
			if (!Array.isArray(value) || !value.every((v) => typeof v !== "object")) {
				throw new AppError(`If value is string, it must be an array of primitives in ${COMPRESSION_FORMAT} format.`);
			}
		}

		searchWhere = {
			[field]: {
				[mode]: value
			}
		};
	} else if (zodType.type === "boolean") {
		if (mode && mode !== "boolean") {
			throw new AppError(`Mode must be boolean, but is ${mode}.`);
		}
		if (typeof value !== "boolean") {
			throw new AppError(`Value must be boolean, but was provided ${typeof value}.`);
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
					throw new AppError(`Invalid deadValue option "${typedVal}".`);
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
			const typedVal = value as [string, string];
			searchWhere = {
				AND: [
					{
						[field]: {
							gte: Number(typedVal[0])
						}
					},
					{
						[field]: {
							lte: Number(typedVal[1])
						}
					}
				]
			};
		} else if (mode === "deadValue") {
			const typedVal = value as string;

			if (!DeadValues.includes(typedVal) && typedVal.toLowerCase() !== "any") {
				throw new AppError(`Invalid deadValue option "${typedVal}".`);
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
			if (!mode || mode === "equals") {
				searchWhere = { [field]: Number(value) };
			} else {
				searchWhere = { [field]: { [mode]: Number(value) } };
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
				throw new AppError(`Invalid deadValue option "${typedVal}".`);
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
				throw new AppError(`The field "${field}" is a date field, but "${typedVal}" is not a date.`);
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
			return deepWhere(options.swapTo || table, getTableName(relation), searchWhere);
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
		return parseToQuery(table, e as ParamsArrayField | ParamsArrayRelation, { swapTo });
	}

	// Legacy nested array syntax: an inner ParamsArray represents an implicit OR group
	const paramsE = e as ParamsArray;
	return { OR: paramsE.map((child) => advancedRecurse(table, child)) };
}

function parseAdvancedQuery(
	table: Uncapitalize<ModelName>,
	paramsArray: ParamsArray,
	swapTo?: Uncapitalize<ModelName>
) {
	return { AND: paramsArray.map((e) => advancedRecurse(table, e, swapTo)) };
}

function parseSearchQuery(table: Uncapitalize<ModelName>, search: string) {
	//search entire table for value
	const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
	for (const field of TableMetadata[table].enumSchema.options) {
		const type = getZodType(table, field).type;

		if (type === "string") {
			ors.push({
				[field]: { contains: search.replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" }
			});
		}
	}

	if (ors.length) {
		return { OR: ors };
	} else {
		throw new AppError("Table has no string fields to search.");
	}
}

export function parseApiToObject(
	table: Uncapitalize<ModelName>,
	searchParams: URLSearchParams,
	options?: {
		features?: {
			orderBy?: true;
			fields?: true;
			distinct?: true;
			relations?: true;
			relCounts?: true;
			ids?: true;
			filters?: true;
			advanced?: true;
			search?: true;
		};
		defaults?: {
			filters?: Record<string, string | number>;
		};
		extras?: {
			limit?: true;
			deepRelations?: true; //internal
			blast?: true;
			shapes?: true;
		};
		swapToTable?: true; //internal
	}
) {
	//copy search params
	const newParams = new URLSearchParams(searchParams);

	const queryObject = {} as {
		orderBy?: { field: string; type: "field" | "relationCount"; sort: Prisma.SortOrder };
		fields?: string[];
		distinct?: string[];
		relCounts?: string[];
		deepRels?: Uncapitalize<ModelName>[];
	} & (
		| { relTables?: Uncapitalize<ModelName>[]; relFields?: never }
		| { relTables: Uncapitalize<ModelName>[]; relFields: true | Record<Uncapitalize<ModelName>, true | string[]> }
	) &
		({ limit?: number; page?: never } | { limit: number; page: number }) &
		(
			| { advanced?: ParamsArray; ids?: never; search?: never; filters?: never }
			| { advanced?: never; ids?: number[]; search?: never; filters?: never }
			| { advanced?: never; ids?: never; search?: string; filters?: never }
			| { advanced?: never; ids?: never; search?: never; filters?: Record<string, string | number> }
		);

	const trusted = newParams.get("trusted")?.trim().toLowerCase() === "true" ? true : false;
	newParams.delete("trusted");

	const ignoreExtraOptions = newParams.get("ignoreExtraOptions")?.trim().toLowerCase() === "true" ? true : false;
	newParams.delete("ignoreExtraOptions");

	//blast query
	const blast = parseBlastRequest(newParams);
	if (blast && !options?.extras?.blast && !ignoreExtraOptions) {
		throw new AppError("The blastQuery option is not allowed on this route.");
	}

	//construct shapes
	const shapes = getShapesFromUrl(newParams);
	newParams.delete("polygon");
	newParams.delete("circle");
	if (shapes && !options?.extras?.shapes) {
		throw new AppError("The polygon and circle options are not allowed on this route.");
	}
	const hasLocationData =
		TableMetadata[table].enumSchema.options.includes("decimalLatitude") &&
		TableMetadata[table].enumSchema.options.includes("decimalLongitude");

	//ordering results
	const orderByStr = newParams.get("orderBy")?.trim();
	newParams.delete("orderBy");
	if (orderByStr != null) {
		if (options?.features && !options.features.orderBy) {
			if (!ignoreExtraOptions) {
				throw new AppError("The orderBy option is not allowed on this route.");
			}
		} else {
			const [strField, strSort] = orderByStr.split(",");
			const lowerField = strField?.trim().toLowerCase();
			const sort = strSort?.trim().toLowerCase();

			if (strField && (sort === "asc" || sort === "desc")) {
				const field = TableMetadata[table].enumSchema.options.find((f) => f.toLowerCase() === lowerField);

				if (field) {
					queryObject.orderBy = {
						field,
						type: "field",
						sort
					};
				} else {
					const rel = TableMetadata[table].relations.find((rel) => rel.field === strField && rel.type.endsWith("many"));

					if (rel) {
						queryObject.orderBy = {
							field: rel.field,
							type: "relationCount",
							sort
						};
					} else {
						throw new AppError("The first argument of the orderBy option must be a field or a -to-many relation.");
					}
				}
			} else {
				throw new AppError("The orderBy option must be a field and order separated by a comma.");
			}
		}
	}

	//selecting fields
	const fields = newParams.get("fields")?.trim();
	newParams.delete("fields");
	if (fields != null) {
		if (options?.features && !options.features.fields) {
			if (!ignoreExtraOptions) {
				throw new AppError("The fields option is not allowed on this route.");
			}
		} else {
			queryObject.fields = fields.split(",").map((f) => {
				const lower = f.trim().toLowerCase();
				const found = TableMetadata[table].enumSchema.options.find((sf) => sf.toLowerCase() === lower);
				if (!found) {
					throw new AppError(`The field "${f}" does not exist on table named "${table}".`);
				}
				return found;
			});
		}
	}

	//distinct
	const distinct = newParams.get("distinct")?.trim();
	newParams.delete("distinct");
	if (distinct != null) {
		if (options?.features && !options.features.distinct) {
			if (!ignoreExtraOptions) {
				throw new AppError("The distinct option is not allowed on this route.");
			}
		} else {
			queryObject.distinct = distinct.split(",").map((f) => {
				const lower = f.trim().toLowerCase();
				const found = TableMetadata[table].enumSchema.options.find((sf) => sf.toLowerCase() === lower);
				if (!found) {
					throw new AppError(`The field "${f}" does not exist on table named "${table}".`);
				}
				return found;
			});
		}
	}

	//relCounts
	const relCounts = newParams.get("relCounts")?.trim();
	newParams.delete("relCounts");
	if (relCounts != null) {
		if (options?.features && !options.features.relCounts) {
			if (!ignoreExtraOptions) {
				throw new AppError("The relCounts option is not allowed on this route.");
			}
		} else {
			queryObject.relCounts = relCounts.split(",").map((rel) => {
				const relTable = capitalizeTable(
					getDataTableName(rel.trim(), `The table named "${rel}" in the relCounts option does not exist.`)
				);
				const found = TableMetadata[table].relations.find((mr) => mr.table === relTable);
				if (!found) {
					throw new AppError(
						`The table named "${rel}" in the relCounts option is not related to the table named "${table}".`
					);
				}
				return found.field;
			});
		}
	}

	//relations
	const relations = newParams.get("relations")?.trim();
	newParams.delete("relations");

	const relationsFields = newParams.getAll("relationsFields").map((e) => e.trim());
	newParams.delete("relationsFields");

	const relationsAllFields = newParams.get("relationsAllFields")?.trim();
	newParams.delete("relationsAllFields");

	if (relations != null) {
		if (options?.features && !options.features.relations) {
			if (!ignoreExtraOptions) {
				throw new AppError("The relations option is not allowed on this route.");
			}
		} else {
			const relTables = new Set() as Set<Uncapitalize<ModelName>>;
			for (const r of relations.split(",")) {
				const rel = getTableName(r.trim(), `The table named "${r}" in the relations option does not exist.`);
				if (!TableMetadata[table].relationPaths[rel]) {
					throw new AppError(`No path exists from "${table}" to "${rel}" in the relations option.`);
				}

				relTables.add(rel);
			}
			queryObject.relTables = Array.from(relTables);

			if (relationsAllFields != null) {
				if (relationsFields.length) {
					throw new AppError("Only one of relationsFields and relationsAllFields may be specified.");
				}

				const relAllLower = relationsAllFields.toLowerCase();
				if (relAllLower !== "false") {
					if (relAllLower === "true") {
						//TODO: check to see how easy it is to make this only work for fields provided in the relations option
						queryObject.relFields = true;
					} else {
						queryObject.relFields = {} as Record<Uncapitalize<ModelName>, true>;

						for (const r of relationsAllFields.split(",")) {
							const lower = r.trim().toLowerCase();
							const foundArr = Object.entries(TableMetadata).find(
								([t, metadata]) => lower === t.toLowerCase() || lower === metadata.plural.toLowerCase()
							);

							if (!foundArr) {
								throw new AppError(
									`Invalid relationsAllFields: "${relationsAllFields}". The relationsAllFields option must be "true", "false", or a relation provided in the "relations" field. Value was "${r}".`
								);
							}

							const rel = foundArr[0] as Uncapitalize<ModelName>;
							if (!relTables.has(rel)) {
								throw new AppError(
									`The table named "${rel}" in the relationsAllFields option must be included in the relations option.`
								);
							}

							queryObject.relFields[rel] = true;
						}
					}
				}
			} else if (relationsFields.length) {
				queryObject.relFields = {} as Record<Uncapitalize<ModelName>, string[]>;

				for (const rfs of relationsFields) {
					const [relTable, ...fields] = rfs.split(",").map((e) => e.trim());

					if (!relTable || !fields.length) {
						throw new AppError(
							`Invalid relationsFields: "${rfs}". The relationsFields option must be a table name and a list of fields, all separated by commas.`
						);
					}

					const relModel = getTableName(relTable, `Invalid table name for relationsFields: "${relTable}".`);
					if (!relTables.has(relModel)) {
						throw new AppError(
							`The table named "${relModel}" in the relationsFields option must be included in the relations option.`
						);
					}

					fields.forEach((f) => getZodType(relModel, f));
					((queryObject.relFields[relModel] ??= []) as string[]).push(...fields);
				}
			}
		}
	} else {
		if (relationsFields.length) {
			throw new AppError("The relationsFields option requires the relations option.");
		}

		if (relationsAllFields != null) {
			throw new AppError("The relationsAllFields option requires the relations option.");
		}
	}

	//limit
	const tempLimit = newParams.get("limit")?.trim();
	newParams.delete("limit");

	const page = newParams.get("page")?.trim();
	newParams.delete("page");

	if (tempLimit != null) {
		if (!options?.extras?.limit) {
			if (!ignoreExtraOptions) {
				throw new AppError("The limit option is not allowed on this route.");
			}
		} else {
			queryObject.limit = Number(tempLimit);
			if (!Number.isInteger(queryObject.limit) || queryObject.limit < 1) {
				throw new AppError(`Invalid limit: "${tempLimit}". The limit option must be a positive integer.`);
			}

			if (page != null) {
				queryObject.page = Number(page);
				if (!Number.isInteger(queryObject.page) || queryObject.page < 1) {
					throw new AppError(`Invalid page: "${page}". The page option must be a positive integer.`);
				}
			}
		}
	} else if (page != null && !ignoreExtraOptions) {
		throw new AppError("The page option requires the limit option.");
	}

	//get deep relation data
	const deepRelations = newParams.get("deepRelations")?.trim();
	newParams.delete("deepRelations");
	if (deepRelations != null) {
		if (!options?.extras?.deepRelations) {
			if (!ignoreExtraOptions) {
				throw new AppError("The deepRelations option is not allowed on this route.");
			}
		} else {
			if (deepRelations.toLowerCase() !== "false") {
				//get relation tables
				if (deepRelations.toLowerCase() === "true") {
					//all relations
					queryObject.deepRels = DataTableNames.filter(
						(name) =>
							name !== table &&
							TableMetadata[table].relations.every(
								(rel) => uncapitalizeTable(rel.table) !== name && TableMetadata[table].relationPaths[name]
							)
					);
				} else {
					//comma separated list of relations
					queryObject.deepRels = deepRelations.split(",").map((rel) => {
						const name = getDataTableName(
							rel.trim(),
							`The table named "${rel}" in the deepRelations option does not exist.`
						);

						if (!TableMetadata[table].relationPaths[name]) {
							throw new AppError(`No path exists from "${table}" to "${name}" in the relations option.`);
						}

						return name;
					});
				}
			}
		}
	}

	const getSamples = newParams.get("getSamples")?.trim().toLowerCase() === "true";
	newParams.delete("getSamples");
	if (getSamples && !options?.extras?.shapes && !ignoreExtraOptions) {
		throw new AppError("The getSamples option is not allowed on this route.");
	}

	//searching
	// let sampleWhere;
	const advanced = newParams.get("advanced")?.trim();
	newParams.delete("advanced");
	if (advanced != null) {
		//advanced search
		if (options?.features && !options.features.advanced) {
			if (!ignoreExtraOptions) {
				throw new AppError("The advanced option is not allowed on this route.");
			}
		} else {
			if (Array.from(newParams).length) {
				throw new AppError("Advanced search may not include other filter parameters.");
			}

			queryObject.advanced = JSON.parse(advanced) as ParamsArray;
		}
	} else {
		const ids = newParams.get("ids")?.trim();
		newParams.delete("ids");
		const search = newParams.get("search")?.trim();
		newParams.delete("search");

		if (ids != null) {
			//list of ids
			if (options?.features && !options.features.ids) {
				if (!ignoreExtraOptions) {
					throw new AppError("The ids option is not allowed on this route.");
				}
			} else {
				if (Array.from(newParams).length) {
					throw new AppError("Filtering with a list of ids may not include other filter parameters.");
				}

				queryObject.ids = ids.split(",").map((id) => {
					const parsed = Number(id.trim());
					if (!Number.isInteger(parsed)) {
						throw new AppError(`Invalid ID: "${id}". ID must be an integer.`);
					}
					return parsed;
				});
			}
		} else if (search != null) {
			//string search
			if (options?.features && !options.features.search) {
				if (!ignoreExtraOptions) {
					throw new AppError("The search option is not allowed on this route.");
				}
			} else {
				if (Array.from(newParams).length) {
					throw new AppError("Search may not include other filter parameters.");
				}

				queryObject.search = search;
			}
		} else {
			//filtering
			let tempWhere = {} as Record<string, any>;

			//where
			const where = newParams.get("where")?.trim();
			newParams.delete("where");
			if (where != null) {
				for (const [field, value] of Object.entries(parseNestedJson(where) as Record<string, string>)) {
					tempWhere = {
						...tempWhere,
						...parseToQuery(table, [field, value], { swapTo: options?.swapToTable ? table : undefined })
					};
				}
			}

			//rest of the fields
			for (const [field, value] of newParams) {
				tempWhere = {
					...tempWhere,
					...parseToQuery(table, [field, value], {
						swapTo: options?.swapToTable ? table : undefined,
						invalidFieldError: `Invalid option: "${field}".`
					})
				};
			}

			if (Object.keys(tempWhere).length) {
				if (options?.features && !options.features.filters) {
					if (!ignoreExtraOptions) {
						throw new AppError("Field filtering is not allowed on this route.");
					}
				} else {
					queryObject.filters = tempWhere;
				}
			} else if (options?.defaults?.filters) {
				queryObject.filters = options.defaults.filters;
			}
		}
	}

	return {
		queryObject,
		getSamples,
		getSampleWhere: options?.extras?.shapes && (getSamples || (shapes && !hasLocationData)),
		hasLocationData,
		trusted,
		blast,
		shapes
	};
}

export function apiObjectToPrisma(
	table: Uncapitalize<ModelName>,
	queryObject: ReturnType<typeof parseApiToObject>["queryObject"],
	options?: {
		swapToTable?: boolean;
		getSampleWhere?: boolean;
	}
) {
	const query = {} as {
		orderBy?: Record<string, Prisma.SortOrder | { _count: Prisma.SortOrder }>;
		where?: Record<string, any>;
		distinct?: string[];
	} & ({ select?: Record<string, any>; include?: never } | { select?: never; include?: Record<string, any> }) &
		({ take?: number; skip?: never } | { take: number; skip: number });

	//orderBy
	if (queryObject.orderBy) {
		if (queryObject.orderBy.type === "field") {
			query.orderBy = {
				[queryObject.orderBy.field]: queryObject.orderBy.sort
			};
		} else if (queryObject.orderBy.type === "relationCount") {
			query.orderBy = {
				[queryObject.orderBy.field]: {
					_count: queryObject.orderBy.sort
				}
			};
		}
	}

	//select fields
	if (queryObject.fields) {
		query.select = queryObject.fields.reduce(
			(acc, f) => {
				acc[f] = true;
				return acc;
			},
			{} as Record<string, true>
		);
	}

	//distinct
	if (queryObject.distinct) {
		query.distinct = queryObject.distinct;
	}

	//relation counts
	if (queryObject.relCounts) {
		const countQuery = {
			_count: {
				select: queryObject.relCounts.reduce(
					(acc, rel) => {
						acc[rel] = true;
						return acc;
					},
					{} as Record<string, boolean>
				)
			}
		};

		if (query.select) {
			query.select = deepMerge(query.select, countQuery);
		} else {
			query.include = deepMerge(query.include ?? {}, countQuery);
		}
	}

	//relations
	if (queryObject.relTables) {
		//assemble path data
		const relPaths = [] as RelationMetadata[][];
		for (const rt of queryObject.relTables) {
			const path = TableMetadata[table].relationPaths[rt]!;

			let add = true;
			for (let i = 0; i < relPaths.length; i++) {
				const currRelPath = relPaths[i]!;

				if (
					currRelPath.length < path.length &&
					currRelPath.every((step, index) => step.field === path[index]!.field && step.table === path[index]!.table)
				) {
					//the new, longer path supersedes the existing one
					relPaths.splice(i, 1);
					i--;
				} else if (
					path.length < currRelPath.length &&
					path.every(
						(step, index) => step.field === currRelPath[index]!.field && step.table === currRelPath[index]!.table
					)
				) {
					//the existing path already contains the new path
					add = false;
					break;
				}
			}

			if (add) {
				relPaths.push([...path]);
			}
		}

		//create query from path data
		function buildRelationPathQuery(path: RelationMetadata[]): Record<string, any> {
			const [rel, ...rest] = path;
			const relTable = uncapitalizeTable(rel!.table);

			const relationFields = queryObject.relFields === true ? true : queryObject.relFields?.[relTable];
			if (relationFields === true && !rest.length) {
				return {
					[rel!.field]: true
				};
			}

			const fields =
				relationFields === true
					? Object.fromEntries(TableMetadata[relTable].enumSchema.options.map((field) => [field, true]))
					: Array.isArray(relationFields)
						? Object.fromEntries(relationFields.map((field) => [field, true]))
						: { id: true };

			return {
				[rel!.field]: {
					select: {
						...fields,
						...(rest.length ? buildRelationPathQuery(rest) : {})
					}
				}
			};
		}

		const relObjs = relPaths.map((rp) => buildRelationPathQuery(rp));

		if (query.select) {
			query.select = deepMerge(query.select, ...relObjs);
		} else {
			query.include = deepMerge(query.include ?? {}, ...relObjs);
		}
	}

	//limit
	if (queryObject.limit) {
		query.take = queryObject.limit;

		if (queryObject.page) {
			query.skip = (queryObject.page - 1) * queryObject.limit;
		}
	}

	//deep relations
	if (queryObject.deepRels) {
		const alreadyDone = [] as Uncapitalize<ModelName>[];
		for (const dr of queryObject.deepRels) {
			const path = TableMetadata[table].relationPaths[dr]!;

			if (!path.some((p) => p.type.endsWith("many"))) {
				alreadyDone.push(dr);

				let include =
					typeof TableMetadata[dr].titleField === "string"
						? { [TableMetadata[dr].titleField]: true }
						: TableMetadata[dr].titleField.reduce((acc, f) => ({ ...acc, [f]: true }), {});

				for (const rel of path.toReversed()) {
					include = {
						[rel.field]: {
							select: include
						}
					};
				}

				if (query.select) {
					query.select = deepMerge(query.select, include);
				} else {
					query.include = deepMerge(query.include ?? {}, include);
				}
			}
		}

		//remove deep relations that are already included in the query
		for (const ad of alreadyDone) {
			queryObject.deepRels.splice(queryObject.deepRels.indexOf(ad), 1);
		}
	}

	//searching
	let sampleWhere;
	if (queryObject.advanced) {
		if (queryObject.advanced.length) {
			query.where = parseAdvancedQuery(table, queryObject.advanced, options?.swapToTable ? table : undefined);
		}

		//assemble secondary query if table doesn't have location data
		if (options?.getSampleWhere) {
			if (queryObject.advanced.length) {
				sampleWhere = parseAdvancedQuery(table, queryObject.advanced, "sample");
			} else {
				sampleWhere = {};
			}
		}
	} else {
		if (queryObject.ids) {
			query.where = {
				id: {
					in: queryObject.ids
				}
			};
		} else if (queryObject.search) {
			query.where = parseSearchQuery(table, queryObject.search);
		} else if (queryObject.filters) {
			query.where = queryObject.filters;
		}

		// assemble secondary query if table doesn't have location data
		if (options?.getSampleWhere) {
			if (query.where && Object.keys(query.where).length) {
				sampleWhere = deepWhere("sample", table, query.where);
			} else {
				sampleWhere = {};
			}
		}
	}

	return { query, sampleWhere };
}
