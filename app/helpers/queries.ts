import TableMetadata, { RelationMetadata, TableNames } from "@/types/tableMetadata";
import { getZodType } from "./schema";
import { ParamsArray, ParamsArrayField, ParamsArrayRelation, ParamsArrayValue, QueryMode } from "@/types/globals";
import { Prisma } from "../generated/prisma/client";
import { capitalizeTable, getShapesFromUrl, uncapitalizeTable } from "./utils";
import { decompressFromEncodedURIComponent } from "lz-string";
import { DeadValueEnum, DeadValueNumbers, DeadValues } from "@/types/enums";

function searchRelations(
	relations: RelationMetadata[],
	target: Uncapitalize<Prisma.ModelName>,
	paths: RelationMetadata[][],
	visited: Prisma.ModelName[],
	currPath = [] as RelationMetadata[],
	deadEnds = new Set() as Set<Prisma.ModelName>
) {
	//check if target is in relations
	const targetRel = relations.find((rel) => uncapitalizeTable(rel.table) === target);
	if (targetRel) {
		//target found
		paths.push([...currPath, targetRel]);
		return true;
	}

	//flag to detect if path leads to target
	let found = false;

	//check if current path is already invalidated
	if (currPath.every((rel) => !deadEnds.has(rel.table))) {
		for (const rel of relations) {
			//can't pass through project
			if (rel.table !== "Project") {
				//don't check relation if we've already been there in this path or it is a known dead end
				const newRelations = TableMetadata[rel.table].relations.filter(
					(r) => !visited.includes(r.table) && !deadEnds.has(r.table)
				);

				if (newRelations.length) {
					//can only go to project from analysis, unless coming from project
					if (rel.table === "Analysis") {
						if (visited.includes("Project")) {
							//recurse, ignoring project relation
							const res = searchRelations(
								newRelations.filter((r) => r.table !== "Project"),
								target,
								paths,
								[...visited, rel.table],
								[...currPath, rel],
								deadEnds
							);
							if (res) {
								found = true;
							}
						} else {
							const projectMetadata = newRelations.find((r) => r.table === "Project");
							if (projectMetadata) {
								//recurse
								const res = searchRelations(
									[projectMetadata],
									target,
									paths,
									[...visited, rel.table],
									[...currPath, rel],
									deadEnds
								);
								if (res) {
									found = true;
								}
							}
						}
					} else {
						//recurse
						const res = searchRelations(
							newRelations,
							target,
							paths,
							[...visited, rel.table],
							[...currPath, rel],
							deadEnds
						);
						if (res) {
							found = true;
						}
					}
				} else {
					//no new relations
					deadEnds.add(rel.table);
				}
			}
		}

		if (!found) {
			//end of recursion for this path, target not found
			deadEnds.add(currPath[currPath.length - 1].table);
		}
	}

	return found;
}

function deepWhere(
	start: Uncapitalize<Prisma.ModelName>,
	target: Uncapitalize<Prisma.ModelName>,
	query: { [k: string]: any }
) {
	//find all paths to target from start
	const paths = [] as RelationMetadata[][];
	const visited = [capitalizeTable(start)];
	searchRelations(TableMetadata[start].relations, target, paths, visited);

	if (paths.length) {
		const shortestPath = paths.sort((a, b) => a.length - b.length)[0];

		//assemble query
		let where = { ...query };
		for (const rel of shortestPath.toReversed()) {
			if (rel.type.endsWith("many")) {
				//if relation is a -to-many, add a some to the query
				where = { [rel.field]: { some: where } };
			} else {
				where = { [rel.field]: where };
			}
		}
		return where;
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
	"deadValue"
];
export function parseToQuery(
	table: Uncapitalize<Prisma.ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation
) {
	let relation = "";
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
		//search field for value with mode
		field = queryArr[0];
		mode = queryArr[1] as QueryMode;
		value = queryArr[2];
	} else if (queryArr.length === 4) {
		//search related table's field for value
		relation = queryArr[0];
		field = queryArr[1];
		mode = queryArr[2];
		value = queryArr[3];
	}

	if (mode) {
		if (!queryModes.includes(mode)) {
			throw new Error(`Query mode "${mode}" not supported.`);
		}

		if ((mode === "null" || mode === "notNull") && queryArr.length !== 2) {
			throw new Error('Modes "null" and "notNull" do not support values.');
		}
	}

	const model = TableNames.find(
		(model) => model.toLowerCase() === (relation || table).toLowerCase()
	) as Prisma.ModelName;
	if (!model) {
		throw new Error(`Provided table "${relation || table}" is not a valid model name.`);
	}

	if (TableMetadata[model].relations.some((rel) => rel.field === field) && typeof value === "object") {
		return { [field]: value };
	}

	const zodType = getZodType(TableMetadata[model].schema.shape[field]);

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
			const relModel = TableNames.find((model) => model.toLowerCase() === relation.toLowerCase()) as Prisma.ModelName;
			if (!relModel) {
				throw new Error(`Provided table "${relation}" is not a valid model name.`);
			}
			return deepWhere(table, uncapitalizeTable(relModel), searchWhere);
		} else {
			return searchWhere;
		}
	} else {
		return {};
	}
}

function advancedRecurse(
	table: Uncapitalize<Prisma.ModelName>,
	e: ParamsArray[0]
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
		return parseToQuery(table, e as ParamsArrayField | ParamsArrayRelation);
	}

	// Legacy nested array syntax: an inner ParamsArray represents an implicit OR group
	const paramsE = e as ParamsArray;
	return { OR: paramsE.map((child) => advancedRecurse(table, child)) };
}

export function parseAdvancedQuery(table: Uncapitalize<Prisma.ModelName>, paramsArray: ParamsArray) {
	return { AND: paramsArray.map((e) => advancedRecurse(table, e)) };
}

export function parseSearchQuery(table: Uncapitalize<Prisma.ModelName>, search: string) {
	//search entire table for value
	const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
	for (const field of TableMetadata[table].enumSchema.options) {
		const type = getZodType(TableMetadata[table].schema.shape[field]).type;

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
	}
) {
	//construct shapes
	let shapes;
	if (!options?.features || options.features.shapes) {
		const tempShapes = getShapesFromUrl(searchParams);

		if (tempShapes) {
			if (
				!TableMetadata[table].enumSchema.options.includes("decimalLatitude") ||
				!TableMetadata[table].enumSchema.options.includes("decimalLongitude")
			) {
				throw new Error(`${TableMetadata[table].plural} do not have decimalLatitude or decimalLongitude fields.`);
			}

			shapes = tempShapes;

			searchParams.delete("polygon");
			searchParams.delete("circle");
		}
	}

	const query = {} as {
		orderBy?: Record<string, Prisma.SortOrder>;
		select?: Record<string, any>;
		include?: Record<string, any>;
		where?: Record<string, any>;
		take?: number;
		distinct?: string[];
	};

	//ordering results
	if (!options?.features || options.features.orderBy) {
		const orderByStr = searchParams.get("orderBy");
		if (orderByStr) {
			const split = orderByStr?.split(",");
			if (
				split.length !== 2 ||
				!TableMetadata[table].enumSchema.options.includes(split[0]) ||
				(split[1] !== "asc" && split[1] !== "desc")
			) {
				throw new Error("The orderBy must be a field and order separated by a comma.");
			}

			query.orderBy = {
				[split[0]]: split[1]
			};
		}
	}

	//selecting fields
	if (options?.defaults?.fields) {
		query.select = options.defaults.fields;
	}

	if (!options?.features || options.features.fields) {
		const fields = searchParams.get("fields");
		if (fields) {
			searchParams.delete("fields");
			const split = fields.split(",").reduce((acc, f) => ({ ...acc, [f]: true }), {});
			query.select = query.select ? { ...query.select, ...split } : split;
		}
	}

	//distinct
	if (options?.defaults?.distinct) {
		query.distinct = options.defaults.distinct;
	}

	if (!options?.features || options.features.distinct) {
		const distinct = searchParams.get("distinct");
		if (distinct) {
			searchParams.delete("distinct");
			const split = distinct.split(",");
			query.distinct = query.distinct ? [...query.distinct, ...split] : split;
		}
	}

	//relations
	if (!options?.features || options.features.relations) {
		const relations = searchParams.get("relations");
		if (relations) {
			searchParams.delete("relations");

			let relationVal = true as
				| true
				| { take: number }
				| {
						take?: number;
						select: { id: true };
				  };

			//relations limit
			//TODO: (bug) breaks when relations isn't an array
			if (!options?.features || options.features.relationsLimit) {
				const relationsLimit = searchParams.get("relationsLimit");
				if (relationsLimit) {
					searchParams.delete("relationsLimit");
					const take = parseInt(relationsLimit);
					if (Number.isNaN(take)) {
						throw new Error(`Invalid relations limit: "${relationsLimit}". Limit must be an integer.`);
					} else if (take < 1) {
						throw new Error(`Invalid relations limit: "${relationsLimit}". Limit must be a positive integer.`);
					}

					relationVal = { take };
				}
			}

			//include all fields in relations
			const allFields = searchParams.get("relationsAllFields");
			searchParams.delete("relationsAllFields");
			if (!allFields || allFields.toLowerCase() === "false") {
				if (typeof relationVal === "boolean") {
					relationVal = { select: { id: true } };
				} else {
					relationVal = { take: relationVal.take, select: { id: true } };
				}
			} else if (allFields.toLowerCase() !== "true") {
				throw new Error(`Invalid value for relationsAllFields: "${allFields}". Value must be "true" or "false".`);
			}

			const relsObj = relations
				.split(",")
				.reduce((acc, incl) => ({ ...acc, [incl[0].toUpperCase() + incl.slice(1)]: relationVal }), {});
			if (query.select) {
				query.select = { ...query.select, ...relsObj };
			} else {
				query.include = relsObj;
			}
		}
	}

	const ids = searchParams.get("ids");
	const advanced = searchParams.get("advanced");
	const search = searchParams.get("search");
	if ((!options?.features || options.features.ids) && ids) {
		//list of ids
		searchParams.delete("ids");

		if (Array.from(searchParams).length) {
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
	} else if ((!options?.features || options.features.advanced) && advanced) {
		//advanced search
		searchParams.delete("advanced");

		if (Array.from(searchParams).length) {
			throw new Error("Advanced search may not include other filter parameters.");
		}

		const parsed = JSON.parse(advanced) as ParamsArray;
		query.where = { ...query.where, ...parseAdvancedQuery(table, parsed) };
	} else if ((!options?.features || options.features.search) && search) {
		//string search
		searchParams.delete("search");

		if (Array.from(searchParams).length) {
			throw new Error("Search may not include other filter parameters.");
		}

		query.where = { ...query.where, ...parseSearchQuery(table, search) };
	} else {
		//limit
		if (!options?.features || options.features.limit) {
			const take = searchParams.get("limit");
			if (take) {
				searchParams.delete("limit");
				query.take = parseInt(take);
				if (Number.isNaN(query.take)) {
					throw new Error(`Invalid limit: "${take}". Limit must be an integer.`);
				} else if (query.take < 1) {
					throw new Error(`Invalid limit: "${take}". Limit must be a positive integer.`);
				}
			}
		}

		//filtering
		if (options?.defaults?.filters) {
			query.where = options.defaults.filters;
		}

		if (!options?.features || options.features.filters) {
			query.where = query.where || ({} as Record<string, any>);

			const shape = TableMetadata[table].schema.shape;
			searchParams.forEach((value, key) => {
				if (shape[key as keyof typeof shape]) {
					const type = getZodType(shape[key as keyof typeof shape]).type;
					if (!type) {
						throw new Error(
							`Could not find type of "${key}". Make sure a field named "${key}" exists on table named "${table}".`
						);
					}

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
				}
			});
		}
	}

	return { query, shapes };
}
