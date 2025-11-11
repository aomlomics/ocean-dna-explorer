"use client";

import { Prisma } from "@/app/generated/prisma/client";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
const ActualMap = dynamic(() => import("@/app/components/map/ActualMap"), {
	ssr: false
});

export default function Map({
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster,
	clusterRadius,
	draw
}: {
	locations: {
		decimalLatitude: number | null;
		decimalLongitude: number | null;
		[key: string]: any;
	}[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
}) {
	const router = useRouter();

	return (
		<ActualMap
			key={router.asPath}
			locations={locations}
			id={id}
			table={table}
			titleTable={titleTable}
			cluster={cluster}
			clusterRadius={clusterRadius}
			draw={draw}
		/>
	);
}
