import projectSubmitAction from "@/app/helpers/actions/projectSubmit";
import analysisSubmitAction from "@/app/helpers/actions/analysis/submit/analysisSubmit";
import assignSubmitAction from "@/app/helpers/actions/analysis/submit/assignSubmit";
import occSubmitAction from "@/app/helpers/actions/analysis/submit/occSubmit";

import analysisDeleteAction from "@/app/helpers/actions/analysis/delete/analysisDelete";
import assignDeleteAction from "@/app/helpers/actions/analysis/delete/assignDelete";

export type SubmitAction =
	| typeof projectSubmitAction
	| typeof analysisSubmitAction
	| typeof assignSubmitAction
	| typeof occSubmitAction;

export type DeleteAction = typeof analysisDeleteAction | typeof assignDeleteAction;

export type SubmitActionReturn = Promise<{
	message: string;
	result?: Record<string, any>;
	error?: string;
}>;

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
