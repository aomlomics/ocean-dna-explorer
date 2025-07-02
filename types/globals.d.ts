import projectSubmitAction from "@/app/actions/project/projectSubmit";
import projectEditAction from "@/app/actions/project/projectEdit";
import analysisSubmitAction from "@/app/actions/analysis/submit/analysisSubmit";
import analysisEditAction from "@/app/actions/analysis/analysisEdit";
import analysisDeleteAction from "@/app/actions/analysis/analysisDelete";
import assignSubmitAction from "@/app/actions/analysis/submit/assignSubmit";
import assignDeleteAction from "@/app/actions/analysis/delete/assignDelete";
import occSubmitAction from "@/app/actions/analysis/submit/occSubmit";

export type Role = "admin" | "moderator" | "contributor";
export type Permission = "contribute" | "manageUsers";

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
