import { Prisma } from "@/app/generated/prisma/client";
import { LocationWithValues } from "@/types/globals";
import { getWhereAdvancedHref, LegendInfo } from "../utils/mapUtils";
import { Popup } from "react-leaflet";
import TableMetadata, { TableMetadataValue } from "@/types/tableMetadata";
import PopupWithSearchBody from "./PopupWithSearchBody";

export default function PopupWithSearch({
	table,
	titleTable,
	where,
	loc,
	id,
	legendInfo,
	userDefinedOptions,
	maxWidth,
	disableSearch
}: {
	table: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, string>;
	loc: LocationWithValues;
	id: TableMetadataValue["titleField"];
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	maxWidth?: number;
	disableSearch?: true;
}) {
	return (
		<Popup className="map-popup" maxWidth={maxWidth}>
			<div className="card card-xs card-body justify-center min-h-11.25 min-w-11.25 max-h-50 bg-base-100 shadow-sm p-4 gap-0">
				<PopupWithSearchBody
					table={table}
					titleTable={titleTable}
					loc={loc}
					id={id}
					legendInfo={legendInfo}
					userDefinedOptions={userDefinedOptions}
					disableSearch={disableSearch}
					href={`/search?table=${table}&advanced=[["decimalLatitude","equals",${
						loc.decimalLatitude
					}],["decimalLongitude","equals",${loc.decimalLongitude}]${
						where ? "," + getWhereAdvancedHref(where, table) : ""
					}${
						titleTable
							? "," +
								(typeof TableMetadata[titleTable].titleField === "string"
									? `["${TableMetadata[titleTable].titleField}","equals","${
											loc[TableMetadata[titleTable].titleField]
										}"]`
									: TableMetadata[titleTable].titleField.map((f) => `["${f}","equals","${loc[f]}"]`).join(","))
							: ""
					}]`}
				/>
			</div>
		</Popup>
	);
}
