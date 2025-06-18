"use client";

import { Prisma } from "@/app/generated/prisma/client";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function Map({
	locations,
	id,
	title,
	titleTable,
	iconSize,
	table,
	legend,
	cluster = false
}: {
	locations: {
		decimalLatitude: number | null;
		decimalLongitude: number | null;
		[key: string]: any;
	}[];
	id: string;
	title?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	iconSize?: number;
	table: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
}) {
	return (
		<ActualMap
			locations={locations}
			id={id}
			title={title}
			titleTable={titleTable}
			iconSize={iconSize}
			table={table}
			legend={legend}
			cluster={cluster}
		/>
	);
}
