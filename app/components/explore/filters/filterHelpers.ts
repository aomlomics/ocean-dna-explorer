import type { Prisma } from "@/app/generated/prisma/client";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReadonlyURLSearchParams } from "next/navigation";

export type FilterValue =
	| string
	| {
			gte?: number;
			lte?: number;
	  }
	| undefined;

export type ConfigField = string | { rel: string; f: string };

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
	field: ConfigField,
	value: FilterValue,
	searchParams: ReadonlyURLSearchParams,
	router: AppRouterInstance
) {
	const newParams = new URLSearchParams(searchParams);

	if (value === undefined || value === "") {
		if (typeof field === "string") {
			newParams.delete(field);
		} else {
			newParams.delete(field.rel);
		}
	} else if (typeof value === "string") {
		if (typeof field === "string") {
			newParams.set(field, value);
		} else {
			newParams.set(field.rel, JSON.stringify({ [field.f]: value }));
		}
	} else if (typeof value === "object") {
		//range
		const temp = {} as {
			gte?: number;
			lte?: number;
		};

		let valObj;
		if (typeof field === "string") {
			valObj = newParams.get(field);
		} else {
			valObj = newParams.get(field.rel);
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
			newParams.set(field, JSON.stringify(temp));
		} else {
			newParams.set(field.rel, JSON.stringify(temp));
		}
	}

	router.push(`?${newParams.toString()}`, { scroll: false });
}

export function formatLabelFromField(fieldKey: string): string {
	const withSpaces = fieldKey.replace(/_/g, " ");
	return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function buildActiveSummaries(tableConfig: FilterConfig[], activeFilters: Record<string, string>): string[] {
	const summaries: string[] = [];
	for (const config of tableConfig) {
		if (config.type === "select" || config.type === "enum") {
			if (typeof config.field === "string") {
				const raw = activeFilters[config.field];
				if (raw !== undefined) {
					let valueLabel = String(raw);
					if (config.type === "select" && Array.isArray(config.options)) {
						const idx = (config.options as string[]).indexOf(raw);
						if (idx !== -1 && Array.isArray((config as SelectFilterConfig).optionsLabels)) {
							valueLabel = (config as SelectFilterConfig).optionsLabels![idx] ?? valueLabel;
						}
					}
					summaries.push(`${formatLabelFromField(config.field)}: ${valueLabel}`);
				}
			} else {
				const rel = config.field.rel;
				const f = config.field.f;
				const rawRel = activeFilters[rel];
				if (rawRel !== undefined) {
					try {
						const parsed = JSON.parse(rawRel);
						if (parsed && parsed[f] !== undefined) {
							summaries.push(`${formatLabelFromField(f)}: ${parsed[f]}`);
						}
					} catch {}
				}
			}
		} else if (config.type === "range") {
			if (typeof config.field === "string") {
				const raw = activeFilters[config.field];
				if (raw !== undefined) {
					try {
						const parsed = JSON.parse(raw);
						const g = parsed.gte ?? (config as RangeFilterConfig).gte;
						const l = parsed.lte ?? (config as RangeFilterConfig).lte;
						summaries.push(`${formatLabelFromField(config.field)}: ${g}–${l}`);
					} catch {}
				}
			}
		} else if (config.type === "selectGroup") {
			for (const field of config.group) {
				if (typeof field === "string") {
					const raw = activeFilters[field];
					if (raw !== undefined) {
						summaries.push(`${formatLabelFromField(field)}: ${raw}`);
					}
				} else {
					const rel = field.rel;
					const f = field.f;
					const rawRel = activeFilters[rel];
					if (rawRel !== undefined) {
						try {
							const parsed = JSON.parse(rawRel);
							if (parsed && parsed[f] !== undefined) {
								summaries.push(`${formatLabelFromField(f)}: ${parsed[f]}`);
							}
						} catch {}
					}
				}
			}
		}
	}
	return summaries;
}

export function getActiveFilters(searchParams: ReadonlyURLSearchParams, tableConfig: FilterConfig[]) {
	const fields = [] as string[];

	for (const config of tableConfig) {
		if (config.type === "selectGroup") {
			for (const field of config.group) {
				fields.push(typeof field === "string" ? field : field.f);
			}
		} else {
			fields.push(typeof config.field === "string" ? config.field : config.field.f);
		}
	}

	return Object.fromEntries(Array.from(searchParams.entries()).filter(([key]) => fields.some((f) => f === key)));
}
