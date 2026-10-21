import DocsPageSection from "@/app/components/docs/DocsPageSection";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Visualize | Help",
	description: "Learn what each Visualize chart shows: sample metadata scatter plots, taxonomy graphs, and alpha diversity."
};

export default function HelpVisualizePage() {
	return (
		<DocsPageSection
			page="help"
			section="visualize"
			header={
				<>
					<p className="mb-4">
						The{" "}
						<Link className="link link-primary font-semibold" href="/visualize/metadata">
							Visualize
						</Link>{" "}
						pages chart a filtered dataset in the browser. Use the same query builder as{" "}
						<Link className="link link-primary font-semibold" href="/docs/help/search">
							Search
						</Link>
						, then pick a chart tab: Sample Metadata, Taxonomy, or Alpha Diversity.
					</p>
					<p className="mb-4">
						Charts follow the Trusted toggle. Trusted data uses reviewed analyses only. All data includes unreviewed
						analyses too.{" "}
						<Link className="link link-primary" href="/docs/help/overview#trusted-vs-untrusted-data">
							Trusted vs Untrusted Data
						</Link>{" "}
						covers that switch.
					</p>
				</>
			}
			subsections={[
				{
					id: "using-visualize",
					title: "How to Use Visualize",
					content: (
						<>
							<ol className="list-decimal ml-6 mb-4">
								<li>
									Open{" "}
									<Link className="link link-primary" href="/visualize/metadata">
										Visualize
									</Link>{" "}
									and choose a tab
								</li>
								<li>Filter the input data with the query builder. You do not pick a results table here.</li>
								<li>Set the chart options: axes, taxonomic rank, grouping, and similar controls on that chart</li>
								<li>Pan and zoom on scatter plots and stacked bars. Copy a PNG of the current chart with the copy button.</li>
							</ol>
						</>
					)
				},
				{
					id: "sample-metadata",
					title: "Sample Metadata",
					content: (
						<>
							<p className="mb-4">
								A{" "}
								<Link className="link link-primary" href="/visualize/metadata">
									scatter plot
								</Link>{" "}
								of sample fields. Put a numeric or date field on each axis (collection date, depth, temperature, and
								other sample attributes, including user-defined fields). Color the points by a third field, usually
								project.
							</p>
							<p className="mb-4">
								Use it to look at the sampling design itself: depth against date, temperature against another measured
								field, and similar comparisons.
							</p>
						</>
					)
				},
				{
					id: "taxonomy-charts",
					title: "Taxonomy",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/visualize/taxonomy?chart=abundance">
									Taxonomy
								</Link>{" "}
								charts are built from the occurrences in your filtered assignments. Choose a chart type from the tabs
								under Taxonomy.
							</p>
							<ol className="list-decimal ml-6 mb-4">
								<li>
									<strong>Relative Abundance.</strong> Stacked bars of taxa at a rank. One bar per library, or averaged
									by a sample field. Switch between raw counts and percent composition.
								</li>
								<li>
									<strong>Sample Abundance.</strong> A scatter plot of one sample field against the relative abundance
									of a taxon you pick.
								</li>
								<li>
									<strong>Treemap.</strong> Nested rectangles. A parent rank groups the blocks; a child rank fills them.
									Size is abundance.
								</li>
								<li>
									<strong>Prevalence Histogram.</strong> How widespread taxa are. The X axis is the number of samples a
									taxon was found in. The Y axis is how many taxa have that count.
								</li>
								<li>
									<strong>Sample Heatmap.</strong> Taxa versus samples. Color is abundance. Shows the most widespread
									taxa.
								</li>
								<li>
									<strong>Composition Explorer.</strong> The community as a whole, not per sample:
									<ol className="list-decimal ml-6 !my-0">
										<li>
											<strong>Bar.</strong> Top taxa at a rank, as percent of the dataset
										</li>
										<li>
											<strong>Lollipop.</strong> The same ranking, drawn as lines with dots
										</li>
										<li>
											<strong>Sunburst.</strong> Two ranks as concentric rings
										</li>
									</ol>
								</li>
								<li>
									<strong>Dark Taxa.</strong> Assignments below a percent-identity cutoff you set. A sunburst of those
									taxa, plus a table of feature count, sample count, abundance, and identity distribution.
								</li>
							</ol>
						</>
					)
				},
				{
					id: "alpha-diversity",
					title: "Alpha Diversity",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/visualize/alphaDiversity">
									Alpha diversity
								</Link>{" "}
								is a box-and-whisker plot of diversity metrics computed on the server from your current filters. Pick a
								metric, group samples on the X axis by a sample field, and optionally split the boxes by a second field
								(hue). You can overlay the individual points.
							</p>
							<p className="mb-4">
								Use it to compare diversity across habitats, projects, or other sample metadata.
							</p>
						</>
					)
				}
			]}
		/>
	);
}
