import TableMetadata, { RelationMetadata } from "@/types/tableMetadata";
import { getZodType } from "./schema";
import { ParamsArray, ParamsArrayField, ParamsArrayRelation, QueryMode } from "@/types/globals";
import { Prisma } from "../generated/prisma/client";
import { QueryModes } from "@/types/objects";

function searchRelations(
	relations: RelationMetadata[],
	target: Lowercase<Prisma.ModelName>,
	paths: RelationMetadata[][],
	visited: Prisma.ModelName[],
	currPath = [] as RelationMetadata[]
) {
	for (const rel of relations) {
		const lowercaseRel = rel.table.toLowerCase() as Lowercase<Prisma.ModelName>;
		const newPath = [...currPath, rel];

		if (lowercaseRel === target) {
			//target found
			//check if newPath is a shorter version of an existing path
			const longerPathIndex = paths.findIndex((p) =>
				newPath.every((newStep) => p.some((step) => step.table === newStep.table))
			);
			if (longerPathIndex === -1) {
				//check if a shorter version of newPath already exists
				if (!paths.some((p) => p.every((step) => newPath.some((newStep) => newStep.table === step.table)))) {
					paths.push(newPath);
				}
			} else {
				paths.splice(longerPathIndex, 1, newPath);
			}
		} else {
			//target not found
			//can't pass through project
			if (lowercaseRel !== "project") {
				if (!visited.includes(rel.table)) {
					//can only go to project from analysis
					if (lowercaseRel === "analysis") {
						const projectMetadata = TableMetadata[lowercaseRel].relations.find((step) => step.table === "Project");
						if (projectMetadata) {
							//recurse
							searchRelations([projectMetadata], target, paths, [...visited, rel.table], newPath);
						}
					} else {
						//recurse
						searchRelations(TableMetadata[lowercaseRel].relations, target, paths, [...visited, rel.table], newPath);
					}
				}
			}
		}
	}
}

function deepWhere(
	start: Lowercase<Prisma.ModelName>,
	target: Lowercase<Prisma.ModelName>,
	query: { [k: string]: any }
) {
	//find all paths to target from start
	const paths = [] as RelationMetadata[][];
	const visited = [(start.slice(0, 1).toUpperCase() + start.slice(1)) as Prisma.ModelName];
	searchRelations(TableMetadata[start].relations, target, paths, visited);

	if (paths.length) {
		//get shortest path
		let bestPath = paths[0];
		if (paths.length > 1) {
			for (let i = 1; i < paths.length; i++) {
				if (paths[i].length < bestPath.length) {
					bestPath = paths[i];
				}
			}
		}

		//assemble query
		let where = { ...query };
		for (const step of bestPath.toReversed()) {
			if (step.type.endsWith("many")) {
				//if relation is a -to-many, add a some to the query
				where = { [step.field]: { some: where } };
			} else {
				where = { [step.field]: where };
			}
		}
		return where;
	} else {
		throw new Error(`No path found from table ${start} to table ${target}.`);
	}
}

export function parseToQuery(
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

function advancedRecurse(
	table: Uncapitalize<Prisma.ModelName>,
	e: ParamsArray[0]
): ReturnType<typeof parseToQuery> | { OR: ReturnType<typeof parseToQuery> } {
	if (typeof e[0] === "string") {
		return parseToQuery(table, e as ParamsArrayField | ParamsArrayRelation);
	} else {
		const paramsE = e as ParamsArray;
		return { OR: paramsE.map((e) => advancedRecurse(table, e)) };
	}
}

export function parseAdvancedQuery(table: Uncapitalize<Prisma.ModelName>, paramsArray: ParamsArray) {
	return { AND: paramsArray.map((e) => advancedRecurse(table, e)) };
}

export function parseSearchQuery(table: Uncapitalize<Prisma.ModelName>, search: string) {
	//search entire table for value
	const ors = [] as { [field: string]: { contains: string; mode: "insensitive" } }[];
	for (const field of TableMetadata[table].enumSchema._def.values) {
		const type = getZodType(TableMetadata[table].schema.shape[field]).type;

		if (type === "string") {
			ors.push({ [field]: { contains: search.replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" } });
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
			fields?: true;
			distinct?: true;
			relations?: true;
			relationsLimit?: true;
			ids?: true;
			limit?: true;
			filters?: true;
			advanced?: true;
			search?: true;
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
	const query = {} as {
		// orderBy?: Record<string, Prisma.SortOrder>;
		select?: Record<string, any>;
		include?: Record<string, any>;
		where?: Record<string, any>;
		take?: number;
		distinct?: string[];
	};

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
				if (!shape[key as keyof typeof shape]) {
					throw new Error(`Invalid field "${key}". Field does not exist on table named "${table}".`);
				}
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
						query.where![key] = { contains: value.replace("_", "\\_").replace("%", "\\%"), mode: "insensitive" };
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

	return query;
}
