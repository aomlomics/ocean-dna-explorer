import TableMetadata, { RelationMetadata } from "@/types/tableMetadata";
import { getZodType } from "./schema";
import {
	MapShape,
	ParamsArray,
	ParamsArrayField,
	ParamsArrayRelation,
	ParamsArrayValue,
	QueryMode
} from "@/types/globals";
import { Prisma } from "../generated/prisma/client";
import { uncapitalizeTable } from "./utils";

function searchRelations(
	relations: RelationMetadata[],
	target: Uncapitalize<Prisma.ModelName>,
	paths: RelationMetadata[][],
	visited: Prisma.ModelName[],
	currPath = [] as RelationMetadata[]
) {
	for (const rel of relations) {
		const uncapsRel = uncapitalizeTable(rel.table);
		const newPath = [...currPath, rel];

		if (uncapsRel === target) {
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
			if (uncapsRel !== "project") {
				if (!visited.includes(rel.table)) {
					//can only go to project from analysis
					if (uncapsRel === "analysis") {
						const projectMetadata = TableMetadata[uncapsRel].relations.find((step) => step.table === "Project");
						if (projectMetadata) {
							//recurse
							searchRelations([projectMetadata], target, paths, [...visited, rel.table], newPath);
						}
					} else {
						//recurse
						searchRelations(TableMetadata[uncapsRel].relations, target, paths, [...visited, rel.table], newPath);
					}
				}
			}
		}
	}
}

function deepWhere(
	start: Uncapitalize<Prisma.ModelName>,
	target: Uncapitalize<Prisma.ModelName>,
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

const queryModes = ["equals", "contains", "startsWith", "endsWith", "lt", "lte", "gt", "gte", "range", "in", "notIn"];
export function parseToQuery(
	table: Uncapitalize<Prisma.ModelName>,
	queryArr: [string, string] | ParamsArrayField | ParamsArrayRelation
) {
	let relation = "";
	let field = "";
	let mode = "" as QueryMode;
	let value = "" as ParamsArrayValue;
	if (queryArr.length === 2) {
		//search field for value
		field = queryArr[0];
		value = queryArr[1] as string;
	} else if (queryArr.length === 3) {
		//search field for value with mode
		field = queryArr[0];
		mode = queryArr[1];
		value = queryArr[2];
	} else if (queryArr.length === 4) {
		//search related table's field for value
		relation = queryArr[0];
		field = queryArr[1];
		mode = queryArr[2];
		value = queryArr[3];
	}

	if (mode && !queryModes.includes(mode)) {
		throw new Error(`Query mode "${mode}" not supported.`);
	}

	const model = Object.keys(Prisma.ModelName).find(
		(model) => model.toLowerCase() === (relation || table).toLowerCase()
	) as Prisma.ModelName;
	if (!model) {
		throw new Error(`Provided table "${relation || table}" is not a valid model name.`);
	}

	if (TableMetadata[model].relations.some((rel) => rel.field === field) && typeof value === "object") {
		return { [field]: value };
	}

	const type = getZodType(TableMetadata[model].schema.shape[field]).type;

	let searchWhere;
	if (type === "string") {
		if (mode) {
			if (mode === "in" || mode === "notIn") {
				//TODO: needs testing
				const typedVal = value as string[];
				searchWhere = {
					[field]: {
						[mode]: typedVal
					}
				};
			} else {
				const typedVal = value as string;
				searchWhere = {
					[field]: {
						[mode]: typedVal.replace("_", "\\_").replace("%", "\\%"),
						mode: "insensitive"
					}
				};
			}
		} else {
			const typedVal = value as string;
			searchWhere = {
				[field]: {
					contains: typedVal.replace("_", "\\_").replace("%", "\\%"),
					mode: "insensitive"
				}
			};
		}
	} else if (type === "integer" || type === "float") {
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
		} else if (mode === "in" || mode === "notIn") {
			//TODO: needs testing
			const typedVal = value as number[];
			searchWhere = {
				[field]: {
					[mode]: typedVal
				}
			};
		} else {
			const typedVal = value as number;

			if (!mode || mode === "equals") {
				searchWhere = { [field]: typedVal };
			} else {
				searchWhere = { [field]: { [mode]: typedVal } };
			}
		}
	} else if (type === "date") {
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
		} else if (mode === "in" || mode === "notIn") {
			//TODO: needs testing
			const typedVal = value as string[];
			searchWhere = {
				[field]: {
					[mode]: typedVal
				}
			};
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
	} else if (type === "string[]") {
		//TODO: add string arrays back to schema once Prisma supports contains on arrays
	}

	if (searchWhere) {
		if (relation) {
			const relModel = Object.keys(Prisma.ModelName).find(
				(model) => model.toLowerCase() === relation.toLowerCase()
			) as Prisma.ModelName;
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
	//TODO: needs testing
	//construct shapes
	let shapes;
	if (!options?.features || options.features.shapes) {
		const polygons = searchParams.getAll("polygon");
		const circles = searchParams.getAll("circle");
		// Only process shapes if at least one polygon or circle was provided
		if (polygons.length > 0 || circles.length > 0) {
			if (
				!TableMetadata[table].enumSchema.options.includes("decimalLatitude") ||
				!TableMetadata[table].enumSchema.options.includes("decimalLongitude")
			) {
				throw new Error(`${TableMetadata[table].plural} do not have decimalLatitude or decimalLongitude fields.`);
			}

			shapes = [] as Array<MapShape>;
			searchParams.delete("polygon");
			searchParams.delete("circle");

			for (const poly of polygons) {
				//format: <lat>/<lng>,<lat>/<lng>,etc
				const points = poly.split(",").map((p) => {
					const split = p.split("/");
					if (split.length !== 2) {
						throw new Error(`Invalid LatLng format: "${p}". Format must be <lat>/<lng>.`);
					}
					const pnt = {
						lat: parseFloat(split[0]),
						lng: parseFloat(split[1])
					};
					if (isNaN(pnt.lat) || Math.abs(pnt.lat) > 90) {
						throw new Error(`Invalid format for Lat: "${pnt.lat}". Lat must be a number between -90 and 90.`);
					}
					if (isNaN(pnt.lng) || Math.abs(pnt.lat) > 180) {
						throw new Error(`Invalid format for Lng: "${pnt.lng}". Lng must be a number between -180 and 180.`);
					}

					return pnt;
				});

				const bounds = { sw: { lat: -90, lng: -180 }, ne: { lat: 90, lng: 180 } };
				for (const p of points) {
					bounds.sw.lat = Math.max(p.lat, bounds.sw.lat);
					bounds.sw.lng = Math.max(p.lng, bounds.sw.lng);
					bounds.ne.lat = Math.min(p.lat, bounds.ne.lat);
					bounds.ne.lng = Math.min(p.lng, bounds.ne.lng);
				}

				shapes.push({
					type: "polygon",
					bounds,
					points
				});
			}

			for (const cir of circles) {
				//format: <lat>/<lng>,<radius>
				const split = cir.split(",");
				if (split.length !== 2) {
					throw new Error(
						`Invalid circle format: "${cir}". Circle must have a center followed by a radius, separated by a comma.`
					);
				}

				const centerSplit = split[0].split("/");
				if (split.length !== 2) {
					throw new Error(`Invalid center format: "${split[0]}". Format must be <lat>/<lng>.`);
				}
				const center = {
					lat: parseFloat(centerSplit[0]),
					lng: parseFloat(centerSplit[1])
				};
				if (isNaN(center.lat) || Math.abs(center.lat) > 90) {
					throw new Error(`Invalid format for Lat: "${center.lat}". Lat must be a number between -90 and 90.`);
				}
				if (isNaN(center.lng) || Math.abs(center.lat) > 180) {
					throw new Error(`Invalid format for Lng: "${center.lng}". Lng must be a number between -180 and 180.`);
				}

				const radius = parseFloat(split[1]);
				if (isNaN(radius)) {
					throw new Error(`Invalid format for radius: "${split[1]}". Radius must be a number.`);
				}

				shapes.push({
					type: "circle",
					radius,
					center
				});
			}
		}
	}

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
