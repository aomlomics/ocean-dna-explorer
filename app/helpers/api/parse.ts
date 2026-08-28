import type { ParamsArray } from "@/types/globals";
import type { Prisma } from "@/app/generated/prisma/browser";
import { getDataTableName, getTableName, getZodType } from "../schema";
import TableMetadata, { DataTableNames, type ModelName, RelationMetadata } from "@/types/tableMetadata";
import { capitalizeTable, deepMerge, getShapesFromUrl, parseNestedJson, uncapitalizeTable } from "../utils";
import { parseBlastRequest } from "../blast";
import { deepWhere, parseAdvancedQuery, parseSearchQuery, parseToQuery } from "./api";

export function parseApiQuery(
	table: Uncapitalize<ModelName>,
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
	const blast = parseBlastRequest(newParams);
	if (blast && options?.features && !options.features.blast) {
		throw new Error("The blastQuery option is not allowed on this route.");
	}

	//construct shapes
	const shapes = getShapesFromUrl(newParams);
	newParams.delete("polygon");
	newParams.delete("circle");
	if (shapes && options?.features && !options.features.shapes) {
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
			throw new Error("The orderBy option is not allowed on this route.");
		}

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

	//selecting fields
	const fields = newParams.get("fields");
	newParams.delete("fields");
	if (fields != null) {
		if (options?.features && !options.features.fields) {
			throw new Error("The fields option is not allowed on this route.");
		}

		const split = fields.split(",").reduce(
			(acc, f) => {
				getZodType(table, f);
				acc[f] = true;
				return acc;
			},
			{} as Record<string, true>
		);
		query.select = query.select ? { ...query.select, ...split } : split;
	} else {
		query.select = options?.defaults?.fields;
	}

	//distinct
	const distinct = newParams.get("distinct");
	newParams.delete("distinct");
	if (distinct != null) {
		if (options?.features && !options.features.distinct) {
			throw new Error("The distinct option is not allowed on this route.");
		}

		const split = distinct.split(",");
		query.distinct = query.distinct ? [...query.distinct, ...split] : split;
	} else {
		query.distinct = options?.defaults?.distinct;
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
			throw new Error("The relations option is not allowed on this route.");
		}

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
				throw new Error("The relationsLimit option is not allowed on this route.");
			}

			take = parseInt(relationsLimit);
			if (Number.isNaN(take) || take < 1) {
				throw new Error(
					`Invalid relationsLimit: "${relationsLimit}". The relationsLimit option must be a positive integer.`
				);
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
			query.include = deepMerge({}, ...relObjs);
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
	const take = newParams.get("limit");
	newParams.delete("limit");
	if (take != null) {
		if (options?.features && !options.features.limit) {
			throw new Error("The limit option is not allowed on this route.");
		}

		query.take = parseInt(take);
		if (Number.isNaN(query.take) || query.take < 1) {
			throw new Error(`Invalid limit: "${take}". The limit option must be a positive integer.`);
		}
	}

	let sampleWhere;
	const getSampleWhere = (!options || options.sampleWhere) && shapes && !hasLocationData;
	const advanced = newParams.get("advanced");
	newParams.delete("advanced");
	if (advanced != null) {
		//advanced search
		if (options?.features && !options.features.advanced) {
			throw new Error("The advanced option is not allowed on this route.");
		}

		if (Array.from(newParams).length) {
			throw new Error("Advanced search may not include other filter parameters.");
		}

		const parsed = JSON.parse(advanced) as ParamsArray;
		if (parsed.length) {
			query.where = parseAdvancedQuery(table, parsed, options && options.swapToTable ? table : undefined);
		}

		//assemble secondary query if table doesn't have location data
		if (getSampleWhere) {
			if (parsed.length) {
				sampleWhere = parseAdvancedQuery(table, parsed, "sample");
			} else {
				sampleWhere = {};
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
				throw new Error("The ids option is not allowed on this route.");
			}

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
		} else if (search != null) {
			//string search
			if (options?.features && !options.features.search) {
				throw new Error("The search option is not allowed on this route.");
			}

			if (Array.from(newParams).length) {
				throw new Error("Search may not include other filter parameters.");
			}

			query.where = parseSearchQuery(table, search);
		} else {
			//filtering
			query.where = {} as Record<string, any>;
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

			if (Object.keys(query.where).length) {
				if (options?.features && !options.features.filters) {
					throw new Error("Field filtering is not allowed on this route.");
				}
			} else {
				query.where = options?.defaults?.filters;
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

	return { trusted, query, blast, shapes, sampleWhere };
}

//TODO: reuse parseApiQuery when possible
export function parsePaginationQuery(
	table: Uncapitalize<ModelName>,
	searchParams: URLSearchParams,
	options?: {
		features?: {
			orderBy?: true;
			relations?: true;
			relCounts?: true;
			deepRelations?: true;
			filters?: true;
			advanced?: true;
			search?: true;
			shapes?: true;
			blast?: true;
			getSamples?: true;
		};
		sampleWhere?: true;
		ignoreExtraFeatures?: true;
		skipPages?: true;
	}
) {
	const query = {} as {
		orderBy?: { [field: string]: Prisma.SortOrder | { _count: Prisma.SortOrder } };
		where?: Record<string, any>;
		take?: number;
		skip?: number;
		include?: {
			_count?: { select: Record<string, boolean> };
			[key: string]: any;
		};
	};

	const trusted = searchParams.get("trusted")?.toLowerCase() === "true" ? true : false;

	//blast query
	const blast = parseBlastRequest(searchParams, { noDelete: true });
	if (blast && options?.features && !options.features.blast && !options.ignoreExtraFeatures) {
		throw new Error("The blastQuery option is not allowed on this route.");
	}

	//construct shapes
	const shapes = getShapesFromUrl(searchParams);
	if (shapes && options?.features && !options.features.shapes && !options.ignoreExtraFeatures) {
		throw new Error("The polygon and circle options are not allowed on this route.");
	}
	const hasLocationData =
		TableMetadata[table].enumSchema.options.includes("decimalLatitude") &&
		TableMetadata[table].enumSchema.options.includes("decimalLongitude");

	const getSamples = searchParams.get("getSamples")?.toLowerCase() === "true";
	if (getSamples && options?.features && !options.features.getSamples && !options.ignoreExtraFeatures) {
		throw new Error("The getSamples option is not allowed on this route.");
	}

	let sampleWhere;
	const getSampleWhere = (!options || options.sampleWhere) && (getSamples || (shapes && !hasLocationData));
	const whereStr = searchParams.get("where");
	if (whereStr != null) {
		const parsed = parseNestedJson(whereStr) as { advanced?: any; search?: any; [key: string]: string };

		if (parsed.advanced) {
			if (options?.features && !options.features.advanced && !options.ignoreExtraFeatures) {
				throw new Error("The advanced option is not allowed on this route.");
			}

			const advanced = parsed.advanced as ParamsArray;
			delete parsed.advanced;
			if (Object.keys(parsed).length) {
				throw new Error("Advanced search may not include other filter parameters.");
			}

			query.where = parseAdvancedQuery(table, advanced);

			//assemble secondary query if table doesn't have location data
			if (getSampleWhere) {
				sampleWhere = parseAdvancedQuery(table, advanced, "sample");
			}
		} else {
			if (parsed.search) {
				if (options?.features && !options.features.search && !options.ignoreExtraFeatures) {
					throw new Error("The search option is not allowed on this route.");
				}

				const search = parsed.search;
				delete parsed.search;

				if (Object.keys(parsed).length) {
					throw new Error("Search may not include other filter parameters.");
				}

				query.where = parseSearchQuery(table, search);
			} else {
				query.where = {};
				for (const filter of Object.entries(parsed as Record<string, string>)) {
					query.where = { ...query.where, ...parseToQuery(table, filter) };
				}

				if (
					Object.keys(query.where).length &&
					options?.features &&
					!options.features.filters &&
					!options.ignoreExtraFeatures
				) {
					throw new Error("Field filtering is not allowed on this route.");
				}
			}

			//assemble secondary query if table doesn't have location data
			if (getSampleWhere) {
				sampleWhere = deepWhere("sample", table, query.where);
			}
		}
	} else if (getSampleWhere) {
		//still get samples
		sampleWhere = {};
	}

	const orderByStr = searchParams.get("orderBy");
	if (orderByStr != null) {
		if (options?.features && !options.features.orderBy && !options.ignoreExtraFeatures) {
			throw new Error("The orderBy option is not allowed on this route.");
		}

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
				//TODO: handle -to-one relations
				throw new Error("The orderBy must be a field or a -to-many relation.");
			}
		} else {
			throw new Error("The orderBy must be a field and order separated by a comma.");
		}
	}

	const relCounts = searchParams.get("relCounts");
	if (relCounts != null) {
		if (options?.features && !options.features.relCounts && !options.ignoreExtraFeatures) {
			throw new Error("The relCounts option is not allowed on this route.");
		}

		query.include = {
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
	}

	const relations = searchParams.get("relations");
	const relationsAllFields = searchParams.get("relationsAllFields");
	if (relations != null) {
		if (options?.features && !options.features.relations && !options.ignoreExtraFeatures) {
			throw new Error("The relations option is not allowed on this route.");
		}

		if (!query.include) {
			query.include = {};
		}

		const relationsArr = relations.split(",");
		let includeVal = { select: { id: true } } as { select: { id: true } } | true;
		if (relationsAllFields != null) {
			includeVal = true;
		}
		for (const rel of relationsArr) {
			query.include[
				TableMetadata[table].relations.find((mr) => mr.table === capitalizeTable(getTableName(rel)))!.field
			] = includeVal;
		}
	} else if (!options?.ignoreExtraFeatures && relationsAllFields != null) {
		throw new Error("The relationsAllFields option requires the relations option.");
	}

	//get deep relation data
	let deepRelsArray = undefined as Uncapitalize<ModelName>[] | undefined;
	const deepRelations = searchParams.get("deepRelations");
	if (deepRelations != null) {
		if (options?.features && !options.features.deepRelations && !options.ignoreExtraFeatures) {
			throw new Error("The deepRelations option is not allowed on this route.");
		}

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

					if (!query.include) {
						query.include = {};
					}

					let include =
						typeof TableMetadata[dr].titleField === "string"
							? { [TableMetadata[dr].titleField]: true }
							: TableMetadata[dr].titleField.reduce((acc, f) => ({ ...acc, [f]: true }), {});

					for (const rel of path.toReversed()) {
						include = { [rel.field]: { select: include } };
					}

					//maintain previous includes
					deepMerge(query.include, include);
				}
			}

			//remove deep relations that are already included in the query
			for (const ad of alreadyDone) {
				deepRelsArray.splice(deepRelsArray.indexOf(ad), 1);
			}
		}
	}

	const tempTake = searchParams.get("take");
	let parsedTake: number | undefined;
	const page = searchParams.get("page");
	let parsedPage: number | undefined;
	if (tempTake != null) {
		parsedTake = Number(tempTake);
		if (!Number.isInteger(parsedTake) || parsedTake < 1) {
			throw new Error(`Invalid take: "${tempTake}". The take option must be a positive integer.`);
		}

		if (page != null) {
			parsedPage = Number(page);
			if (!Number.isInteger(parsedPage) || parsedPage < 1) {
				throw new Error(`Invalid page: "${page}". The page option must be a positive integer.`);
			}
		}
	} else if (!options?.ignoreExtraFeatures) {
		if (!options?.skipPages) {
			throw new Error("The take option is required.");
		}

		if (page != null) {
			throw new Error("The page option requires the take option.");
		}
	}

	return {
		trusted,
		query,
		blast,
		shapes,
		getSamples,
		sampleWhere,
		hasLocationData,
		take: parsedTake,
		page: parsedPage,
		deepRelsArray
	};
}
