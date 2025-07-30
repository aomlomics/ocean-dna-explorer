import { DeadBooleanEnum, DeadValueEnum } from "@/types/enums";
import { RanksBySpecificity, TypeSeparators } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";
import { Prisma, Taxonomy } from "@/app/generated/prisma/client";
import { ZodObject, ZodEnum, ZodNumber, ZodOptional, ZodString, ZodDate, ZodLazy, ZodBoolean, ZodArray } from "zod";
import { JsonValue } from "@prisma/client/runtime/library";
import distinctColors from "distinct-colors";
import { NetworkProgressPacket, ProgressAction, ProgressActionMany } from "@/types/globals";
import { ActionDispatch, Dispatch, SetStateAction } from "react";

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

type DbType = "boolean" | "integer" | "float" | "string" | "string[]" | "date" | "json";
function getTypeRecursive(field: any): { type: DbType; optional?: boolean; values?: string[] } {
	let shape = {} as { type: DbType; optional?: boolean; values?: string[] };

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

export function getZodType(field: any): { type: DbType; optional?: boolean; values?: string[] } {
	const result = getTypeRecursive(field);
	if (!result.type) {
		throw new Error(`Could not find type of "${field}".`);
	}

	return result;
}

//parse a field value into a given object only if it exists in the schema
export function parseSchemaToObject(
	field: string,
	value: string,
	obj: Record<string, string | string[] | number | number[] | Date | boolean | JsonValue | null>,
	table: Lowercase<Prisma.ModelName>
) {
	//check if the field name is in the Schema
	if (value && TableMetadata[table].enumSchema.options.includes(field)) {
		const type = getZodType(TableMetadata[table].schema.shape[field]).type;
		if (!type) {
			throw new Error(
				`Could not find type of "${field}". Make sure a field named "${field}" exists on table named "${table}".`
			);
		}

		if (type === "string[]") {
			obj[field] = value.split(TypeSeparators.string).map((val) => val.trim());
		} else if (type === "string") {
			obj[field] = value;
		} else if (type === "date") {
			const dateVal = new Date(value);

			if (value.toLowerCase() in DeadValueEnum) {
				//replace value with DeadBoolean value
				obj[field] = new Date(DeadValueEnum[value.toLowerCase() as keyof typeof DeadValueEnum]);
			} else if (isNaN(dateVal.valueOf())) {
				//value is not a singular valid date
				//check if field has corresponding range fields in database
				if (
					!TableMetadata[table].enumSchema.options.includes(field + "_Midpoint_ODE") ||
					!TableMetadata[table].enumSchema.options.includes(field + "_End_ODE")
				) {
					throw new Error(`Invalid format for field "${field}". Field can't be a range.`);
				}

				const valArray = value.split(TypeSeparators[type]).map((v) => v.trim());

				//check if there are exactly 2 dates
				if (valArray.length !== 2) {
					throw new Error(
						`Invalid format for field "${field}". Field must be either one ISO 8601 date, or two dates separated with a "${TypeSeparators[type]}".`
					);
				}

				//check if either date is dead value
				if (valArray[0].toLowerCase() in DeadValueEnum || valArray[1].toLowerCase() in DeadValueEnum) {
					throw new Error(`Invalid format for field "${field}". If providing two dates, neither can be a dead value.`);
				}

				const dateArray = valArray.map((v) => new Date(v));

				//check if first date is invalid
				if (isNaN(dateArray[0].valueOf())) {
					throw new Error(`Invalid format for field "${field}". First value must be a valid ISO 8601 date.`);
				}

				//check if second date is invalid
				if (isNaN(dateArray[1].valueOf())) {
					throw new Error(`Invalid format for field "${field}". Second value must be a valid ISO 8601 date.`);
				}

				//check if dates are in correct order
				if (dateArray[0].getTime() >= dateArray[1].getTime()) {
					throw new Error(`Invalid format for field "${field}". First date must be before second date.`);
				}

				//add to normal field
				obj[field] = dateArray[0];

				//add to database specific fields
				obj[field + "_Midpoint_ODE"] = new Date((dateArray[0].getTime() + dateArray[1].getTime()) / 2);
				obj[field + "_End_ODE"] = dateArray[1];
			} else {
				//value is singular valid date
				//use date value
				obj[field] = dateVal;
			}
		} else if (type === "boolean") {
			if (value.toLowerCase() in DeadBooleanEnum) {
				//replace field with DeadBoolean value
				obj[field] = DeadBooleanEnum[value.toLowerCase() as keyof typeof DeadBooleanEnum];
			} else {
				obj[field] = value;
			}
		} else if (value in DeadValueEnum) {
			//replace the value with the DeadValue equivalent
			obj[field] = DeadValueEnum[value as unknown as DeadValueEnum];
		} else if (type === "float" || type === "integer") {
			const parser = type === "float" ? parseFloat : parseInt;
			const valArray = value.split(TypeSeparators[type]).map((v) => v.trim());

			if (valArray.length === 2) {
				//value is not a singular valid number
				//check if field has corresponding range fields in database
				if (
					!TableMetadata[table].enumSchema.options.includes(field + "_Midpoint_ODE") ||
					!TableMetadata[table].enumSchema.options.includes(field + "_End_ODE")
				) {
					throw new Error(`Invalid format for field "${field}". Field can't be a range.`);
				}

				//check if there are exactly 2 numbers
				if (valArray.length !== 2) {
				}

				//check if either number is dead value
				if (valArray[0].toLowerCase() in DeadValueEnum || valArray[1].toLowerCase() in DeadValueEnum) {
					throw new Error(
						`Invalid format for field "${field}". If providing two ${type}s, neither can be a dead value.`
					);
				}

				const parsedArray = valArray.map((v) => parser(v));

				//check if first number is invalid
				if (isNaN(parsedArray[0])) {
					throw new Error(`Invalid format for field "${field}". First value must be a valid ${type}.`);
				}

				//check if second number is invalid
				if (isNaN(parsedArray[1])) {
					throw new Error(`Invalid format for field "${field}". Second value must be a valid ${type}.`);
				}

				//check if numbers are in correct order
				if (parsedArray[0] >= parsedArray[1]) {
					throw new Error(`Invalid format for field "${field}". First ${type} must be before second ${type}.`);
				}

				//add to normal field
				obj[field] = parsedArray[0];

				//add to database specific fields
				const midpoint = (parsedArray[0] + parsedArray[1]) / 2;
				obj[field + "_Midpoint_ODE"] = type === "float" ? midpoint : Math.round(midpoint);
				obj[field + "_End_ODE"] = parsedArray[1];
			} else if (valArray.length === 1) {
				obj[field] = parser(valArray[0]);
			} else {
				throw new Error(
					`Invalid format for field "${field}". Field must be either one ${type}, or two ${type}s separated with a "${TypeSeparators[type]}".`
				);
			}
		} else {
			//continue as normal
			obj[field] = value;
		}
	}
}

export function randomColors(count: number) {
	const colors = distinctColors({ count });

	return colors.map((c) => {
		const rgb = c.rgb();
		return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
	});
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

export function deadBooleanToString(value: any) {
	return stringToNumber(value)
		.replaceAll("PAREN1_", "(")
		.replaceAll("PAREN2_", ")")
		.replaceAll("PERCENT_", "%")
		.replaceAll("COLON__", ": ")
		.replaceAll("__", "-")
		.replaceAll("_", " ");
}

export function parseDbDeadBoolean(dbEnum: Record<string, string>) {
	const newEnum = {} as Record<string, string>;

	for (const [key, value] of Object.entries(dbEnum)) {
		newEnum[key] = deadBooleanToString(value);
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
	if (!skip?.skipIds && ids) {
		//list of ids
		searchParams.delete("ids");

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
	} else {
		//limit
		if (!skip?.skipLimit) {
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
		if (!skip?.skipFilters) {
			query.where = {} as Record<string, any>;
			const shape = TableMetadata[table].schema.shape;
			searchParams.forEach((value, key) => {
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

export function createProgressStream() {
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();
	const encoder = new TextEncoder();

	/**
	 * Send updates to client
	 * @param message - string message to display in toast
	 * @param value - number progress to display in button progress
	 */
	async function message(message: string, value: number) {
		const data = JSON.stringify({ statusMessage: "progress", progress: { message, value } });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Send error to client
	 * @param message - string message to display in toast
	 */
	async function error(message: string) {
		const data = JSON.stringify({ statusMessage: "error", error: message });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Send success to client
	 * @param message - string message to display in toast
	 */
	async function success(message: string) {
		const data = JSON.stringify({ statusMessage: "success", progress: { message, value: 100 } });
		await writer.write(encoder.encode(`${data}\n`));
	}

	/**
	 * Close the stream and terminate server process
	 */
	async function close() {
		await writer.close();
	}

	return {
		readable: stream.readable,
		message,
		error,
		success,
		close
	};
}

export async function doProgressAction({
	action,
	setter,
	reducer,
	args = []
}: {
	action: ProgressAction;
	setter?: Dispatch<SetStateAction<NetworkProgressPacket>>;
	reducer?: {
		id: string;
		key: string;
		setter: ActionDispatch<
			[
				update:
					| {
							id: string;
							key: string;
							res: NetworkProgressPacket;
					  }
					| undefined
			]
		>;
	};
	args: any[];
}) {
	const readable = await action(...args);
	const reader = readable.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			return;
		}

		//split the string into an array of individual JSON objects
		const stream = decoder.decode(value);
		const jsonObjects = stream.trim().split("\n");

		//parse each JSON object
		for (const jsonStr of jsonObjects) {
			const data = JSON.parse(jsonStr) as NetworkProgressPacket;

			if (setter) {
				setter(data);
			} else if (reducer) {
				reducer.setter({ id: reducer.id, key: reducer.key, res: data });
			}

			if (data?.statusMessage === "error") {
				return data.error;
			}
		}
	}
}

async function handleReadable(readable: ReadableStream<any>, setter: (res: NetworkProgressPacket) => void) {
	const reader = readable.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		//split the string into an array of individual JSON objects
		const stream = decoder.decode(value);
		const jsonObjects = stream.trim().split("\n");

		//parse each JSON object
		jsonObjects.forEach((jsonStr) => {
			const data = JSON.parse(jsonStr) as NetworkProgressPacket;
			setter(data);
		});
	}
}

export async function doProgressActionMany(
	action: ProgressActionMany,
	setters: Dispatch<SetStateAction<NetworkProgressPacket>>[],
	globalSetter: Dispatch<SetStateAction<NetworkProgressPacket>>,
	...args: any[]
) {
	const { global, readables } = await action(...args);

	handleReadable(global, globalSetter);
	for (let i = 0; i < readables.length; i++) {
		handleReadable(readables[i], setters[i]);
	}
}
