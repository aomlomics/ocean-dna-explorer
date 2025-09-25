import { DeadBooleanEnum, DeadValueEnum } from "@/types/enums";
import { ZodArray, ZodBoolean, ZodDate, ZodEnum, ZodLazy, ZodNumber, ZodOptional, ZodString } from "zod";
import { Prisma } from "../generated/prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import TableMetadata from "@/types/tableMetadata";
import { TypeSeparators } from "@/types/objects";
import { deadBooleanToString } from "./utils";

export function parseDbDeadBoolean(dbEnum: Record<string, string>) {
	const newEnum = {} as Record<string, string>;

	for (const [key, value] of Object.entries(dbEnum)) {
		newEnum[key] = deadBooleanToString(value);
	}

	return newEnum;
}

type DbType = "boolean" | "integer" | "float" | "string" | "string[]" | "date" | "json" | "DeadBoolean";
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
		if (field._def.values.every((v: string) => Object.values(DeadBooleanEnum).includes(v))) {
			shape.type = "DeadBoolean";
			shape.values = Object.keys(DeadBooleanEnum);
		}
	}

	try {
		const res = getTypeRecursive(field.unwrap());
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
		} else if (type === "DeadBoolean") {
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
