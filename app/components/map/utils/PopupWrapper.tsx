import type { MapLocationWithValues } from "@/types/globals";
import { getWhereAdvancedHref, type LegendInfo } from "./mapUtils";
import { Popup } from "react-leaflet";
import TableMetadata, { type ModelName } from "@/types/tableMetadata";
import LocationList from "./LocationList";

/**
 * {@link app/components/map/ActualMap.default | ActualMap} component that wraps a {@link LocationList} in a [React
 * Leaflet Popup](https://react-leaflet.js.org/docs/api-components/#popup).
 *
 * The main reason this component exists is to allow easier access to the loc prop in
 * {@link app/components/map/utils/ClusterGroup.default | ClusterGroup}. [React leaflet
 * markercluster](https://www.npmjs.com/package/react-leaflet-markercluster) gives access to the props for every child's
 * component. This component puts the loc prop at the top of that stack.
 *
 * It also parses the Prisma-style where query into a parsed URL to the search page.
 */
export default function PopupWrapper({
	table,
	titleTable,
	where,
	loc,
	legendInfo,
	userDefinedOptions,
	hideSearch
}: {
	/** Table that the map is showing points for. */
	table: Uncapitalize<ModelName>;
	/** The database table that the points will be grouped by. */
	titleTable?: Uncapitalize<ModelName>;
	/** Prisma-style filter for linking to the search page. */
	where?: Record<string, string>;
	/** The location point to be displayed on the map, which may contain a list of values. */
	loc: MapLocationWithValues;
	/** The object that stores information about the legend. */
	legendInfo: LegendInfo;
	/** A list of the legendOptions that come from the dataset's userDefined field. */
	userDefinedOptions: Set<string>;
	/** Show or hide the button that links to the Search page. */
	hideSearch?: true;
}) {
	const titleId = titleTable && TableMetadata[titleTable].titleField;

	return (
		<Popup className="map-popup">
			<div className="card card-xs card-body justify-center min-h-11.25 min-w-11.25 max-h-60 bg-base-100 shadow-sm p-4 gap-0">
				<LocationList
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
						titleId
							? "," +
								(typeof titleId === "string"
									? `["${titleId}","equals","${loc[titleId]}"]`
									: titleId.map((f) => `["${f}","equals","${loc[f]}"]`).join(","))
							: ""
					}]`}
				/>
			</div>
		</Popup>
	);
}
