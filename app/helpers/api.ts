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

export function parseApiQuery(
	table: Uncapitalize<ModelName>,
	searchParams: URLSearchParams,
	options?: {
		features?: {
			orderBy?: true;
			fields?: true;
			distinct?: true;
			relations?: true;
			relCounts?: true;
			relationsLimit?: true;
			ids?: true;
			limit?: true;
			filters?: true;
			advanced?: true;
			search?: true;
		};
		defaults?: {
			filters?: Record<string, string | number>;
		};
		extras?: {
			deepRelations?: true;
			blast?: true;
			shapes?: true;
		};
		swapToTable?: true;
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
		skip?: number;
		distinct?: any[];
	};

	const trusted = newParams.get("trusted")?.toLowerCase() === "true" ? true : false;
	newParams.delete("trusted");

	const ignoreExtraOptions = newParams.get("ignoreExtraOptions")?.toLowerCase() === "true" ? true : false;
	newParams.delete("ignoreExtraOptions");

	//blast query
	const blast = parseBlastRequest(newParams);
	if (blast && !options?.extras?.blast && !ignoreExtraOptions) {
		throw new Error("The blastQuery option is not allowed on this route.");
	}

	//construct shapes
	const shapes = getShapesFromUrl(newParams);
	newParams.delete("polygon");
	newParams.delete("circle");
	if (shapes && !options?.extras?.shapes) {
		throw new Error("The polygon and circle options are not allowed on this route.");
	}
	const hasLocationData =
		TableMetadata[table].enumSchema.options.includes("decimalLatitude") &&
		TableMetadata[table].enumSchema.options.includes("decimalLongitude");

	//ordering results
	const orderByStr = newParams.get("orderBy");
	newParams.delete("orderBy");
	if (orderByStr != null) {
		if (options?.features && !options.features.orderBy) {
			if (!ignoreExtraOptions) {
				throw new Error("The orderBy option is not allowed on this route.");
			}
		} else {
			const [field, order] = orderByStr.split(",");
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
					throw new Error("The orderBy option must be a field or a -to-many relation.");
				}
			} else {
				throw new Error("The orderBy option must be a field and order separated by a comma.");
			}
		}
	}

	//selecting fields
	const fields = newParams.get("fields");
	newParams.delete("fields");
	if (fields != null) {
		if (options?.features && !options.features.fields) {
			if (!ignoreExtraOptions) {
				throw new Error("The fields option is not allowed on this route.");
			}
		} else {
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
	const distinct = newParams.get("distinct");
	newParams.delete("distinct");
	if (distinct != null) {
		if (options?.features && !options.features.distinct) {
			if (!ignoreExtraOptions) {
				throw new Error("The distinct option is not allowed on this route.");
			}
		} else {
			const split = distinct.split(",");
			query.distinct = query.distinct ? [...query.distinct, ...split] : split;
		}
	}

	//relCounts
	const relCounts = newParams.get("relCounts");
	newParams.delete("relCounts");
	if (relCounts != null) {
		if (options?.features && !options.features.relCounts) {
			if (!ignoreExtraOptions) {
				throw new Error("The relCounts option is not allowed on this route.");
			}
		} else {
			const countQuery = {
				_count: {
					select: relCounts.split(",").reduce(
						(acc: Record<string, boolean>, rel: string) => ({
							...acc,
							[TableMetadata[table].relations.find((mr) => mr.table === capitalizeTable(getDataTableName(rel)))!.field]:
								true
						}),
						{}
					)
				}
			};

			if (query.select) {
				query.select = deepMerge(query.select, countQuery);
			} else {
				query.include = deepMerge(query.include ?? {}, countQuery);
			}
		}
	}

	//relations
	const relations = newParams.get("relations");
	newParams.delete("relations");
	const relationsLimit = newParams.get("relationsLimit");
	newParams.delete("relationsLimit");
	const relationsAllFields = newParams.get("relationsAllFields");
	newParams.delete("relationsAllFields");

	if (relations != null) {
		if (options?.features && !options.features.relations) {
			if (!ignoreExtraOptions) {
				throw new Error("The relations option is not allowed on this route.");
			}
		} else {
			const relTables = new Set() as Set<Uncapitalize<ModelName>>;
			for (const r of relations.split(",")) {
				const relTableArr = getTableName(r.trim().toLowerCase());
				if (!relTableArr) {
					throw new Error(`Relation with name "${r}" does not exist in database.`);
				}
				relTables.add(relTableArr);
			}

			//relations limit
			let take;

			if (relationsLimit != null) {
				if (options?.features && !options.features.relationsLimit) {
					if (!ignoreExtraOptions) {
						throw new Error("The relationsLimit option is not allowed on this route.");
					}
				} else {
					take = parseInt(relationsLimit);
					if (Number.isNaN(take) || take < 1) {
						throw new Error(
							`Invalid relationsLimit: "${relationsLimit}". The relationsLimit option must be a positive integer.`
						);
					}
				}
			}

			//include all fields in relations
			let allFields = undefined as undefined | boolean | Set<Uncapitalize<ModelName>>;

			if (relationsAllFields != null) {
				if (!relationsAllFields || relationsAllFields.toLowerCase() === "false") {
					allFields = false;
				} else if (relationsAllFields.toLowerCase() === "true") {
					allFields = true;
				} else {
					allFields = new Set() as Set<Uncapitalize<ModelName>>;
					for (const r of relationsAllFields.split(",")) {
						const trimmed = r.trim().toLowerCase();
						const allFieldsArr = Object.entries(TableMetadata).find(
							([t, metadata]) => trimmed === t.toLowerCase() || trimmed === metadata.plural.toLowerCase()
						);
						if (!allFieldsArr) {
							throw new Error(
								`Invalid relationsAllFields: "${relationsAllFields}". The relationsAllFields option must be "true", "false", or a relation provided in the "relations" field. Value was "${r}".`
							);
						}
						allFields.add(allFieldsArr[0] as Uncapitalize<ModelName>);
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
				query.include = deepMerge(query.include ?? {}, ...relObjs);
			}
		}
	} else {
		if (relationsLimit != null) {
			throw new Error("The relationsLimit option requires the relations option.");
		}

		if (relationsAllFields != null) {
			throw new Error("The relationsAllFields option requires the relations option.");
		}
	}

	//limit
	const tempLimit = newParams.get("limit");
	newParams.delete("limit");
	let parsedLimit: number | undefined;
	const page = newParams.get("page");
	newParams.delete("page");
	let parsedPage: number | undefined;
	if (tempLimit != null) {
		if (options?.features && !options.features.limit) {
			if (!ignoreExtraOptions) {
				throw new Error("The limit option is not allowed on this route.");
			}
		} else {
			parsedLimit = Number(tempLimit);
			if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
				throw new Error(`Invalid limit: "${tempLimit}". The limit option must be a positive integer.`);
			}

			if (page != null) {
				parsedPage = Number(page);
				if (!Number.isInteger(parsedPage) || parsedPage < 1) {
					throw new Error(`Invalid page: "${page}". The page option must be a positive integer.`);
				}
			}
		}
	} else if (page != null && !ignoreExtraOptions) {
		throw new Error("The page option requires the limit option.");
	}

	//get deep relation data
	let deepRelsArray = undefined as Uncapitalize<ModelName>[] | undefined;
	const deepRelations = newParams.get("deepRelations");
	newParams.delete("deepRelations");
	if (deepRelations != null) {
		if (!options?.extras?.deepRelations) {
			if (!ignoreExtraOptions) {
				throw new Error("The deepRelations option is not allowed on this route.");
			}
		} else {
			if (deepRelations.toLowerCase() !== "false") {
				//get relation tables
				if (deepRelations.toLowerCase() === "true") {
					//all relations
					deepRelsArray = DataTableNames.filter(
						(name) =>
							name !== table &&
							TableMetadata[table].relations.every(
								(rel) => uncapitalizeTable(rel.table) !== name && TableMetadata[table].relationPaths[name]
							)
					);
				} else {
					//comma separated list of relations
					deepRelsArray = deepRelations.split(",").map((rel) => {
						const name = getDataTableName(rel, `Deep relation named "${rel}" does not exist.`);

						return name;
					});
				}

				const alreadyDone = [] as typeof deepRelsArray;
				for (const dr of deepRelsArray) {
					const path = TableMetadata[table].relationPaths[dr];

					if (!path) {
						throw new Error(`No path exists from "${table}" to "${dr}".`);
					}

					if (!path.some((p) => p.type.endsWith("many"))) {
						alreadyDone.push(dr);

						let include =
							typeof TableMetadata[dr].titleField === "string"
								? { [TableMetadata[dr].titleField]: true }
								: TableMetadata[dr].titleField.reduce((acc, f) => ({ ...acc, [f]: true }), {});

						for (const rel of path.toReversed()) {
							include = { [rel.field]: { select: include } };
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
					deepRelsArray.splice(deepRelsArray.indexOf(ad), 1);
				}
			}
		}
	}

	const getSamples = newParams.get("getSamples")?.toLowerCase() === "true";
	newParams.delete("getSamples");
	if (getSamples && !options?.extras?.shapes && !ignoreExtraOptions) {
		throw new Error("The getSamples option is not allowed on this route.");
	}

	//searching
	let sampleWhere;
	const getSampleWhere = options?.extras?.shapes && (getSamples || (shapes && !hasLocationData));
	const advanced = newParams.get("advanced");
	newParams.delete("advanced");
	if (advanced != null) {
		//advanced search
		if (options?.features && !options.features.advanced) {
			if (!ignoreExtraOptions) {
				throw new Error("The advanced option is not allowed on this route.");
			}
		} else {
			if (Array.from(newParams).length) {
				throw new Error("Advanced search may not include other filter parameters.");
			}

			const parsed = JSON.parse(advanced) as ParamsArray;
			if (parsed.length) {
				query.where = parseAdvancedQuery(table, parsed, options?.swapToTable ? table : undefined);
			}

			//assemble secondary query if table doesn't have location data
			if (getSampleWhere) {
				if (parsed.length) {
					sampleWhere = parseAdvancedQuery(table, parsed, "sample");
				} else {
					sampleWhere = {};
				}
			}
		}
	} else {
		const ids = newParams.get("ids");
		newParams.delete("ids");
		const search = newParams.get("search");
		newParams.delete("search");

		if (ids != null) {
			//list of ids
			if (options?.features && !options.features.ids) {
				if (!ignoreExtraOptions) {
					throw new Error("The ids option is not allowed on this route.");
				}
			} else {
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
			}
		} else if (search != null) {
			//string search
			if (options?.features && !options.features.search) {
				if (!ignoreExtraOptions) {
					throw new Error("The search option is not allowed on this route.");
				}
			} else {
				if (Array.from(newParams).length) {
					throw new Error("Search may not include other filter parameters.");
				}

				query.where = parseSearchQuery(table, search);
			}
		} else {
			//filtering
			let tempWhere = {} as Record<string, any>;

			//where
			const where = newParams.get("where");
			newParams.delete("where");
			if (where != null) {
				for (const [field, value] of Object.entries(parseNestedJson(where) as Record<string, string>)) {
					tempWhere = {
						...tempWhere,
						...parseToQuery(table, [field, value], options?.swapToTable ? table : undefined)
					};
				}
			}

			//rest of the fields
			for (const [field, value] of newParams) {
				tempWhere = { ...tempWhere, ...parseToQuery(table, [field, value], options?.swapToTable ? table : undefined) };
			}

			if (Object.keys(tempWhere).length) {
				if (options?.features && !options.features.filters) {
					if (!ignoreExtraOptions) {
						throw new Error("Field filtering is not allowed on this route.");
					}
				} else {
					query.where = tempWhere;
				}
			} else if (options?.defaults?.filters) {
				query.where = options.defaults.filters;
			}
		}

		//assemble secondary query if table doesn't have location data
		if (getSampleWhere) {
			if (query.where && Object.keys(query.where).length) {
				sampleWhere = deepWhere("sample", table, query.where);
			} else {
				sampleWhere = {};
			}
		}
	}

	return {
		trusted,
		query,
		blast,
		shapes,
		sampleWhere,
		getSamples,
		hasLocationData,
		limit: parsedLimit,
		page: parsedPage,
		deepRelsArray
	};
}
