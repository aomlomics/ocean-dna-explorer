import { Assay, Feature, BlastQuery, BlastQueryResult } from "@/app/generated/prisma/client";
import { BlastQueryResultCreateInput } from "@/app/generated/prisma/models";
import { BlastQueryPartial } from "@/prisma/generated/zod";
import { ReactNode } from "react";
import TableMetadata from "@/types/tableMetadata";
import { User } from "@clerk/nextjs/server";

export type Role = "admin" | "moderator" | "contributor";
export type Permission = "contribute" | "manageUsers" | "manageDatabase";

interface ErrorPacket {
	statusMessage: "error";
	error: string;
}
interface SuccessPacket {
	statusMessage: "success";
	result?: any;
	progress?: { message: string; value: number };
	[key: string]: any;
}
interface ProgressPacket {
	statusMessage: "progress";
	progress: { message: string; value: number };
}
export type NetworkPacket = ErrorPacket | SuccessPacket;
export type NetworkProgressPacket = ErrorPacket | SuccessPacket | ProgressPacket | undefined;

export type FormAction = (formData: FormData) => Promise<NetworkPacket>;
export type TargetAction = (...args: any[]) => Promise<NetworkPacket>;
export type ProgressAction = (...args: any[]) => Promise<ReadableStream<any>>;
export type ProgressActionMany = (...args: any[]) => Promise<ReadableStream<any>[]>;
export type ProgressActionManyGlobal = (
	...args: any[]
) => Promise<{ global: ReadableStream<any>; readables: ReadableStream<any>[] }>;

export type ProgressStream = {
	readable: ReadableStream<any>;
	message: (message: string, progress: number) => Promise<void>;
	error: (message: string) => Promise<void>;
	success: (message: string) => Promise<void>;
	close: () => Promise<void>;
};

export type ClerkUserObject = {
	id: string;
	publicMetadata: {
		role?: Role;
		roleApplication?: {
			role: Role;
		};
	};
	firstName: string;
	lastName: string;
	banned: boolean;
	imageUrl: string;
	primaryEmailAddress?: string;
};

type StringQueryMode = "equals" | "contains" | "startsWith" | "endsWith";
type NumberQueryMode = "equals" | "lt" | "lte" | "gt" | "gte";
export type QueryMode =
	| StringQueryMode
	| NumberQueryMode
	| "range"
	| "in"
	| "notIn"
	| "null"
	| "notNull"
	| "deadValue"
	| "boolean";

type StringParamsArrayField = [string, StringQueryMode, string];
type NumberParamsArrayField = [string, NumberQueryMode, number];
type RangeParamsArrayField = [string, "range", [number, number] | [string, string]];
type InParamsArrayField = [string, "in" | "notIn", number[] | string[]];
type DeadParamsArrayField = [string, "deadValue", string];
type BooleanParamsArrayField = [string, "boolean", boolean];

export type ParamsArrayValue = string | number | [number, number] | [string, string] | number[] | string[] | boolean;
export type ParamsArrayField =
	| StringParamsArrayField
	| NumberParamsArrayField
	| RangeParamsArrayField
	| InParamsArrayField
	| DeadParamsArrayField
	| BooleanParamsArrayField;
export type ParamsArrayRelation = [string, ...ParamsArrayField];

// Logical group support for advanced queries.
// This extends the existing advanced query format to support arbitrary nested AND/OR groups
// while remaining backward compatible with the original array-of-arrays structure.
export type ParamsLogicalOperator = "AND" | "OR";
export type ParamsArrayGroup = [ParamsLogicalOperator, ...ParamsArrayElement[]];
export type ParamsArrayElement = ParamsArrayRelation | ParamsArrayField | ParamsArray | ParamsArrayGroup;
export type ParamsArray = ParamsArrayElement[];

export type Point = { lat: number; lng: number };
export type Polygon = {
	type: "polygon";
	bounds: {
		ne: Point;
		sw: Point;
	};
	points: Point[];
};
export type Circle = {
	type: "circle";
	center: Point;
	radius: number;
};
export type MapShape = Polygon | Circle;

export type DbType = "boolean" | "integer" | "float" | "string" | "string[]" | "date" | "json" | "DeadBoolean";

export type NullLocation = {
	decimalLatitude: number | null;
	decimalLongitude: number | null;
	[key: string]: any;
} & { values?: never };
export type Location = {
	decimalLatitude: number;
	decimalLongitude: number;
	[key: string]: any;
} & { values?: never; polylines?: never };
export type LocationWithValues = {
	decimalLatitude: number;
	decimalLongitude: number;
	values?: Location[];
	polylines?: [number, number][];
	[key: string]: any;
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
	? R
	: any;

export type BlastRequest = {
	queries: (string | [string, string])[];
	assay_name?: Assay["assay_name"];
	save?: boolean;
	options?: Omit<BlastQueryPartial, "id" | "userId" | "dateCalculated" | "sequences" | "database" | "databaseVersion">;
};

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type UserMetadata = {
	role?: Role;
	roleApplication?: {
		role: Role;
		description?: string;
	};
};

export type UserObject = {
	id: User["id"];
	publicMetadata: UserMetadata;
	firstName: User["firstName"];
	lastName: User["lastName"];
	banned: User["banned"];
	imageUrl: User["imageUrl"];
	primaryEmailAddress?: User["emailAddresses"][number]["emailAddress"];
};

declare module "wordcloud";

declare global {
	namespace PrismaJson {
		type UserDefinedType = Record<string, string>;
		type ChangesType = { field: string; oldValue: string; newValue: string }[];
		type EditHistoryType = { id: string; dateEdited: Date; changes: ChangesType }[];
	}

	interface CustomJwtSessionClaims {
		metadata: UserMetadata;
	}
}
