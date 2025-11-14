"use client";

import { Prisma } from "@/app/generated/prisma/client";
import { NullLocation } from "@/types/globals";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function DynamicMap({
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster,
	clusterRadius,
	draw,
	omit
}: {
	locations: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
	omit?: string[];
}) {
	return (
		<ActualMap
			locations={locations}
			id={id}
			table={table}
			titleTable={titleTable}
			cluster={cluster}
			clusterRadius={clusterRadius}
			draw={draw}
			omit={omit || []}
		/>
	);
}
