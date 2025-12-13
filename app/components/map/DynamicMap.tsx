"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { NullLocation } from "@/types/globals";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function DynamicMap({
	locations,
	id,
	table,
	titleTable,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit,
	shapesToUrl
}: {
	locations: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	shapesToUrl?: true;
}) {
	return (
		<ActualMap
			locations={locations}
			id={id}
			table={table}
			titleTable={titleTable}
			cluster={cluster}
			clusterRadius={clusterRadius}
			legend={legend}
			draw={draw}
			legendOmit={legendOmit}
			shapesToUrl={shapesToUrl}
		/>
	);
}
