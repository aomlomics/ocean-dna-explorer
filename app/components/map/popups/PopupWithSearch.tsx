import type { MapLocationWithValues } from "@/types/globals";
import { getWhereAdvancedHref, type LegendInfo } from "../utils/mapUtils";
import { Popup } from "react-leaflet";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import PopupWithSearchBody from "./PopupWithSearchBody";

export default function PopupWithSearch({
	table,
	titleTable,
	where,
	loc,
	legendInfo,
	userDefinedOptions,
	hideSearch
}: {
	table: Uncapitalize<ModelName>;
	titleTable?: Uncapitalize<ModelName>;
	where?: Record<string, string>;
	loc: MapLocationWithValues;
	legendInfo: LegendInfo;
	userDefinedOptions: Set<string>;
	hideSearch?: true;
}) {
	return (
		<Popup className="map-popup">
			<div className="card card-xs card-body justify-center min-h-11.25 min-w-11.25 max-h-60 bg-base-100 shadow-sm p-4 gap-0">
				<PopupWithSearchBody
					table={table}
					titleTable={titleTable}
					loc={loc}
					legendInfo={legendInfo}
					userDefinedOptions={userDefinedOptions}
					hideSearch={hideSearch}
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
