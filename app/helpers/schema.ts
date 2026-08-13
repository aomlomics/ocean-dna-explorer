import { DeadBooleanToEnum, DeadValueEnum } from "@/types/enums";
import { ZodArray, ZodBoolean, ZodDate, ZodEnum, ZodLazy, ZodNumber, ZodOptional, ZodString } from "zod";
import { Prisma } from "../generated/prisma/client";
import TableMetadata, { DataTableNames, RelationMetadata, TableNames } from "@/types/tableMetadata";
import { TypeSeparators } from "@/types/objects";
import { capitalizeTable } from "./utils";
import { DbType } from "@/types/globals";
import { JsonValue } from "@prisma/client/runtime/client";

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

function deadBooleanToString(value: any) {
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

function getTypeRecursive(field: any): { type: DbType; optional?: boolean; values?: string[] } {
	const shape = {} as { type: DbType; optional?: boolean; values?: string[] };

	if (field instanceof ZodOptional) {
		shape.optional = true;
	} else if (field instanceof ZodBoolean) {
		shape.type = "boolean";
	} else if (field instanceof ZodNumber) {
		//TODO: isInt exists here, Zod types aren't updated properly
		if (field.def.checks?.length && field.def.checks.some((e) => (e as unknown as { isInt: boolean }).isInt)) {
			shape.type = "integer";
		} else {
			shape.type = "float";
		}
	} else if (field instanceof ZodString) {
		shape.type = "string";
	} else if (field instanceof ZodArray) {
		if (field.def.element instanceof ZodString) {
			shape.type = "string[]";
		}
	} else if (field instanceof ZodDate) {
		shape.type = "date";
	} else if (field instanceof ZodLazy) {
		shape.type = "json";
	} else if (field instanceof ZodEnum) {
		if (Object.keys(field.def.entries).every((v: string) => Object.values(DeadBooleanToEnum).includes(v))) {
			shape.type = "DeadBoolean";
			shape.values = Object.keys(DeadBooleanToEnum);
		}
	}

	try {
		const res = getTypeRecursive(field.unwrap());
		return { ...res, ...shape };
	} catch {
		return shape;
	}
}

export function getZodType(
	table: Prisma.ModelName | Uncapitalize<Prisma.ModelName>,
	field: string
): { type: DbType; optional?: boolean; values?: string[] } {
	const result = getTypeRecursive(TableMetadata[table].schema.shape[field]);

	if (!result.type) {
		throw new Error(`Could not find type of "${field}" on table named ${table}.`);
	}

	return result;
}

//parse a field value into a given object only if it exists in the schema
export function parseSchemaToObject(
	f: string,
	v: string,
	obj: Record<string, string | string[] | number | number[] | Date | boolean | JsonValue | null>,
	table: Uncapitalize<Prisma.ModelName>
) {
	const field = f.trim();
	const value = v.trim();
	//check if the field name is in the Schema
	if (value && TableMetadata[table].enumSchema.options.includes(field)) {
		const type = getZodType(table, field).type;

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
				const valArray = value.split(TypeSeparators[type]).map((v) => v.trim());

				//check if there are exactly 2 dates
				if (valArray.length !== 2) {
					throw new Error(
						`Invalid format for the field "${field}". Field must be either one ISO 8601 date, or two dates separated with a "${TypeSeparators[type]}". The provided value was "${value}".`
					);
				}

				//check if field has corresponding range fields in database
				if (
					!TableMetadata[table].enumSchema.options.includes(field + "_Midpoint_ODE") ||
					!TableMetadata[table].enumSchema.options.includes(field + "_End_ODE")
				) {
					throw new Error(
						`Invalid format for the field "${field}". The value can't be a range. The provided value was "${value}".`
					);
				}

				//check if either date is dead value
				if (valArray[0].toLowerCase() in DeadValueEnum || valArray[1].toLowerCase() in DeadValueEnum) {
					throw new Error(
						`Invalid format for the field "${field}". If providing two dates, neither can be a dead value. The provided value was "${value}".`
					);
				}

				const dateArray = valArray.map((v) => new Date(v));

				//check if first date is invalid
				if (isNaN(dateArray[0].valueOf())) {
					throw new Error(
						`Invalid format for the field "${field}". The first value must be a valid ISO 8601 date. The provided value for the first date was "${dateArray[0]}". The provided value for the second date was "${dateArray[1]}".`
					);
				}

				//check if second date is invalid
				if (isNaN(dateArray[1].valueOf())) {
					throw new Error(
						`Invalid format for the field "${field}". The second value must be a valid ISO 8601 date. The provided value for the first date was "${dateArray[0]}". The provided value for the second date was "${dateArray[1]}".`
					);
				}

				//check if dates are in correct order
				if (dateArray[0].getTime() >= dateArray[1].getTime()) {
					throw new Error(
						`Invalid format for the field "${field}". The first date must be before second date. The provided value for the first date was "${dateArray[0]}". The provided value for the second date was "${dateArray[1]}".`
					);
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
		} else if (type === "DeadBoolean") {
			if (value.toLowerCase() in DeadBooleanToEnum) {
				//replace field with DeadBoolean value
				obj[field] = DeadBooleanToEnum[value.toLowerCase() as keyof typeof DeadBooleanToEnum];
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
					throw new Error(
						`Invalid format for the field "${field}". The value can't be a range. The provided value was "${value}".`
					);
				}

				//check if either number is dead value
				if (valArray[0].toLowerCase() in DeadValueEnum || valArray[1].toLowerCase() in DeadValueEnum) {
					throw new Error(
						`Invalid format for the field "${field}". If providing two ${type}s, neither can be a dead value. The first provided value was "${valArray[0]}". The second provided value was "${valArray[1]}".`
					);
				}

				const parsedArray = valArray.map((v) => parser(v));

				//check if first number is invalid
				if (isNaN(parsedArray[0])) {
					throw new Error(
						`Invalid format for the field "${field}". First value must be a valid ${type}. The first provided value was "${valArray[0]}". The second provided value was "${valArray[1]}".`
					);
				}

				//check if second number is invalid
				if (isNaN(parsedArray[1])) {
					throw new Error(
						`Invalid format for the field "${field}". Second value must be a valid ${type}. The first provided value was "${valArray[0]}". The second provided value was "${valArray[1]}".`
					);
				}

				//check if numbers are in correct order
				if (parsedArray[0] >= parsedArray[1]) {
					throw new Error(
						`Invalid format for the field "${field}". First ${type} must be before second ${type}. The first provided value was "${valArray[0]}". The second provided value was "${valArray[1]}".`
					);
				}

				//add to normal field
				obj[field] = parsedArray[0];

				//add to database specific fields
				const midpoint = (parsedArray[0] + parsedArray[1]) / 2;
				obj[field + "_Midpoint_ODE"] = type === "float" ? midpoint : Math.round(midpoint);
				obj[field + "_End_ODE"] = parsedArray[1];
			} else if (valArray.length === 1) {
				const parsed = parser(valArray[0]);
				if (isNaN(parsed)) {
					throw new Error(
						`Invalid format for the field "${field}". Field must be a number. The provided value was "${value}".`
					);
				}

				obj[field] = parsed;
			} else {
				throw new Error(
					`Invalid format for the field "${field}". Field must be either one ${type}, or two ${type}s separated with a "${TypeSeparators[type]}". The provided value was "${value}".`
				);
			}
		} else {
			//continue as normal
			obj[field] = value;
		}
	}
}

export function getRelationPath(start: Uncapitalize<Prisma.ModelName>, target: Uncapitalize<Prisma.ModelName>) {
	const queue = [[capitalizeTable(start), []]] as [Prisma.ModelName, Prisma.ModelName[]][];
	const visited = new Set() as Set<Prisma.ModelName>;

	const capsTarget = capitalizeTable(target);
	while (queue.length) {
		const [curr, [...path]] = queue.shift()!;
		path.push(curr);

		if (curr === capsTarget) {
			if (!path.length) {
				return;
			}

			//convert to path of relation metadata
			const pathRelations = [] as RelationMetadata[];
			path.reduce((prev, t) => {
				pathRelations.push(TableMetadata[prev].relations.find((rel) => rel.table === t)!);
				return t;
			});
			return pathRelations as [RelationMetadata, ...RelationMetadata[]];
		}

		if (
			!visited.has(curr) && //skip visited tables
			//Project restrictions
			(curr !== "Project" || //base case
				path.length === 1) //starting at Project
		) {
			for (const rel of TableMetadata[curr].relations) {
				if (
					//Analysis restrictions
					(curr !== "Analysis" || //base case
						rel.table === "Project" || //Analysis to Project
						rel.table === "Assay" || //Analysis to Assay
						path.includes("Project") || //Project to Analysis
						path.length === 1) && //starting at Analysis
					//Assay restrictions
					(curr !== "Assay" || //base case
						rel.table === "AssayPrep" || //Assay to AssayPrep
						(path.includes("AssayPrep") && path.length === 2) || //starting at AssayPrep to Assay
						path.length === 1) //starting at Assay
				) {
					queue.push([rel.table, path]);
				}
			}
		}
		visited.add(curr);
	}
}

export function getTableName(table: string, err?: string) {
	const found = TableNames.find(
		(t) => t.toLowerCase() === table.toLowerCase() || TableMetadata[t].plural.toLowerCase() === table.toLowerCase()
	);

	if (!found) {
		throw new Error(err || `Invalid table name: "${table}".`);
	}

	return found;
}

export function getDataTableName(table: string, err?: string) {
	const found = DataTableNames.find(
		(t) => t.toLowerCase() === table.toLowerCase() || TableMetadata[t].plural.toLowerCase() === table.toLowerCase()
	);

	if (!found) {
		throw new Error(err || `Invalid table name: "${table}".`);
	}

	return found;
}

export function getTableNameSafe(table?: string | null) {
	if (table) {
		return TableNames.find(
			(t) => t.toLowerCase() === table.toLowerCase() || TableMetadata[t].plural.toLowerCase() === table.toLowerCase()
		);
	}
}

export function getDataTableNameSafe(table?: string | null) {
	if (table) {
		return DataTableNames.find(
			(t) => t.toLowerCase() === table.toLowerCase() || TableMetadata[t].plural.toLowerCase() === table.toLowerCase()
		);
	}
}
