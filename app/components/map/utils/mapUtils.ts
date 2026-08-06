import { Prisma } from "@/app/generated/prisma/client";
import { Location, LocationWithValues } from "@/types/globals";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import chroma from "chroma-js";
import { Color } from "chroma-js";

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

export function getLegendValue(
	field: NonNullable<LegendInfo>["field"],
	loc: LocationWithValues | Location,
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
		for (let i = 0; i < field.length; i++) {
			if (i) {
				joined += sep;
			}
			joined += loc[field[i]];
		}
		return joined;
	}
}

export function getLegendColor(
	legendInfo: LegendInfo,
	loc: LocationWithValues | Location,
	userDefinedOptions: Set<string>
) {
	if (legendInfo) {
		if (legendInfo.mode === "discreet") {
			if (legendInfo.tooManyOptions) {
				return { color: DEFAULT_COLOR };
			}

			const titleIdVal = getLegendValue(legendInfo.field, loc, userDefinedOptions);
			if (titleIdVal) {
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

export function getWhereAdvancedHref(
	where: Record<string, string>,
	table: Prisma.ModelName | Uncapitalize<Prisma.ModelName>
) {
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
