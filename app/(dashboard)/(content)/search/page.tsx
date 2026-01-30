import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import SearchMap from "@/app/components/map/SearchMap";
import SearchResults from "@/app/components/search/SearchResults";
import SearchUI from "@/app/components/search/SearchUI";
import { capitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { DataTableNames, TableNames } from "@/types/tableMetadata";
import { redirect } from "next/navigation";

export default async function SearchLayout({
	searchParams
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { table } = await searchParams;
	if (!table || typeof table !== "string") {
		redirect("/search?table=project");
	}
	const model = TableNames.find((t) => t.toLowerCase() === table.toLowerCase());
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
			<SearchMap />
			<div className="mt-6" id="search-results">
				<SearchResults />
			</div>
		</>
	);
}
