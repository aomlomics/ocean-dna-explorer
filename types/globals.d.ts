import projectSubmitAction from "@/app/actions/project/projectSubmit";
import projectEditAction from "@/app/actions/project/projectEdit";
import analysisSubmitAction from "@/app/actions/analysis/submit/analysisSubmit";
import analysisEditAction from "@/app/actions/analysis/analysisEdit";
import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import assignSubmitAction from "@/app/actions/analysis/submit/assignSubmit";
import assignDeleteAction from "@/app/actions/analysis/delete/assignDelete";
import occSubmitAction from "@/app/actions/analysis/submit/occSubmit";

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
export type Permission = "contribute" | "manageUsers";

export type StatusMessage = "success" | "error";
interface ErrorPacket {
	statusMessage: "error";
	error: string;
}
interface SuccessPacket {
	statusMessage: "success";
	result?: any;
	[key: string]: any;
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
			roleApplication?: {
				role: Role;
				description?: string;
			};
		};
	}
}
