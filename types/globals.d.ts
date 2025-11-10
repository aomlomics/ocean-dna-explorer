import projectSubmitAction from "@/app/actions/project/create/projectSubmit";
import projectEditAction from "@/app/actions/project/update/projectEdit";
import analysisSubmitAction from "@/app/actions/analysis/create/analysisSubmit";
import analysisEditAction from "@/app/actions/analysis/update/analysisEdit";
import analysisDeleteAction from "@/app/actions/analysis/delete/analysisDelete";
import assignSubmitAction from "@/app/actions/analysis/create/assignSubmit";
import assignDeleteAction from "@/app/actions/analysis/delete/assignDelete";
import occSubmitAction from "@/app/actions/analysis/create/occSubmit";
import { LatLng, LatLngBoundsExpression } from "leaflet";

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
export type TargetAction = (target: string, ...args) => Promise<NetworkPacket>;
export type ProgressAction = (...args) => Promise<ReadableStream<any>>;
export type ProgressActionMany = (...args) => Promise<ReadableStream<any>[]>;
export type ProgressActionManyGlobal = (
	...args
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

export type QueryMode = "equals" | "contains" | "startsWith" | "endsWith" | "lt" | "lte" | "gt" | "gte" | "range";
export type ParamsArrayField = [string, QueryMode, string | number | [number, number] | [string, string]];
export type ParamsArrayRelation = [string, ...ParamsArrayField];
export type ParamsArray = Array<ParamsArrayRelation | ParamsArrayField | ParamsArray>;

export type DbType = "boolean" | "integer" | "float" | "string" | "string[]" | "date" | "json" | "DeadBoolean";

type LocationWithoutValues = {
	decimalLatitude: number;
	decimalLongitude: number;
	[key: string]: any;
};
export type Location = LocationWithoutValues & { values: LocationWithoutValues[] };
export type MapProps =
	| {
			center: LatLng;
			zoom: number;
	  }
	| {
			bounds: LatLngBoundsExpression;
	  };

declare global {
	namespace PrismaJson {
		type UserDefinedType = Record<string, string>;
		type ChangesType = { field: string; oldValue: string; newValue: string }[];
		type EditHistoryType = { id: string; dateEdited: string; changes: ChangesType }[];
	}

	interface CustomJwtSessionClaims {
		metadata: {
			role?: Role;
			roleApplication?: {
				role: Role;
				description?: string;
			};
		};
	}
}
