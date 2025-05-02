import projectSubmitAction from "@/app/helpers/actions/project/projectSubmit";
import projectEditAction from "@/app/helpers/actions/project/projectEdit";
import analysisSubmitAction from "@/app/helpers/actions/analysis/submit/analysisSubmit";
import analysisEditAction from "@/app/helpers/actions/analysis/edit/analysisEdit";
import analysisDeleteAction from "@/app/helpers/actions/analysis/delete/analysisDelete";
import assignSubmitAction from "@/app/helpers/actions/analysis/submit/assignSubmit";
import assignDeleteAction from "@/app/helpers/actions/analysis/delete/assignDelete";
import occSubmitAction from "@/app/helpers/actions/analysis/submit/occSubmit";

export type Pluralize<T extends string> = T extends `${infer S}sis`
	? `${S}ses`
	: T extends `${infer S}ay`
	? `${S}ays`
	: T extends `${infer S}ey`
	? `${S}eys`
	: T extends `${infer S}iy`
	? `${S}iys`
	: T extends `${infer S}oy`
	? `${S}oys`
	: T extends `${infer S}uy`
	? `${S}uys`
	: T extends `${infer S}y`
	? `${S}ies`
	: T extends `${infer S}s`
	? T
	: `${T}s`;

export type Role = "admin" | "moderator" | "contributor";
export type Permission = "submit" | "manageUsers";

export type StatusMessage = "success" | "error";
interface ErrorPacket {
	statusMessage: "error";
	error: string;
}
interface SuccessPacket {
	statusMessage: "success";
	result?: any;
}
export type NetworkPacket = ErrorPacket | SuccessPacket;
export type Action = (FormData) => Promise<NetworkPacket>;

declare global {
	namespace PrismaJson {
		type UserDefinedType = Record<string, string>;
		type ChangesType = { field: string; oldValue: string; newValue: string }[];
		type EditHistoryType = { dateEdited: Date; changes: ChangesType }[];
	}

	interface CustomJwtSessionClaims {
		metadata: {
			role?: Role;
		};
	}
}
