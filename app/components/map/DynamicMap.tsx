"use client";

import type { NullLocation } from "@/types/globals";
import type { ModelName } from "@/types/tableMetadata";
import dynamic from "next/dynamic";
/** @ignore */
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

/**
 * A component whose entire job is to use NextJS's dynamic to import the
 * {@link app/components/map/ActualMap.default | ActualMap} component. The component needs to be dynamically imported for
 * Leaflet to work properly. Primarily used by {@link app/components/map/Map.SuspenseMap | SuspenseMap}.
 *
 * This component should only be used directly inside client components that already have locations. If used directly,
 * it should be wrapped in a {@link app/components/map/MapWrapper.default | MapWrapper}. For all other cases, use either
 * {@link app/components/map/Map.default | Map} or {@link app/components/map/ClientMap.default | ClientMap}.
 *
 * **Components:**
 *
 * - {@link app/components/map/ActualMap.default | ActualMap}
 */
export default function DynamicMap({
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
	locations: NullLocation[];
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
	return (
		<ActualMap
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
}
