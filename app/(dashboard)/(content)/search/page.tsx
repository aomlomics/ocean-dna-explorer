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
			<div className="grid grid-cols-1 gap-y-4 pt-4">
				{table && (
					<header className="flex items-start justify-between">
						<div>
							<h1 className="text-4xl font-normal text-base-content">
								<span className="">Search</span>{" "}
								<span className="text-base-content text-2xl align-middle font-normal">&gt;</span>{" "}
								<span className="text-primary font-normal">{TableMetadata[model].plural}</span>
							</h1>
						</div>
					</header>
				)}
				<div className="w-full space-y-4 text-base-content/80">
					<p>{TableMetadata[model].description}</p>
					<ExploreTabButtons activeTable={capitalizeTable(model)} tables={DataTableNames} />
				</div>

				<SearchUI />
			</div>

			<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
				<input key={model} defaultChecked={!!(params.circle || params.polygon)} type="checkbox" />
				<div className="collapse-title font-semibold">Show on Map</div>
				<div className="collapse-content text-sm px-50">
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
