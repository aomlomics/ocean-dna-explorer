import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import Link from "next/link";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import { TaxonomicRanks } from "@/types/objects";

export default async function Taxonomy() {
	const tableConfig: FilterConfig[] = [
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomy"
		}
	];
	return (
		<ExplorePage table="taxonomy" tableConfig={tableConfig} title="Taxonomies" displayMode="grid">
			<div className="w-full space-y-4">
				<div className="text-base-content/80 pb-4 space-y-2">
					<p>
						Hierarchical classification of detected organisms from domain to species level. For more detailed
						information, visit our{" "}
						<Link href="/help" className="text-primary hover-underline">
							Help page
						</Link>
						.
					</p>
					<p className="text-sm">
						The taxonomic outline images are sourced through{" "}
						<Link href="https://www.phylopic.org/" className="text-primary hover-underline" target="_blank">
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
