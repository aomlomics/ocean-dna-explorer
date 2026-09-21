import DocsPageSection from "@/app/components/docs/DocsPageSection";
import { TrustedShieldIcon } from "@/app/components/home/HomeTrustedIndicator";
import Link from "next/link";
import type { Metadata } from "next";

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
								<li>Open a record by clicking a row</li>
					</ul>
					<p className="mb-4">
						<strong>Note:</strong> Explore pages only filter data within the selected table. To query across multiple
						tables (e.g., find all taxonomies in a specific project), use the{" "}
						<Link className="link link-primary font-semibold" href="/docs/help/search">
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
							<ul className="list-disc ml-6 mb-4">
									<li>Global search: Use the top search box to search across all columns in the current table.</li>
									<li>
										Column-specific search: Use the column header search input boxes to search within a specific field.
									</li>
								</ul>
						</>
					)
				},
				{
					id: "projects",
					title: "Projects",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/project">
									Projects
								</Link>{" "}
								represent research initiatives or sampling campaigns. Each project contains multiple samples and at
								least one analysis. Projects and analyses are the two things you can submit. The submitter can add other users to the project. Everyone added needs the
								Contributor role, and those people can then upload analyses of that project&apos;s data.
							</p>
							<p className="mb-4">
								To submit a project, go to the{" "}
								<Link className="link link-primary" href="/submit/project">
									Submit
								</Link>{" "}
								page and send that form to the ODE team.
							</p>
							<p className="mb-4">Key project information includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Project name and description</li>
								<li>Principal investigator and institution</li>
								<li>Temporal and geographic scope</li>
								<li>Associated samples, taxonomies, primers, and analyses</li>
							</ul>
							<p className="mb-4">
								The project page shows a cover photo when one was uploaded, downloads for the metadata files, and counts
								for samples, analyses, taxonomies, and occurrences. Those counts open in Search. The page also has a map
								of the samples, depth coverage, the assays in the project, and the top two taxonomies for each assay.
							</p>
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
								<Link className="link link-primary" href="/explore/sample">
									Samples
								</Link>{" "}
								represent physical specimens or environmental samples collected during a project. They form the basis
								for subsequent analyses.
							</p>
							<p className="mb-4">Sample data typically includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Collection location and date</li>
								<li>Sample type and processing method</li>
								<li>Environmental context data</li>
								<li>Storage information</li>
							</ul>
							<p className="mb-4">
								The sample page links to its project and shows that sample on a map. It lists the assays and analyses
								used on the sample, plus the occurrence count and taxonomy count. Below that is a chart of the
								taxonomies found in the sample. Location on the page uses the sample coordinates.
							</p>
						</>
					)
				},
				{
					id: "assays",
					title: "Assays",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/assay">
									Assays
								</Link>{" "}
								are the molecular targets and primer sets used to amplify DNA from samples. Assay names come from a
								pre-approved list in the{" "}
								<Link
									className="link link-primary"
									href="https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays"
									target="_blank"
								>
									NOAA Omics metabarcoding assays repository
								</Link>
								. If the forward and reverse primers match an assay already on that list, the{" "}
								<Link className="link link-primary" href="/docs/help/submit#project-submissions">
									project submission
								</Link>{" "}
								form tells you it is switching your assay name in the submission to the assay name from that table.
							</p>
							<p className="mb-4">Each assay includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Assay name and target gene</li>
								<li>Forward and reverse primer names and sequences</li>
								<li>Primer references and expected amplicon size</li>
							</ul>
							<p className="mb-4">
								The assay page shows a map of samples that used the assay, and a primer diagram for the forward and
								reverse primers, including primer reference links. Counts cover samples, libraries, and taxonomies.
								Tables at the bottom list the libraries and analyses for that assay.
							</p>
						</>
					)
				},
				{
					id: "assay-preps",
					title: "AssayPreps",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/assayPrep">
									AssayPreps
								</Link>{" "}
								are the lab protocol used to run an assay on a project: the instruments, reagents, and PCR conditions.
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Thermocycler</li>
								<li>PCR conditions and cycle count</li>
								<li>Primer volumes and concentrations</li>
							</ul>
							<p className="mb-4">The AssayPrep page links to that assay and that project.</p>
						</>
					)
				},
				{
					id: "libraries",
					title: "Libraries",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/library">
									Libraries
								</Link>{" "}
								are the prepared sequencing material for one sample and one assay, plus the run that sequenced it.
							</p>
							<p className="mb-4">Library data includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>The sample and assay</li>
								<li>Sequencing platform, instrument, and kit</li>
								<li>Library layout and input read count</li>
							</ul>
							<p className="mb-4">
								The library page links to that sample, that assay, and that project, and shows the rest of the library
								metadata beside those links.
							</p>
						</>
					)
				},
				{
					id: "analyses",
					title: "Analyses",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/analysis">
									Analyses
								</Link>{" "}
								are bioinformatic processing runs that convert raw sequence data into occurrences (counts) of features
								(species), documenting all parameters and methods used. Projects and analyses are the two things you can
								submit. You can submit an analysis on its own to an existing project if you have the Contributor role
								and someone on that project has added you.
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Analyses are linked to projects</li>
								<li>You can see who the project belongs to when adding analyses</li>
								<li>You can view and remove your own analyses through the My Submissions Manager</li>
							</ul>
							<p className="mb-4">
								A trusted analysis has a checkmark in the trusted column on Explore &gt; Analyses. An analysis is the
								record that is trusted or untrusted. That changes the data shown across the site, including on the other
								Explore tables, because samples, occurrences, taxonomies, and the rest are tied to those analyses.
							</p>
							<p className="mb-4">
								<TrustedShieldIcon
									trusted
									className="mr-1.5 inline-block h-6 w-6 fill-current align-[-0.2em] text-white [html[data-theme='light']_&]:text-base-content"
								/>
								The shield in the header, and the menu in the bottom-left, switches between trusted data and all data.
								Trusted data shows only reviewed analyses. All data includes unreviewed analyses too. Maps, counts,
								charts, Search, and Explore rows follow that switch.{" "}
								<Link className="link link-primary" href="/docs/help/overview#trusted-vs-untrusted-data">
									Trusted vs Untrusted Data
								</Link>{" "}
								covers it in more detail.
							</p>
							<p className="mb-4">
								Analysis data includes information about the sequencing method, bioinformatic processing parameters, and
								taxonomic assignments.
							</p>
							<p className="mb-4">
								The analysis page links to its project. It includes
								file downloads, a map of the samples in the run, the assay used, and counts for occurrences, assignments,
								and samples. Below that are the taxonomies, assignments, a taxonomy chart, and alpha diversity.
							</p>
						</>
					)
				},
				{
					id: "occurrences",
					title: "Occurrences",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/occurrence">
									Occurrences
								</Link>{" "}
								are individual detection records: how many times a feature was counted in one library, from one analysis.
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Tied to a project, analysis, library, and feature</li>
								<li>
									The count is stored as <code className="font-mono">organismQuantity</code>
								</li>
							</ul>
							<p className="mb-4">
								The occurrence page links to the feature, library, analysis, and project. It shows the sample on a map,
								the assay, the assigned taxonomy and its outline image, the DNA sequence, and the sequence count.
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
								<Link className="link link-primary" href="/explore/feature">
									Features
								</Link>{" "}
								represent unique DNA sequences (e.g., Amplicon Sequence Variants or ASVs) found in samples, typically
								representing distinct organisms.
							</p>
							<p className="mb-4">Each feature includes:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>A unique identifier</li>
								<li>The DNA sequence</li>
								<li>Sequence length information</li>
								<li>Top taxonomies, ranked by how many assignments match each one</li>
								<li>Prevalence across samples</li>
							</ul>
							<p className="mb-4">
								The feature page shows the DNA sequence, its length, and GC content, plus a map of samples where that
								sequence was found. It also lists the assays that produced the feature. Tables below list the analyses,
								occurrences, and assignments.
							</p>
						</>
					)
				},
				{
					id: "assignments",
					title: "Assignments",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="/explore/assignment">
									Assignments
								</Link>{" "}
								are the taxonomic call for a feature in one analysis.
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>The feature and the taxonomy it was assigned to</li>
								<li>
									The confidence of that call, shown as a percent (<code className="font-mono">Confidence</code>)
								</li>
							</ul>
							<p className="mb-4">
								The page links to that feature, taxonomy, and analysis. The identifier is{" "}
								<code className="font-mono">analysis_run_name</code> plus <code className="font-mono">featureid</code>.
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
								<Link className="link link-primary" href="/explore/taxonomy">
									Taxonomies
								</Link>{" "}
								show the biological classification of organisms identified in your samples, from domain to species
								level.
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
								On taxonomy Explore pages, GBIF occurrence photos are also available for family, genus, and species. Some
								images may include deceased strandings or museum specimens, and a warning is shown before the image
								appears. A Spotlight image can be shown when one has been added.
							</p>
							<p className="mb-4">
								The page lists the ranks from domain to species, maps the samples where the taxonomy was found, and
								shows Red List status when GBIF has it. Counts cover analyses and samples, and a link finds other
								features with this taxonomy.
							</p>
						</>
					)
				}
			]}
		/>
	);
}
