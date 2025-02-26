import { ReactNode } from "react";
import Link from "next/link";

// Define types for our content structure
export type Subsection = {
	id: string; // Used for anchor links and React keys
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
};

export type Section = {
	id: string;
	title: string;
	content: ReactNode;
	subsections?: Subsection[]; // Optional array of subsections
};

export const helpSections: Section[] = [
	{
		id: "node-overview",
		title: "NODE Overview",
		content: (
			<>
				<p className="mb-4">
					NODE (NOAA Ocean DNA Explorer) is a platform for exploring ocean DNA data. This help documentation will guide
					you through the various features and functionalities of the platform.
				</p>
				<p className="mb-4">
					Our goal is to make marine genomic data more accessible, interoperable, and usable for researchers,
					policymakers, and the public.
				</p>
			</>
		),
		subsections: [
			{
				id: "features-overview",
				title: "Features Overview",
				content: (
					<>
						<p className="mb-4">NODE provides several key features to help you work with marine genomic data:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Explore projects, samples, analyses, features, and taxonomies</li>
							<li>Search across datasets using powerful query capabilities</li>
							<li>Submit your own data in standardized formats</li>
							<li>Download and reuse existing datasets</li>
							<li>Visualize taxonomic information with integrated visualization tools</li>
						</ul>
					</>
				)
			},
			{
				id: "contact-us",
				title: "Contact Us, Report a Bug, Request a Feature",
				content: (
					<>
						<p className="mb-4">
							We welcome your feedback to improve NODE. If you encounter any issues or have suggestions for new
							features, please let us know.
						</p>
						<p className="mb-4">
							You can submit bug reports, feature requests, or general feedback through our GitHub issues page:
						</p>
						<p className="mb-4">
							<Link
								href="https://github.com/aomlomics/node/issues"
								className="text-primary hover:underline"
								target="_blank"
							>
								NODE GitHub Issues
							</Link>
						</p>
						<p className="mb-4">When reporting bugs, please include:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>A clear description of the issue</li>
							<li>Steps to reproduce the problem</li>
							<li>What you expected to happen</li>
							<li>What actually happened</li>
							<li>Screenshots if applicable</li>
						</ul>
					</>
				)
			}
		]
	},
	{
		id: "explore",
		title: "Explore",
		content: (
			<>
				<p className="mb-4">
					The Explore section allows you to browse through different categories of data in the NODE platform. Each
					category provides specific views and functionality for different types of information.
				</p>
			</>
		),
		subsections: [
			{
				id: "projects",
				title: "Projects",
				content: (
					<>
						<p className="mb-4">
							Projects represent research initiatives or sampling campaigns. Each project contains multiple samples and
							may have associated analyses.
						</p>
						<p className="mb-4">Key project information includes:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Project name and description</li>
							<li>Principal investigator and collaborators</li>
							<li>Temporal and geographic scope</li>
							<li>Associated samples and analyses</li>
						</ul>
						<p className="mb-4">
							<strong>Note:</strong> You can remove projects you have submitted. Removing a project will also remove any
							associated analyses.
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
							Analyses represent the results of processing samples through various methods such as DNA sequencing, PCR,
							or other molecular techniques.
						</p>
						<p className="mb-4">Important information about analyses:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Analyses are linked to projects</li>
							<li>You can add analyses to projects you did not submit</li>
							<li>You can see who the project belongs to when adding analyses</li>
							<li>You can view and remove your own analyses through the My Submissions Manager</li>
						</ul>
						<p className="mb-4">
							Analysis data typically includes information about the sequencing method, bioinformatic processing, and
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
							Suggest API to match our taxonomy with PhyloPic's database. Images on PhyloPic are contributed by
							scientists and artists worldwide under various Creative Commons licenses.
						</p>
						<p className="mb-4">If no image is displayed for a taxonomy, it could be due to:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>The taxonomy is unregistered in reference databases</li>
							<li>The taxonomy is a CLADE designation</li>
							<li>PhyloPic does not have an image for that taxonomy</li>
							<li>GBIF Suggest API did not return a matching taxonomy</li>
						</ul>
					</>
				)
			}
		]
	},
	{
		id: "search",
		title: "Search",
		content: (
			<>
				<p className="mb-4">
					NODE's search functionality allows you to find specific data across all categories in the platform. You can
					search by various parameters to narrow down results.
				</p>
			</>
		),
		subsections: [
			{
				id: "basic-usage",
				title: "Basic Usage",
				content: (
					<>
						<p className="mb-4">To perform a basic search:</p>
						<ol className="list-decimal ml-6 mb-4">
							<li>Enter keywords in the search bar</li>
							<li>Select the category you want to search (Projects, Samples, etc.)</li>
							<li>Use filters to narrow down results</li>
							<li>Review the matching results</li>
						</ol>
						<p className="mb-4">
							The search function looks for matches in titles, descriptions, metadata, and other relevant fields.
						</p>
					</>
				)
			},
			{
				id: "query-recipes",
				title: "Query Recipes (examples)",
				content: (
					<>
						<p className="mb-4">Here are some example queries to help you get started:</p>
						<div className="mb-6">
							<h4 className="font-medium mb-2">Find all samples from a specific location:</h4>
							<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">location:"Gulf of Mexico"</div>
						</div>
						<div className="mb-6">
							<h4 className="font-medium mb-2">Find projects containing a specific species:</h4>
							<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">taxonomy:"Salmonidae"</div>
						</div>
						<div className="mb-6">
							<h4 className="font-medium mb-2">Find analyses from a specific date range:</h4>
							<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">date:[2020-01-01 TO 2022-12-31]</div>
						</div>
						<div className="mb-6">
							<h4 className="font-medium mb-2">Combine multiple search terms:</h4>
							<div className="bg-base-200 p-3 rounded-md font-mono text-sm mb-4">
								location:"Atlantic Ocean" AND taxonomy:"Bacteria"
							</div>
						</div>
					</>
				)
			}
		]
	},
	{
		id: "submit",
		title: "Submit",
		content: (
			<>
				<p className="mb-4">
					The Submit section allows you to contribute your own data to the NODE platform. You can submit projects and
					analyses to share with the scientific community.
				</p>
			</>
		),
		subsections: [
			{
				id: "data-format-rationale",
				title: "Data Format Rationale",
				content: (
					<>
						<p className="mb-4">
							NODE follows community standards to ensure data quality, interoperability, and usability. Our data formats
							are designed with the following principles in mind:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Darwin Core (DwC) for biodiversity data</li>
							<li>FAIR principles (Findable, Accessible, Interoperable, Reusable)</li>
							<li>Other relevant community standards</li>
						</ul>
						<p className="mb-4">
							Standardized formats ensure that your data can be easily discovered, understood, and reused by other
							researchers.
						</p>
					</>
				)
			},
			{
				id: "submissions-manager",
				title: "My Submissions Manager",
				content: (
					<>
						<p className="mb-4">
							The My Submissions Manager allows you to view, manage, and track your submitted data.
						</p>
						<p className="mb-4">
							<strong>Note:</strong> You must be signed in to access the My Submissions Manager.
						</p>
						<p className="mb-4">From the My Submissions Manager, you can:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>View your submitted projects and analyses</li>
							<li>Check submission status</li>
							<li>Edit or update submissions</li>
							<li>Remove your submissions</li>
						</ul>
					</>
				)
			},
			{
				id: "project-submissions",
				title: "Project Submissions",
				content: (
					<>
						<p className="mb-4">
							To submit a project, you'll need to prepare a metadata file following our template format.
						</p>
						<p className="mb-4">The project submission process includes:</p>
						<ol className="list-decimal ml-6 mb-4">
							<li>Preparing your project metadata</li>
							<li>Filling out the submission form</li>
							<li>Uploading your metadata file</li>
							<li>Reviewing and confirming your submission</li>
						</ol>
						<p className="mb-4">
							Required fields include project name, description, principal investigator, and collection dates.
						</p>
						<p className="mb-4">All files must be in TSV format and follow the template structure exactly.</p>
					</>
				)
			},
			{
				id: "analysis-submissions",
				title: "Analysis Submissions",
				content: (
					<>
						<p className="mb-4">
							Analysis submissions require information about the analysis methods, results, and associated project.
						</p>
						<p className="mb-4">The analysis submission process includes:</p>
						<ol className="list-decimal ml-6 mb-4">
							<li>Selecting the associated project</li>
							<li>Preparing your analysis data files</li>
							<li>Filling out the analysis metadata form</li>
							<li>Uploading your files</li>
							<li>Reviewing and confirming your submission</li>
						</ol>
						<p className="mb-4">
							Required fields include analysis type, sequencing method, and bioinformatic processing details.
						</p>
						<p className="mb-4">All files must be in TSV format and follow the template structure exactly.</p>
					</>
				)
			}
		]
	},
	{
		id: "faq",
		title: "FAQ",
		content: (
			<>
				<div className="space-y-6">
					<p className="mb-4">Frequently asked questions about using the NODE platform.</p>

					<div>
						<h4 className="font-medium mb-2">Q: Why are zebras striped?</h4>
						<p>
							A: While scientists have been debating this for years, the most widely accepted theory is that zebra
							stripes help deter biting flies like horse flies that can spread disease. The stripes may also help with
							thermoregulation and social recognition among zebras.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: Who can submit data to NODE?</h4>
						<p>
							A: NODE is open to submissions from researchers, government agencies, NGOs, and other organizations
							working with marine genomic data. You need to create an account to submit data.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: Can I download the entire database?</h4>
						<p>
							A: While individual datasets can be downloaded, we currently don't provide a bulk download of the entire
							database. For large-scale data access, please contact us to discuss your needs.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I cite data from NODE?</h4>
						<p>
							A: Each project and analysis has a recommended citation format provided on its page. Please use these
							citations to properly acknowledge the data contributors.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: What browsers are supported?</h4>
						<p>
							A: NODE works best with modern browsers like Chrome, Firefox, Safari, and Edge. We recommend keeping your
							browser updated to the latest version.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How secure is my submitted data?</h4>
						<p>
							A: All data transfer is encrypted using HTTPS. Your account information is secured, and you control the
							visibility of your submitted data.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: Why can't I see my submission immediately?</h4>
						<p>
							A: Submissions go through a brief validation process to ensure data quality and integrity. Most
							submissions are processed within 24-48 hours.
						</p>
					</div>
				</div>
			</>
		)
	}
];
