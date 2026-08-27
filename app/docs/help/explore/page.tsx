import DocsPageSection from "@/app/components/docs/DocsPageSection";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Explore | Help",
	description: "Learn how to browse and filter tables with searches, views, and visualizations."
};

export default function HelpExplorePage() {
	return (
		<DocsPageSection
			page="help"
			section="explore"
			header={
				<>
					<p className="mb-4">
						The{" "}
						<Link className="link link-primary font-semibold" href="/explore">
							Explore
						</Link>{" "}
						pages let you browse and filter data within individual tables. Each table has its own dedicated Explore page
						with specialized filters and visualization options.
					</p>
					<p className="mb-4">Key features:</p>
					<ul className="list-disc ml-6 mb-4">
						<li>Quickly switch between different tables</li>
						<li>Apply filters or searches across all columns</li>
						<li>Explore results using a grid or list view</li>
						<li>Search within specific columns using the column header search inputs</li>
						<li>View individual Project, Sample, Taxonomy pages by clicking on individual records</li>
					</ul>
					<p className="mb-4">
						<strong>Note:</strong> Explore pages only filter data within the selected table. To query across multiple
						tables (e.g., find all taxonomies in a specific project), use the{" "}
						<Link className="link link-primary font-semibold" href="#search">
							Search
						</Link>{" "}
						page instead.
					</p>
				</>
			}
			subsections={[
				{
					id: "searching-on-explore",
					title: "Searching on Explore Pages",
					content: (
						<>
							<p className="mb-4">The Explore page has two search methods, controlled by two sets of controls:</p>
							<div className="mb-4">
								<h4>Search methods:</h4>
								<ul className="list-disc ml-6 mb-4">
									<li>Global search: Use the top search box to search across all columns in the current table.</li>
									<li>
										Column-specific search: Use the column header search input boxes to search within a specific field.
									</li>
								</ul>
							</div>
						</>
					)
				},
				{
					id: "projects",
					title: "Projects",
					content: (
						<>
							<p className="mb-4">
								Projects represent research initiatives or sampling campaigns. Each project contains multiple samples
								and at least one analysis.
							</p>
							<p className="mb-4">Key project information includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Project name and description</li>
								<li>Principal investigator and institution</li>
								<li>Temporal and geographic scope</li>
								<li>Associated samples, taxonomies, primers, and analyses</li>
							</ul>
							<p className="mb-4">
								<strong>Note:</strong> You can remove projects you have submitted. Removing a project will also remove
								any associated analyses.
							</p>
						</>
					)
				},
				{
					id: "samples",
					title: "Samples",
					content: (
						<>
							<p className="mb-4">
								Samples represent physical specimens or environmental samples collected during a project. They form the
								basis for subsequent analyses.
							</p>
							<p className="mb-4">Sample data typically includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Collection location and date</li>
								<li>Sample type and processing method</li>
								<li>Environmental context data</li>
								<li>Storage information</li>
							</ul>
						</>
					)
				},
				{
					id: "analyses",
					title: "Analyses",
					content: (
						<>
							<p className="mb-4">
								Analyses are bioinformatic processing runs that convert raw sequence data into occurrences (counts) of
								features (species), documenting all parameters and methods used.
							</p>
							<p className="mb-4">Important information about analyses:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Analyses are linked to projects</li>
								<li>You can add analyses to projects you did not submit</li>
								<li>You can see who the project belongs to when adding analyses</li>
								<li>You can view and remove your own analyses through the My Submissions Manager</li>
							</ul>
							<p className="mb-4">
								Analysis data includes information about the sequencing method, bioinformatic processing parameters, and
								taxonomic assignments.
							</p>
						</>
					)
				},
				{
					id: "features",
					title: "Features",
					content: (
						<>
							<p className="mb-4">
								Features represent unique DNA sequences (e.g., Amplicon Sequence Variants or ASVs) found in samples,
								typically representing distinct organisms.
							</p>
							<p className="mb-4">Each feature includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>A unique identifier</li>
								<li>The DNA sequence</li>
								<li>Sequence length information</li>
								<li>Consensus taxonomic classification</li>
								<li>Prevalence across samples</li>
							</ul>
							<p className="mb-4">
								Features provide the foundation for taxonomic classification and biodiversity assessment.
							</p>
						</>
					)
				},
				{
					id: "taxonomies",
					title: "Taxonomies",
					content: (
						<>
							<p className="mb-4">
								Taxonomies show the biological classification of organisms identified in your samples, from domain to
								species level.
							</p>
							<p className="mb-4">
								The taxonomic outline image is sourced through{" "}
								<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
									PhyloPic
								</Link>
								, using{" "}
								<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
									GBIF
								</Link>{" "}
								Suggest API to match our taxonomy with PhyloPic&apos;s database. Images on PhyloPic are contributed by
								scientists and artists worldwide under various Creative Commons licenses.
							</p>
							<p className="mb-4">If no image is displayed for a taxonomy, it could be due to:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>The taxonomy is unregistered in reference databases</li>
								<li>The taxonomy is a CLADE designation</li>
								<li>PhyloPic does not have an image for that taxonomy</li>
								<li>GBIF Suggest API did not return a matching taxonomy</li>
							</ul>
							<p className="mb-4">
								On taxonomy Explore pages, GBIF occurrence photos are also fetched when available. Some images may
								include deceased strandings or museum specimens, and a warning is shown before the image appears.
							</p>
						</>
					)
				}
			]}
		/>
	);
}
