import type { Prisma } from "@/app/generated/prisma/client";
import { Suspense } from "react";
import DynamicMap from "./DynamicMap";
import type { NullLocation } from "@/types/globals";
import { TableMetadataValue } from "@/types/tableMetadata";

export default function Map({
	query,
	locations,
	where,
	id,
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
	where?: Record<string, string>;
	id?: TableMetadataValue["titleField"];
	table?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
	disableSearch?: true;
	className?: string;
} & (
	| { query: () => Promise<NullLocation[]>; locations?: undefined }
	| { query?: undefined; locations: NullLocation[] }
) &
	(
		| { titleTable?: Uncapitalize<Prisma.ModelName>; defaultLegendField?: undefined }
		| { titleTable?: undefined; defaultLegendField?: string }
	)) {
	return (
		<div
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-video [:where(&)]:rounded-lg ${className ?? ""}`}
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
					id={id}
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

async function SuspenseMap({
	query,
	locations,
	where,
	id,
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
	id?: TableMetadataValue["titleField"];
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
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
				id={id}
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
				id={id}
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
