import { Suspense } from "react";
import DynamicMap from "./DynamicMap";
import type { NullLocation } from "@/types/globals";
import type { ModelName } from "@/types/tableMetadata";

/**
 * Must provide either a query or a locations array, but never both.
 */
type MapLocationSource =
	| {
			/** Fetch locations asynchronously. */
			query: () => Promise<NullLocation[]>;
			locations?: never;
	  }
	| {
			/** Provide locations directly. */
			query?: never;
			locations: NullLocation[];
	  };

/**
 * Can provide either a titleTable or a defaultLegendField, but never both.
 */
type MapLegendSource =
	| {
			/** Table used to resolve location titles. */
			titleTable?: Uncapitalize<ModelName>;
			defaultLegendField?: never;
	  }
	| {
			/** Field used as the default legend field. */
			titleTable?: never;
			defaultLegendField?: string;
	  };

/**
 * A simply named wrapper for {@link app/components/map/ActualMap.default | ActualMap}. See that component for documentation on shared props.
 *
 * **Param types:**
 * - {@link MapLocationSource}
 * - {@link MapLegendSource}
 *
 * **Components:**
 * - {@link SuspenseMap}
 */
export default function Map({
	query,
	locations,
	where,
	table,
	titleTable,
	defaultLegendField,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit,
	shapesToUrl,
	disableSearch,
	className = ""
}: {
	/** Styling for the div that wraps the nested {@link SuspenseMap}. */
	className?: string;
	cluster?: boolean;
	clusterRadius?: number;
	disableSearch?: true;
	draw?: boolean;
	legend?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	table?: Uncapitalize<ModelName>;
	where?: Record<string, string>;
} & MapLocationSource &
	MapLegendSource) {
	return (
		<div
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-square [:where(&)]:lg:aspect-video [:where(&)]:rounded-lg ${className ?? ""}`}
		>
			<Suspense
				fallback={
					<div className="w-full h-full flex justify-center items-center">
						<div className="h-full aspect-square p-50">
							<span className="loading loading-spinner loading-xl h-full w-full" />
						</div>
					</div>
				}
			>
				<SuspenseMap
					query={query}
					locations={locations}
					where={where}
					table={table}
					titleTable={titleTable}
					defaultLegendField={defaultLegendField}
					cluster={cluster}
					clusterRadius={clusterRadius}
					legend={legend}
					draw={draw}
					legendOmit={legendOmit}
					shapesToUrl={shapesToUrl}
					disableSearch={disableSearch}
				/>
			</Suspense>
		</div>
	);
}

/**
 * A component that is wrapped in a React Suspense by {@link Map} so that, if a query is provided, it can show a loading state while the query is awaited.
 *
 * **Components:**
 * - {@link app/components/map/DynamicMap.default | DynamicMap}
 */
async function SuspenseMap({
	query,
	locations,
	where,
	table,
	titleTable,
	defaultLegendField,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit,
	shapesToUrl,
	disableSearch
}: {
	query?: () => Promise<NullLocation[]>;
	locations?: NullLocation[];
	where?: Record<string, string>;
	table?: Uncapitalize<ModelName>;
	titleTable?: Uncapitalize<ModelName>;
	defaultLegendField?: string;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	disableSearch?: true;
}) {
	if (locations) {
		return (
			<DynamicMap
				locations={locations}
				where={where}
				table={table}
				titleTable={titleTable}
				defaultLegendField={defaultLegendField}
				cluster={cluster}
				clusterRadius={clusterRadius}
				legend={legend}
				draw={draw}
				legendOmit={legendOmit}
				shapesToUrl={shapesToUrl}
				disableSearch={disableSearch}
			/>
		);
	} else if (query) {
		return (
			<DynamicMap
				locations={await query()}
				where={where}
				table={table}
				titleTable={titleTable}
				defaultLegendField={defaultLegendField}
				cluster={cluster}
				clusterRadius={clusterRadius}
				legend={legend}
				draw={draw}
				legendOmit={legendOmit}
				shapesToUrl={shapesToUrl}
				disableSearch={disableSearch}
			/>
		);
	}
}
