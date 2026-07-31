"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { NullLocation } from "@/types/globals";
import { TableMetadataValue } from "@/types/tableMetadata";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function DynamicMap({
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
	locations: NullLocation[];
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
	return (
		<ActualMap
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
}
