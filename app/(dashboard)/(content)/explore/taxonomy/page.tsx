import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Link from "next/link";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import { TaxonomicRanks } from "@/types/objects";
import TableMetadata from "@/types/tableMetadata";

export default async function Taxonomy() {
	const tableConfig: FilterConfig[] = [
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomy"
		}
	];
	return (
		<ExplorePage table="taxonomy" tableConfig={tableConfig} displayMode="grid">
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>{TableMetadata.taxonomy.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
					<p className="text-sm">
						The taxonomic outline images are sourced through{" "}
						<Link href="https://www.phylopic.org/" className="link link-primary link-hover" target="_blank">
							PhyloPic
						</Link>
						. The images are contributed by scientists and artists worldwide under various Creative Commons licenses.
					</p>
				</div>
				<ExploreTabButtons />
			</div>
		</ExplorePage>
	);
}
