import { Prisma } from "@/app/generated/prisma/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams } from "next/navigation";

export type FilterValue =
	| string
	| {
			gte?: number;
			lte?: number;
	  }
	| undefined;

type ConfigField = string | { rel: string; f: string };

export type SelectFilterConfig = {
	type: "select";
	field: ConfigField;
	options: string[];
	optionsLabels?: string[];
};

export type SelectGroupFilterConfig = {
	type: "selectGroup";
	group: ConfigField[];
	table: Uncapitalize<Prisma.ModelName>;
};

export type EnumFilterConfig = {
	type: "enum";
	field: ConfigField;
	enum: Record<string, string>;
};

export type RangeFilterConfig = {
	type: "range";
	field: ConfigField;
	gte: number;
	lte: number;
};

export type FilterConfig = SelectFilterConfig | SelectGroupFilterConfig | EnumFilterConfig | RangeFilterConfig;

export function handleFilterChange(
	field: string | { rel: string; f: string },
	value: FilterValue,
	searchParams: ReadonlyURLSearchParams,
	router: AppRouterInstance
) {
	const params = new URLSearchParams(searchParams);

	if (value === undefined || value === "") {
		if (typeof field === "string") {
			params.delete(field);
		} else {
			params.delete(field.rel);
		}
	} else if (typeof value === "string") {
		if (typeof field === "string") {
			params.set(field, value);
		} else {
			params.set(field.rel, JSON.stringify({ [field.f]: value }));
		}
	} else if (typeof value === "object") {
		//range
		const temp = {} as {
			gte?: number;
			lte?: number;
		};

		let valObj;
		if (typeof field === "string") {
			valObj = params.get(field);
		} else {
			valObj = params.get(field.rel);
		}

		if (valObj) {
			const parsedValObj = JSON.parse(valObj);

			if (parsedValObj.gte) {
				temp.gte = parsedValObj.gte;
			}
			if (parsedValObj.lte) {
				temp.lte = parsedValObj.lte;
			}
		}

		if (value.gte) {
			temp.gte = value.gte;
		}
		if (value.lte) {
			temp.lte = value.lte;
		}

		if (typeof field === "string") {
			params.set(field, JSON.stringify(temp));
		} else {
			params.set(field.rel, JSON.stringify(temp));
		}
	}

	router.push(`?${params.toString()}`);
}

export function getActiveFilters(searchParams: ReadonlyURLSearchParams, tableConfig: FilterConfig[]) {
	const fields = [] as string[];

	for (let config of tableConfig) {
		if (config.type === "selectGroup") {
			for (let field of config.group) {
				fields.push(typeof field === "string" ? field : field.f);
			}
		} else {
			fields.push(typeof config.field === "string" ? config.field : config.field.f);
		}
	}

	return Object.fromEntries(Array.from(searchParams.entries()).filter(([key]) => fields.some((f) => f === key)));
}
