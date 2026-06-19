import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Map from "@/app/components/map/Map";
import TableDisplay from "@/app/components/paginated/TableDisplay";
import SearchUI from "@/app/components/search/SearchUI";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { getDataTableNameSafe } from "@/app/helpers/schema";
import { capitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import { redirect } from "next/navigation";

export default async function Search({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const table = params.table;
	if (!table || typeof table !== "string") {
		redirect("/search?table=project");
	}
	const model = getDataTableNameSafe(table);
	if (!model) {
		redirect("/search?table=project");
	}

	return (
		<>
			<div className="py-4">
				{table && (
					<header className="flex items-start justify-between">
						<h1 className="text-4xl font-normal text-base-content">
							<span className="">Search</span>{" "}
							<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
							<span className="text-primary font-normal">{TableMetadata[model].plural}</span>
						</h1>
					</header>
				)}
				<div className="w-full space-y-6 text-base-content/80">
					<p>{TableMetadata[model].description}</p>
					<ExploreTabButtons activeTable={capitalizeTable(model)} tables={DataTableNames} />
				</div>

				<div className="mt-8">
					<SearchUI />
				</div>
			</div>

			<div className="collapse collapse-arrow mt-8 rounded-xl border border-base-300 bg-base-200/30 shadow-sm overflow-hidden">
				<input key={model} type="checkbox" />
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content overflow-hidden">
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 200 40"
						className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 w-full text-primary/18"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
					>
						<path d="M-4 9c20 0 18-5 36-5s16 4 33 4 17-4 35-4 16 5 34 5 18-4 36-4" />
						<path d="M-6 15c16 0 15-3 30-3s14 3 29 3 16-3 31-3 14 3 30 3 15-3 31-3 14 3 29 3" />
						<path d="M-2 23c18 0 17-4 34-4s16 4 33 4 15-4 32-4 15 4 31 4 16-4 33-4" />
						<path d="M-5 30c22 0 20-5 40-5s18 5 37 5 17-5 36-5 17 5 36 5 19-5 38-5" />
					</svg>
					<div className="relative z-10 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.9}
							stroke="currentColor"
							className="size-5 text-primary"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
							/>
						</svg>
						<span>Show on Map</span>
					</div>
				</div>
				<div className="collapse-content text-sm px-4 pb-3 bg-base-100">
					<div className="overflow-hidden bg-base-200 aspect-video rounded-lg">
						<Map
							key={model}
							query={async () => {
								const urlParams = new URLSearchParams();
								for (const [key, val] of Object.entries(params)) {
									if (val != null && key !== "table") {
										if (Array.isArray(val)) {
											for (const v of val) {
												urlParams.append(key, v);
											}
										} else {
											urlParams.set(key, val);
										}
									}
								}

								const { query, sampleWhere } = parseApiQuery(model, urlParams, { sampleWhere: true });
								return await prisma.sample.findMany({
									where: model === "sample" ? query.where : sampleWhere
								});
							}}
							legend
							draw
							shapesToUrl
							cluster
							disableSearch
						/>
					</div>
				</div>
			</div>

			<div className="mt-8" id="search-results">
				<h2 className="text-xl mb-2">
					Showing all{" "}
					{table && TableMetadata[model] ? (
						<span className="text-primary font-bold">{TableMetadata[model].plural}</span>
					) : (
						"results"
					)}{" "}
					that match your search
				</h2>

				<div className="w-full">
					<TableDisplay
						key={model}
						table={model}
						displayMode={model === "taxonomy" ? "grid" : "table"}
						ignoreParams={["table"]}
						toggle={model === "taxonomy" || undefined}
					/>
				</div>
			</div>
		</>
	);
}
