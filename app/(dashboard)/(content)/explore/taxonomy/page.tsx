import ExploreSearch from "@/app/components/explore/ExploreSearch";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import TaxaGrid from "@/app/components/paginated/TaxaGrid";
import { TaxonomyScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { TaxonomicRanks } from "@/types/objects";
import Link from "next/link";

export default async function Taxonomy() {
	return (
		<div className="grid grid-cols-[300px_1fr] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						type: "selectGroup",
						group: TaxonomicRanks,
						table: "taxonomy"
					}
				]}
			/>
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-6 mb-6 space-y-4">
						<p className="leading-relaxed">
							Hierarchical classification of detected organisms from domain to species level.
						</p>
						<p className="text-base-content/80 leading-relaxed">
							The taxonomic outline image is sourced through{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							, using{" "}
							<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
								GBIF
							</Link>{" "}
							Suggest API to match our taxonomy with PhyloPic's database. Images on PhyloPic are contributed by
							scientists and artists worldwide under various Creative Commons licenses.
						</p>
						<p className="leading-relaxed">
							For more detailed information, visit our{" "}
							<Link href="/help" className="text-primary hover:underline">
								Help page
							</Link>
							.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<ExploreSearch
						table="taxonomy"
						fieldOptions={TaxonomyScalarFieldEnumSchema._def.values}
						defaultField="taxonomy"
					/>

					<div className="bg-base-100 rounded-lg border border-base-300">
						<TaxaGrid />
					</div>
				</div>
			</div>
		</div>
	);
}
