import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Map from "@/app/components/map/Map";
import TableDisplay from "@/app/components/paginated/TableDisplay";
import SearchUI from "@/app/components/search/SearchUI";
import { prisma } from "@/app/helpers/prisma";
import { parseApiQuery } from "@/app/helpers/queries";
import { getDataTableNameSafe } from "@/app/helpers/schema";
import { capitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import InfoButton from "@/app/components/InfoButton";
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
	const titleField = TableMetadata[model].titleField;
	const uniqueKey = typeof titleField === "string" ? titleField : titleField.join(" / ");
	const infoText = `Unique Key: ${uniqueKey}\n${TableMetadata[model].description}`;
	const infoContent = (
		<div className="space-y-2">
			<div className="flex items-start gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-primary">
					<path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
				</svg>
				<p>
					<span className="font-semibold text-primary">Unique Key:</span>{" "}
					<span className="font-medium text-base-content">{uniqueKey}</span>
				</p>
			</div>
			<p>{TableMetadata[model].description}</p>
		</div>
	);

	return (
		<>
			<div className="py-4">
				{table && (
					<header className="flex items-start justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-4xl font-normal text-base-content">
								<span className="">Search</span>{" "}
								<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
								<span className="text-primary font-normal">{TableMetadata[model].plural}</span>
							</h1>
							<InfoButton infoText={infoText} infoContent={infoContent} dir="tooltip-right" className="translate-y-0.5" />
						</div>
					</header>
				)}
				<div className="mt-5 w-full text-base-content/80">
					<ExploreTabButtons activeTable={capitalizeTable(model)} tables={DataTableNames} />
				</div>

				<div className="mt-6">
					<SearchUI />
				</div>
			</div>

			<div className="collapse collapse-arrow mt-4.5 rounded-xl border border-base-300 bg-base-200/30 shadow-sm overflow-hidden">
				<input key={model} type="checkbox" />
				<div className="collapse-title relative py-2.5 px-4 text-base font-medium text-base-content overflow-hidden">
					<div className="z-10 flex items-center gap-2">
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
				<div className="collapse-content text-sm px-4 bg-base-100">
					<div className="overflow-hidden bg-base-200 aspect-video rounded-lg pb-3">
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

			<div className="mt-6" id="search-results">
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
