import { Prisma } from "@/app/generated/prisma/client";
import { Suspense } from "react";
import DynamicMap from "./DynamicMap";
import { NullLocation } from "@/types/globals";

export default function Map({
	query,
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster,
	clusterRadius,
	draw,
	omit
}: {
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
	omit?: string[];
} & (
	| { query: () => Promise<NullLocation[]>; locations?: undefined }
	| { query?: undefined; locations: NullLocation[] }
)) {
	return (
		<Suspense
			fallback={
				<div className="w-full h-full flex justify-center items-center">
					<div className="h-full aspect-square p-30">
						<span className="loading loading-spinner loading-xl h-full w-full" />
					</div>
				</div>
			}
		>
			<SuspenseMap
				query={query}
				locations={locations}
				id={id}
				table={table}
				titleTable={titleTable}
				cluster={cluster}
				clusterRadius={clusterRadius}
				draw={draw}
				omit={omit}
			/>
		</Suspense>
	);
}

async function SuspenseMap({
	query,
	locations,
	id = "samp_name",
	table = "sample",
	titleTable,
	cluster,
	clusterRadius,
	draw,
	omit
}: {
	query?: () => Promise<NullLocation[]>;
	locations?: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	draw?: boolean;
	omit?: string[];
}) {
	if (locations) {
		return (
			<DynamicMap
				locations={locations}
				id={id}
				table={table}
				titleTable={titleTable}
				cluster={cluster}
				clusterRadius={clusterRadius}
				draw={draw}
				omit={omit}
			/>
		);
	} else if (query) {
		return (
			<DynamicMap
				locations={await query()}
				id={id}
				table={table}
				titleTable={titleTable}
				cluster={cluster}
				clusterRadius={clusterRadius}
				draw={draw}
				omit={omit}
			/>
		);
	}
}
