import { DeadBooleanEnum, DeadValueEnum } from "@/types/enums";
import { RanksBySpecificity, TableToSchema } from "@/types/objects";
import { Prisma, Taxonomy } from "@/app/generated/prisma/client";
import { ZodObject, ZodEnum, ZodNumber, ZodOptional, ZodString, ZodDate, ZodLazy, ZodBoolean, ZodArray } from "zod";
import { JsonValue } from "@prisma/client/runtime/library";

export async function fetcher(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		const data = await res.json();
		return { error: data.error };
	}
	return await res.json();
}

//export function getBaseUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:3000/";
//	}
//	return "https://opaldb.vercel.app/";
//}

//export function getRemoteUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:8080";
//	}
//	return "https://opalserver-qnwedardvq-uc.a.run.app";
//}

export function getZodType(field: any): { optional?: boolean; type?: string; values?: string[] } {
	let shape = {} as { optional?: boolean; type?: string; values?: string[] };

	if (field instanceof ZodOptional) {
		shape.optional = true;
	} else if (field instanceof ZodBoolean) {
		shape.type = "boolean";
		// } else if (field instanceof ZodEffects) {
		// 	//zod transform (coerced booleans)
		// 	//TODO: verify it's actually a boolean, and not some other field that uses zod transform
		// 	shape.type = "boolean";
	} else if (field instanceof ZodNumber) {
		if (field._def.checks.length && field._def.checks.some((e) => e.kind === "int")) {
			shape.type = "integer";
		} else {
			shape.type = "float";
		}
	} else if (field instanceof ZodString) {
		shape.type = "string";
	} else if (field instanceof ZodArray) {
		if (field._def.type instanceof ZodString) {
			shape.type = "string[]";
		}
	} else if (field instanceof ZodDate) {
		shape.type = "date";
	} else if (field instanceof ZodLazy) {
		//JSON
		shape.type = "json";
	} else if (field instanceof ZodEnum) {
		//DeadBoolean
		//TODO: verify it's actually a DeadBoolean, and not some other enum
		if (field._def.values.every((v: string) => Object.values(DeadBooleanEnum).includes(v))) {
			shape.type = "boolean";
			shape.values = Object.keys(DeadBooleanEnum);
		}
	}

	try {
		const res = getZodType(field.unwrap());
		return { ...res, ...shape };
	} catch {
		return shape;
	}
}

//this function is barebones, basic, and probably dangerous in some way
function checkZodType(field: any, type: any) {
	//constantly call unwrap(), as the zod types (Optional, Nullable) are nested inside each other
	//if the call fails, then we know it reached the actual type and didn't match
	try {
		if (field instanceof type) {
			return true;
		} else {
			return checkZodType(field.unwrap(), type);
		}
	} catch {
		return false;
	}
}

//parse a field value into a given object only if it exists in the schema
export function parseSchemaToObject(
	field: string,
	fieldName: string,
	obj: Record<string, string | number | boolean | JsonValue | null>,
	schema: ZodObject<any>,
	fieldOptionsEnum: ZodEnum<any>
) {
	//check if the field name is in the Schema
	if (field && fieldOptionsEnum.options.includes(fieldName)) {
		if (checkZodType(schema.shape[fieldName], ZodEnum)) {
			//DeadBooleanEnum
			if (field in DeadBooleanEnum) {
				//replace field with DeadBoolean value
				obj[fieldName] = DeadBooleanEnum[field.toLowerCase() as keyof typeof DeadBooleanEnum];
			}
		} else if (field in DeadValueEnum) {
			//check the type of the field
			if (checkZodType(schema.shape[fieldName], ZodNumber)) {
				//replace the value with the DeadValue equivalent
				obj[fieldName] = DeadValueEnum[field as unknown as DeadValueEnum];
			} else {
				//continue as normal
				obj[fieldName] = field;
			}
		} else {
			//continue as normal
			obj[fieldName] = field;
		}
	}
}

export function randomColors(num: number) {
	let colors = [];
	for (let i = 0; i < num; i++) {
		colors.push(
			`rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`
		);
	}
	return colors;
}

export function getMostSpecificRank(taxonomy: Taxonomy) {
	for (const rank of RanksBySpecificity) {
		if (taxonomy[rank]) {
			return { rank, label: taxonomy[rank] as string };
		}
	}

	return { rank: "taxonomy", label: taxonomy.taxonomy };
}

//handles converting numbers from 0 to 99
function stringToNumber(str: string) {
	const NUMBERS = {
		ZERO: 0,
		ONE: 1,
		TWO: 2,
		THREE: 3,
		FOUR: 4,
		FIVE: 5,
		SIX: 6,
		SEVEN: 7,
		EIGHT: 8,
		NINE: 9,
		TEN: 10,
		ELEVEN: 11,
		TWELVE: 12,
		THIRTEEN: 13,
		FOURTEEN: 14,
		FIFTEEN: 15,
		SIXTEEN: 16,
		SEVENTEEN: 17,
		EIGHTEEN: 18,
		NINETEEN: 19,
		TWENTY: 20,
		THIRTY: 30,
		FOURTY: 40,
		FIFTY: 50,
		SIXTY: 60,
		SEVENTY: 70,
		EIGHTY: 80,
		NINETY: 90
	} as Record<string, number>;

	const ENDING = "__";
	const SEP = "_";

	const words = str.toString().split(ENDING);
	if (words.length === 1) {
		return str;
	}

	let num = 0;
	let replace = "";

	words[0].split(SEP).forEach((word) => {
		if (word in NUMBERS) {
			num += NUMBERS[word];

			if (replace === "") {
				replace += word;
			} else {
				replace += SEP + word;
			}
		}
	});

	if (replace === "") {
		return str;
	} else {
		return str.replace(replace + ENDING, num.toString());
	}
}

export function parseDbEnum(dbEnum: Record<string, string>) {
	const newEnum = {} as Record<string, string>;

	for (const [key, value] of Object.entries(dbEnum)) {
		newEnum[key] = stringToNumber(value)
			.replaceAll("PAREN1_", "(")
			.replaceAll("PAREN2_", ")")
			.replaceAll("PERCENT_", "%")
			.replaceAll("__", "-")
			.replaceAll("_", " ");
	}

	return newEnum;
}

export function parseNestedJson(json: string) {
	let parsed;

	try {
		parsed = JSON.parse(json); // object -> object, number -> number, string -> catch block
	} catch {
		return json;
	}

	if (typeof parsed === "object") {
		for (const [key, value] of Object.entries(parsed)) {
			parsed[key] = parseNestedJson(value as string);
		}
	}

	return parsed;
}

export function parseApiQuery(
	table: Uncapitalize<Prisma.ModelName>,
	searchParams: URLSearchParams,
	skip?: {
		skipFields?: true;
		skipDistinct?: true;
		skipRelations?: true;
		skipRelationsLimit?: true;
		skipIds?: true;
		skipLimit?: true;
		skipFilters?: true;
	},
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
	if (!skip?.skipFields) {
		const fields = searchParams.get("fields");
		if (fields) {
			searchParams.delete("fields");
			query.select = fields.split(",").reduce((acc, f) => ({ ...acc, [f]: true }), {});
		}
	} else if (defaults?.fields) {
		query.select = defaults?.fields;
	}

	//distinct
	if (!skip?.skipDistinct) {
		const distinct = searchParams.get("distinct");
		if (distinct) {
			searchParams.delete("distinct");
			query.distinct = distinct.split(",");
		}
	} else if (defaults?.distinct) {
		query.distinct = defaults.distinct;
	}

	//relations
	if (!skip?.skipRelations) {
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
			if (!skip?.skipRelationsLimit) {
				const relationsLimit = searchParams.get("relationsLimit");
				if (relationsLimit) {
					searchParams.delete("relationsLimit");
					const take = parseInt(relationsLimit);
					if (Number.isNaN(take)) {
						throw new Error(`Invalid relations limit: '${relationsLimit}'. Limit must be an integer.`);
					} else if (take < 1) {
						throw new Error(`Invalid relations limit: '${relationsLimit}'. Limit must be a positive integer.`);
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
				throw new Error(`Invalid value for relationsAllFields: '${allFields}'. Value must be 'true' or 'false'.`);
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
	if (!skip?.skipIds && ids) {
		//list of ids
		searchParams.delete("ids");

		const parsedIds = [] as number[];
		for (const id of ids.split(",")) {
			if (id) {
				const parsed = parseInt(id);
				if (Number.isNaN(parsed)) {
					throw new Error(`Invalid ID: '${id}'. ID must be an integer.`);
				}
				parsedIds.push(parsed);
			}
		}

		query.where = {
			id: {
				in: parsedIds
			}
		};
	} else {
		//limit
		if (!skip?.skipLimit) {
			const take = searchParams.get("limit");
			if (take) {
				searchParams.delete("limit");
				query.take = parseInt(take);
				if (Number.isNaN(query.take)) {
					throw new Error(`Invalid limit: '${take}'. Limit must be an integer.`);
				} else if (query.take < 1) {
					throw new Error(`Invalid limit: '${take}'. Limit must be a positive integer.`);
				}
			}
		}

		//filtering
		if (!skip?.skipFilters) {
			query.where = {} as Record<string, any>;
			const shape = TableToSchema[table].shape;
			searchParams.forEach((value, key) => {
				const type = getZodType(shape[key as keyof typeof shape]).type;
				if (!type) {
					throw new Error(
						`Could not find type of '${key}'. Make sure a field named '${key}' exists on table named '${table}'.`
					);
				}

				const arr = value.split(",");
				if (arr.length > 1) {
					query.where!.OR = [];
					if (type === "string") {
						for (const val of arr) {
							query.where!.OR.push({ [key]: { contains: val, mode: "insensitive" } });
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
						query.where![key] = { contains: value, mode: "insensitive" };
					} else if (type === "integer") {
						query.where![key] = parseInt(value);
					} else if (type === "float") {
						query.where![key] = parseFloat(value);
					} else {
						query.where![key] = value;
					}
				}
			});
		} else if (defaults?.filters) {
			query.where = defaults.filters;
		}
	}

	return query;
}

export function getOptions(arr: Record<string, any>[]) {
	//create object of sets with keys matching arr
	const filterOptionsSet = {} as Record<keyof (typeof arr)[0], Set<any>>;
	for (let field in arr[0]) {
		filterOptionsSet[field as keyof (typeof arr)[0]] = new Set();
	}

	//fill sets with all possible values
	for (let e of arr) {
		for (let [field, value] of Object.entries(e)) {
			if (value) {
				filterOptionsSet[field as keyof typeof e].add(value);
			}
		}
	}

	//convert sets to arrays
	const filterOptions = {} as Record<keyof (typeof arr)[0], any[]>;
	for (let e in filterOptionsSet) {
		filterOptions[e as keyof typeof filterOptions] = Array.from(
			filterOptionsSet[e as keyof typeof filterOptionsSet]
		).sort();
	}

	return filterOptions;
}
