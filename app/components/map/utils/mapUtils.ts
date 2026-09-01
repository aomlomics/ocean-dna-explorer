import { getZodType } from "@/app/helpers/schema";
import { DeadValueNumbers, DeadValues } from "@/types/enums";
import type { MapLocation, MapLocationWithValues } from "@/types/globals";
import TableMetadata, { type ModelName, TableNames } from "@/types/tableMetadata";
import chroma from "chroma-js";
import type { Color } from "chroma-js";
import distinctColors from "distinct-colors";
import type useMapLocations from "./useMapLocations";

export type LegendInfo =
	| (
			| {
					field: (typeof TableMetadata)[keyof typeof TableMetadata]["titleField"];
					mode: "discreet";
					colorMap: Record<string, Color>;
					hidden?: string[];
					tooManyOptions?: boolean;
			  }
			| {
					field: string;
					mode: "gradient";
					range: [number, number] | [Date, Date];
					palette: string;
					someNoValue?: boolean;
			  }
	  )
	| undefined;

export const DEFAULT_COLOR = chroma("red");
export const DEFAULT_OUTSIDE_COLOR = chroma("black");
export const DEFAULT_PALETTE = "YlGnBu";
export const DEFAULT_POINT_SIZE = 15;
export const DEFAULT_POINT_SIZE_STEP = 5;
export const DEFAULT_CLUSTER_RADIUS = 0;
export const LEGEND_VALUES_LIMIT = 100;
export const lightMin = 35;
export const chromaMin = 35;

export function getLegendValue(
	field: NonNullable<LegendInfo>["field"],
	loc: MapLocationWithValues | MapLocation,
	userDefinedOptions: Set<string>,
	sep = "/"
) {
	if (typeof field === "string") {
		if (userDefinedOptions.has(field)) {
			return loc.userDefined[field] || "";
		} else {
			return loc[field] || "";
		}
	} else {
		let joined = "";
		for (const [i, char] of [...field].entries()) {
			if (i) {
				joined += sep;
			}
			joined += loc[char];
		}
		return joined;
	}
}

export function getLegendColor(
	legendInfo: LegendInfo,
	loc: MapLocationWithValues | MapLocation,
	userDefinedOptions: Set<string>
) {
	if (legendInfo) {
		if (legendInfo.mode === "discreet") {
			if (legendInfo.tooManyOptions) {
				return { color: DEFAULT_COLOR };
			}

			const titleIdVal = getLegendValue(legendInfo.field, loc, userDefinedOptions);
			if (titleIdVal && legendInfo.colorMap[titleIdVal]) {
				return { color: legendInfo.colorMap[titleIdVal] };
			}
		} else if (legendInfo.mode === "gradient") {
			const val = getLegendValue(legendInfo.field, loc, userDefinedOptions) as number | string | Date | null;
			if (val) {
				let percent;
				if (typeof val === "number") {
					const range = legendInfo.range as [number, number];
					percent = (val - range[0]) / (range[1] - range[0]);
				} else {
					const range = legendInfo.range as [Date, Date];
					percent =
						((typeof val === "string" ? new Date(val).getTime() : val.getTime()) - range[0].getTime()) /
						(range[1].getTime() - range[0].getTime());
				}

				if (percent >= 0 && percent <= 100) {
					return { color: chroma.scale(legendInfo.palette)(percent), percent };
				}
			}
		}
	}

	return { color: DEFAULT_COLOR };
}

export function getWhereAdvancedHref(where: Record<string, string>, table: ModelName | Uncapitalize<ModelName>) {
	return Object.entries(where)
		.map(([f, v]) => {
			if (TableMetadata[table].enumSchema.options.includes(f)) {
				return `["${f}","equals","${v}"]`;
			} else {
				for (const model of TableNames) {
					if (f === TableMetadata[model].titleField) {
						return `["${model}","${f}","equals","${v}"]`;
					}
				}
			}
		})
		.join(",");
}

export function legendValueSort(a: string, b: string) {
	if (DeadValues.includes(a) && !DeadValues.includes(b)) {
		return 1;
	} else if (!DeadValues.includes(a) && DeadValues.includes(b)) {
		return -1;
	} else {
		return a.localeCompare(b);
	}
}

export function getMapLegendField({
	field,
	userDefinedOptions,
	reducedPoints,
	table,
	legendInfo
}: {
	field: string;
	userDefinedOptions: Set<string>;
	reducedPoints: ReturnType<typeof useMapLocations>["reducedPoints"];
	table: Uncapitalize<ModelName>;
	legendInfo?: LegendInfo;
}): LegendInfo {
	if (userDefinedOptions.has(field)) {
		//get unique options
		const options = new Set() as Set<any>;
		let someNoData = false;

		for (const loc of reducedPoints) {
			if (loc.values) {
				for (const val of loc.values) {
					if (val.userDefined[field] != null && val.userDefined[field] !== "") {
						options.add(val.userDefined[field]);
					} else {
						someNoData = true;
					}
				}
			} else if (loc.userDefined[field] != null && loc.userDefined[field] !== "") {
				options.add(loc.userDefined[field]);
			} else {
				someNoData = true;
			}
		}

		const optionsArray = Array.from(options).sort(legendValueSort);

		//check if invalid number of options
		if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
			return { field, mode: "discreet", colorMap: {} };
		} else if (optionsArray.length === 1) {
			return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
		} else if (optionsArray.length > LEGEND_VALUES_LIMIT) {
			return { field, mode: "discreet", colorMap: {}, tooManyOptions: true };
		} else {
			//valid
			const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
			const colorMap = optionsArray.reduce(
				(acc, opt, i) => ({ ...acc, [opt]: colors[i]! }),
				{} as Record<string, Color>
			);

			//add default color if there is some point with no data
			if (someNoData) {
				colorMap["No value"] = DEFAULT_COLOR;
			}

			return { field, mode: "discreet", colorMap };
		}
	} else {
		const type = getZodType(table, field).type;

		if (type === "string" || type === "DeadBoolean") {
			//get unique options
			const options = new Set() as Set<any>;
			let someNoData = false;

			for (const loc of reducedPoints) {
				if (loc.values) {
					for (const val of loc.values) {
						if (val[field]) {
							options.add(val[field]);
						} else {
							someNoData = true;
						}
					}
				} else if (loc[field]) {
					options.add(loc[field]);
				} else {
					someNoData = true;
				}
			}
			const optionsArray = Array.from(options).sort(legendValueSort);

			//check if invalid number of options
			if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
				return { field, mode: "discreet", colorMap: {} };
			} else if (optionsArray.length === 1) {
				return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
			} else if (optionsArray.length > LEGEND_VALUES_LIMIT) {
				return { field, mode: "discreet", colorMap: {}, tooManyOptions: true };
			} else {
				//valid
				const colors = distinctColors({ count: optionsArray.length, chromaMin, lightMin });
				const colorMap = optionsArray.reduce(
					(acc, opt, i) => ({ ...acc, [opt]: colors[i]! }),
					{} as Record<string, Color>
				);

				//add default color if there is some point with no data
				if (someNoData) {
					colorMap["No value"] = DEFAULT_COLOR;
				}

				return { field, mode: "discreet", colorMap };
			}
		} else if (type === "integer" || type === "float") {
			//get unique options
			const options = new Set() as Set<any>;
			let someNoValue = false;

			for (const loc of reducedPoints) {
				if (loc.values) {
					for (const val of loc.values) {
						if (val[field] != null && !DeadValueNumbers.includes(val[field])) {
							options.add(val[field]);
						} else {
							someNoValue = true;
						}
					}
				} else {
					if (loc[field] != null && !DeadValueNumbers.includes(loc[field])) {
						options.add(loc[field]);
					} else {
						someNoValue = true;
					}
				}
			}
			const optionsArray = Array.from(options).sort((a, b) => a - b);

			//check if invalid number of options
			if (optionsArray.length === 0 || (optionsArray.length === 1 && optionsArray[0] == null)) {
				return { field, mode: "discreet", colorMap: {} };
			} else if (optionsArray.length === 1) {
				return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
			} else {
				//valid
				return {
					field,
					mode: "gradient",
					range: [optionsArray[0], optionsArray[optionsArray.length - 1]],
					palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE,
					someNoValue
				};
			}
		} else if (type === "date") {
			//get unique options and cast to epoch timestamp
			const options = new Set() as Set<any>;
			let someNoValue = false;

			for (const loc of reducedPoints) {
				if (loc.values) {
					for (const val of loc.values) {
						if (val[field]) {
							const time = typeof val[field] === "string" ? new Date(val[field]).getTime() : val[field].getTime();
							if (!DeadValueNumbers.includes(time)) {
								options.add(time);
							} else {
								someNoValue = true;
							}
						} else {
							someNoValue = true;
						}
					}
				} else {
					if (loc[field]) {
						const time = typeof loc[field] === "string" ? new Date(loc[field]).getTime() : loc[field].getTime();
						if (!DeadValueNumbers.includes(time)) {
							options.add(time);
						} else {
							someNoValue = true;
						}
					} else {
						someNoValue = true;
					}
				}
			}
			const optionsArray = Array.from(options).sort((a, b) => a - b);

			//check if invalid number of options
			if (
				optionsArray.length === 0 ||
				(optionsArray.length === 1 && (optionsArray[0] == null || isNaN(optionsArray[0])))
			) {
				return { field, mode: "discreet", colorMap: {} };
			} else if (optionsArray.length === 1) {
				return { field, mode: "discreet", colorMap: { [optionsArray[0]]: DEFAULT_COLOR } };
			} else {
				//valid
				return {
					field,
					mode: "gradient",
					range: [new Date(optionsArray[0]), new Date(optionsArray[optionsArray.length - 1])],
					palette: legendInfo?.mode === "gradient" ? legendInfo.palette : DEFAULT_PALETTE,
					someNoValue
				};
			}
		} else {
			return {
				field,
				mode: "discreet",
				colorMap: { "Unsupported field": DEFAULT_COLOR }
			};
		}
	}
}
