import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { TaxonomicRanks } from "@/types/objects";
import Link from "next/link";
import ExplorePage from "@/app/components/explore/ExplorePage";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import TaxaGrid from "@/app/components/paginated/TaxaGrid";

export default async function Taxonomy() {
	const tableConfig: FilterConfig[] = [
		{
			type: "selectGroup",
			group: TaxonomicRanks,
			table: "taxonomy"
		}
	];
	return (
		<ExplorePage table="taxonomy" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-6 space-y-4">
						<p className="leading-relaxed">
							Hierarchical classification of detected organisms from domain to species level.
						</p>
						<p className="text-base-content/80 leading-relaxed">
							The taxonomic outline images are sourced through{" "}
							<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
								PhyloPic
							</Link>
							. The images are contributed by scientists and artists worldwide under various Creative Commons licenses.
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

				<div className="flex justify-between items-center my-4 -mb-1">
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Taxonomies</span>
					</h1>
					<div className="lg:hidden">
						<label htmlFor="my-drawer" className="btn btn-primary drawer-button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								className="inline-block w-5 h-5 stroke-current"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
							</svg>
							Filter Options
						</label>
					</div>
				</div>
				<div className="hidden lg:block rounded-lg border border-base-300 lg:mt-6">
					<TaxaGrid />
				</div>

				<div className="lg:hidden">
					<TaxaGrid />
				</div>
			</div>
		</ExplorePage>
	);
}
