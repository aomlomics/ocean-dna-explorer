import { Prisma } from "@/app/generated/prisma/client";
import { Suspense } from "react";
import DynamicMap from "./DynamicMap";
import { NullLocation } from "@/types/globals";

export default function Map({
	query,
	locations,
	id,
	table,
	titleTable,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit,
	className = ""
}: {
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
	className?: string;
} & (
	| { query: () => Promise<NullLocation[]>; locations?: undefined }
	| { query?: undefined; locations: NullLocation[] }
)) {
	return (
		<div
			className={`overflow-hidden [:where(&)]:bg-base-200 [:where(&)]:aspect-video [:where(&)]:rounded-lg ${className}`}
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
					id={id}
					table={table}
					titleTable={titleTable}
					cluster={cluster}
					clusterRadius={clusterRadius}
					legend={legend}
					draw={draw}
					legendOmit={legendOmit}
				/>
			</Suspense>
		</div>
	);
}

async function SuspenseMap({
	query,
	locations,
	id,
	table,
	titleTable,
	cluster,
	clusterRadius,
	legend,
	draw,
	legendOmit
}: {
	query?: () => Promise<NullLocation[]>;
	locations?: NullLocation[];
	id?: string;
	table?: Uncapitalize<Prisma.ModelName>;
	titleTable?: Uncapitalize<Prisma.ModelName>;
	cluster?: boolean;
	clusterRadius?: number;
	legend?: boolean;
	draw?: boolean;
	legendOmit?: string[];
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
				legend={legend}
				draw={draw}
				legendOmit={legendOmit}
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
				legend={legend}
				draw={draw}
				legendOmit={legendOmit}
			/>
		);
	}
}
