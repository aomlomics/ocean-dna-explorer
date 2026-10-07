import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import SearchUI from "@/app/components/search/SearchUI";
import { getDataTableNameSafe } from "@/app/helpers/schema";
import { capitalizeTable } from "@/app/helpers/utils";
import TableMetadata from "@/types/tableMetadata";
import TableInfo from "@/app/components/TableInfo";
import { TableIcon } from "@/app/components/icons";
import SearchContent from "@/app/components/search/SearchContent";
import { redirect } from "next/navigation";
import { trustedPrisma } from "@/app/helpers/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Search",
	description: "Search eDNA data with a powerful query builder, map-based shape filtering, and BLAST sequence searches."
};

export default async function Search({
	searchParams
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	let table;
	if (params.table && typeof params.table == "string") {
		table = getDataTableNameSafe(params.table);
	}
	if (!table) {
		redirect("/search?table=project");
	}

	const assays = await trustedPrisma.assay.findMany({
		where: {
			Analyses: {
				some: {}
			}
		},
		select: {
			assay_name: true
		}
	});

	return (
		<>
			<div className="min-w-0 py-4">
				{table && (
					<header className="flex items-start justify-between">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="flex flex-wrap items-center gap-2 text-4xl font-normal text-base-content">
								<span>Search</span>
								<span className="text-base-content text-2xl font-normal">❯</span>
								<span className="inline-flex items-center gap-2 text-primary font-normal">
									<TableIcon table={table} className="size-8!" />
									{TableMetadata[table].plural}
								</span>
							</h1>
							<TableInfo table={table} />
						</div>
					</header>
				)}
				<div className="mt-5 w-full text-base-content/80">
					<ExploreTabButtons activeTable={capitalizeTable(table)} />
				</div>

				<div className="mt-6">
					<SearchUI />
				</div>
			</div>

			<SearchContent table={table} assayNames={assays.map((a) => a.assay_name)} />
		</>
	);
}
