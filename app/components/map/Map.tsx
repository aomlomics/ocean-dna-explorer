"use client";

import { Prisma } from "@/app/generated/prisma/client";
import dynamic from "next/dynamic";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function Map({
	locations,
	id = "samp_name",
	titleTable,
	iconSize,
	table = "sample",
	legend,
	cluster = false,
	draw = false
}: {
	locations: {
		decimalLatitude: number | null;
		decimalLongitude: number | null;
		[key: string]: any;
	}[];
	id?: string;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	iconSize?: number;
	table?: Uncapitalize<Prisma.ModelName>;
	legend?: Record<string, string>;
	cluster?: boolean;
	draw?: boolean;
}) {
	return (
		<ActualMap
			locations={locations}
			id={id}
			titleTable={titleTable}
			iconSize={iconSize}
			table={table}
			legend={legend}
			cluster={cluster}
			draw={draw}
		/>
	);
}
