import { ReactNode } from "react";
import Link from "next/link";
import { AnalysisAsvTablePreview, AnalysisOccurrenceTablePreview } from "./DocExampleTables";
import WorkshopVideoCallout from "../WorkshopVideoCallout";
import { prisma } from "@/app/helpers/prisma";

// Define types for our content structure
export type Subsection = {
	id: string; // Used for anchor links and React keys
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
};

export type Section = {
	id: string;
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
	subsections?: Subsection[]; // Optional array of subsections
};

/** File icon for example TSV filenames. Pass className for size (e.g. size-14) and text-primary. */
function ExampleFileGlyph({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className ?? "size-6 shrink-0 text-primary"}
			aria-hidden
		>
			<path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
			<path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
		</svg>
	);
}

export async function getHelpSections() {
	const project = await prisma.project.findFirst({
		select: {
			project_id: true,
			Samples: {
				take: 1,
				select: {
					samp_name: true
				}
			}
		}
	});

	return [
		{
			id: "node-overview",
			title: "Overview",
			content: (
				<>
					<p className="mb-4">
						The Ocean DNA Explorer is a data portal and visualization platform for uploading and exploring marine eDNA
						data. This help documentation will guide you through the features of the site.
					</p>
					<p className="mb-4">
						Our goal is to make marine eDNA data more findable, accessible, interoperable, and reusable for researchers,
						policymakers, and to the public.
					</p>
				</>
			),
			subsections: [
				{
					id: "features-overview",
					title: "Features Overview",
					content: (
						<>
							<p className="mb-4">ODE's custom features are built specifically for eDNA data:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/explore">
										Explore
									</Link>{" "}
									projects, samples, analyses, features, and taxonomies with filters and a graphical user interface
								</li>
								<li>
									Leverage the{" "}
									<Link className="link link-primary font-semibold" href="/api">
										API
									</Link>{" "}
									to access data programmatically
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/search">
										Search
									</Link>{" "}
									across datasets using powerful query capabilities
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/visualize">
										Visualize
									</Link>{" "}
									data by making charts directly in your browser
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/learn">
										Learn
									</Link>{" "}
									about the eDNA data journey
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/submit">
										Submit
									</Link>{" "}
									your own data in standardized formats
								</li>
								<li>Download existing datasets via the API or individual Explore pages</li>
							</ul>
						</>
					)
				},
				{
					id: "login-and-roles",
					title: "Login and Roles",
					content: (
						<>
							<p className="mb-4">
								ODE requires login to access certain features of the platform, like submitting data.
							</p>
							<p className="mb-4">
								You can login using the Sign-In button in the top right corner of the website. Your personal data is not
								stored in our database. Authentication is handled by Clerk, a user management platform. You can delete
								your account by clicking your profile picture in the top right corner of the website, then clicking
								Manage Account &gt; Security &gt; Delete Account.
							</p>
							<p className="mb-4">
								The roles available on ODE are listed below. Please note, Contributor is required to submit data. Other
								roles are mostly for internal use by the ODE team:
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Admin: Full access to the platform, including managing other user's roles</li>
								<li>Moderator: Similar to admin, except they cannot manage Admin's roles</li>
								<li>
									Contributor: Allows you to submit data to the platform, and to access the Submissions Manager to view,
									delete, or edit your own submissions. Click{" "}
									<Link className="link link-primary font-bold" href="/contribute">
										HERE
									</Link>{" "}
									to request to be a Contributor.
								</li>
								<li>
									Non-signed in User: View datasets, query the API, browse the Explore pages, and use the Search
									page{" "}
								</li>
							</ul>
						</>
					)
				},
				{
					id: "submissions-manager",
					title: "Submissions Manager",
					content: (
						<>
							<p className="mb-4">
								If you have any role (Contributor or higher), you can access the Submissions Manager.
							</p>
							<p className="mb-4">
								To find it, click your profile picture in the top right corner of the website, and then click My
								Submissions in the dropdown.
							</p>
							<p className="mb-4">The Submissions Manager lets you:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>View all of your submitted projects and analyses</li>
								<li>Delete any of your submissions</li>
								<li>Edit your submissions (change values without a re-upload)</li>
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
								We welcome your feedback to improve the Ocean DNA Explorer. If you encounter any issues or have
								suggestions for new features, please let us know.
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
									Ocean DNA Explorer GitHub Issues
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
				},
				{
					id: "faq",
					title: "FAQ",
					content: (
						<>
							<div className="space-y-4">
								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I submit data / become a Contributor?</div>
									<div className="collapse-content">
										<p>
											Submitting data requires you to have the role of Contributor. You can request this role{" "}
											<Link className="link link-primary" href="/contribute">
												here
											</Link>
											.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I use the API?</div>
									<div className="collapse-content">
										<p>
											The API has a dedicated{" "}
											<Link className="link link-primary" href="/api">
												documentation page
											</Link>
											, or you can use the Explore page to view the data through the website.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I contact the Ocean DNA Explorer team?</div>
									<div className="collapse-content">
										<p>
											Please contact us via the{" "}
											<Link className="link link-primary" href="https://github.com/aomlomics/node/issues">
												GitHub issues page
											</Link>
											.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">Can I download the entire database?</div>
									<div className="collapse-content">
										<p>
											While individual datasets can be downloaded, we currently don't provide a bulk download of the
											entire database. For large-scale data access, please contact us to discuss your needs.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I cite data from the Ocean DNA Explorer?</div>
									<div className="collapse-content">
										<p>
											Each project has a project_contact, recordedBy, institution, and institutionID, which can be used
											to cite the project.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do you protect our personal data?</div>
									<div className="collapse-content">
										<p>
											There is no personal data stored in the Ocean DNA Explorer database. User authentication is
											handled by the platform's reputable authentication provider, Clerk, and all data is stored in a
											secure database.
										</p>
									</div>
								</div>
							</div>
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
						The{" "}
						<Link className="link link-primary font-semibold" href="/search">
							Search
						</Link>{" "}
						page allows you to make complex queries across multiple tables using an intuitive search interface. This is
						different from the{" "}
						<Link className="link link-primary font-semibold" href="#explore">
							Explore
						</Link>{" "}
						pages, which only let you filter data within a single table.
					</p>
					<p className="mb-4">
						Use Search when you need to find data based on relationships between tables (e.g., "find all taxonomies in a
						specific project" or "find all samples from a particular analysis").
					</p>
				</>
			),
			subsections: [
				{
					id: "how-to-use-search",
					title: "How to Use the Search Page",
					content: (
						<>
							<p className="mb-4">
								The{" "}
								<Link className="link link-primary font-semibold" href="/search">
									Search
								</Link>{" "}
								page provides an intuitive query builder that lets you construct complex filters across different data
								tables.
							</p>

							<p className="mb-4">To use the Search page:</p>
							<ol className="list-decimal ml-6 mb-4">
								<li>Select which table you want to search</li>
								<li>Add filters using the query builder to specify your search criteria</li>
								<li>
									Filters can include conditions based on fields from related tables (e.g., search for Samples where the
									Project's institution is "NOAA")
								</li>
								<li>
									Combine multiple filters using AND/OR logic: Each filter and/or relation is combined with AND logic.
									You can add an OR condition (the filters and/or relations within the OR group are combined with OR
									logic), and the OR block itself is combined with the other filters and/or relations with AND logic
									(the same as any other filter or relation).
								</li>
								<li>Further filter those results by drawing on a map</li>
								<li>Start exploring</li>
							</ol>
							<p className="mb-4">Remember, you can always copy a search as an API query!</p>
						</>
					)
				},
				{
					id: "search-vs-explore",
					title: "Search vs Explore",
					content: (
						<>
							<p className="mb-4">What's the difference between the Search and Explore pages?</p>
							<div className="mb-4">
								<h4>
									Use{" "}
									<Link className="link link-primary" href="/search">
										Search
									</Link>{" "}
									when:
								</h4>
								<ul className="list-disc ml-6 mb-4">
									<li>You need to query across multiple tables (e.g., find taxonomies from a specific project)</li>
									<li>You want to filter based on relationships between different data types</li>
									<li>You need complex query logic with multiple conditions</li>
									<li>You want to view or filter search results on a map</li>
								</ul>
							</div>
							<div className="mb-4">
								<h4>
									Use{" "}
									<Link className="link link-primary" href="/explore">
										Explore
									</Link>{" "}
									when:
								</h4>
								<ul className="list-disc ml-6 mb-4">
									<li>You want to browse all data in a single table</li>
									<li>You only need to filter within one table's own fields</li>
									<li>You want a quick overview and are not asking a specific question</li>
								</ul>
							</div>
						</>
					)
				},
				{
					id: "query-recipes",
					title: "Query Examples",
					content: (
						<>
							<p className="mb-4">
								Unsure where to start? Click the cards below to open the Search page with a pre-filled query builder:
							</p>

							<div className="flex gap-8">
								<Link
									href={`/search?table=sample${project ? `&advanced=[["project_id","equals","${encodeURIComponent(project.project_id)}"]]` : ""}`}
								>
									<div className="group flex flex-col items-center text-center p-6 rounded-lg bg-base-200 hover:bg-base-300 transition-all duration-300 hover:scale-105 w-64">
										<div className="w-16 h-16 mb-3 flex items-center justify-center text-primary">
											<svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
												<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
											</svg>
										</div>
										<div className="text-sm font-sans font-medium uppercase tracking-wider">
											View All Samples in a Project
										</div>
									</div>
								</Link>

								<Link
									href={`/search?table=taxonomy${project ? `&advanced=[["sample","project_id","equals","${encodeURIComponent(project.project_id)}"],["sample","samp_name","equals","${encodeURIComponent(project.Samples[0].samp_name)}"]]` : ""}`}
								>
									<div className="group flex flex-col items-center text-center p-6 rounded-lg bg-base-200 hover:bg-base-300 transition-all duration-300 hover:scale-105 w-64">
										<div className="w-16 h-16 mb-3 flex items-center justify-center text-primary">
											<svg viewBox="0 0 1536 592" fill="currentColor" className="w-12 h-12">
												<g transform="translate(0.000000,592.000000) scale(0.100000,-0.100000)">
													<path d="M7037 5902 c-31 -19 -151 -172 -289 -365 -50 -71 -107 -147 -126 -170 -70 -84 -269 -397 -357 -561 -107 -200 -138 -239 -198 -254 -115 -29 -449 -55 -1257 -97 -1271 -66 -1607 -107 -2420 -291 -1390 -315 -2197 -634 -2335 -921 -10 -21 -21 -64 -23 -95 -4 -57 -3 -59 35 -95 22 -21 55 -47 74 -58 63 -37 40 -54 -109 -81 -43 -8 -39 -35 14 -82 101 -92 600 -404 847 -531 186 -95 360 -161 597 -226 113 -31 347 -96 520 -145 813 -229 1308 -330 2070 -425 396 -49 498 -68 514 -94 3 -5 12 -45 20 -89 8 -46 31 -118 54 -169 22 -49 48 -116 57 -149 28 -98 62 -182 134 -332 81 -165 111 -211 201 -308 36 -39 88 -102 115 -140 107 -153 169 -194 296 -194 66 0 81 4 120 28 64 42 319 312 319 339 0 5 36 67 79 137 97 156 131 238 138 331 10 133 -53 235 -212 340 -45 30 -113 68 -151 83 -73 30 -100 56 -74 72 8 5 21 8 28 5 14 -5 308 -27 617 -47 306 -19 918 -17 1160 4 264 23 496 36 860 48 366 12 474 7 531 -26 62 -35 176 -163 261 -293 42 -64 92 -141 112 -171 20 -30 76 -96 126 -146 49 -50 115 -119 146 -155 39 -44 79 -76 130 -105 56 -31 85 -55 118 -100 86 -114 363 -374 399 -374 19 0 88 67 121 117 32 49 83 201 100 298 5 33 15 112 21 175 41 404 205 650 676 1017 214 167 241 189 232 198 -4 4 -82 2 -175 -4 -227 -15 -524 5 -515 35 13 44 769 191 1150 224 183 15 265 3 465 -70 155 -56 251 -86 877 -275 351 -107 658 -212 830 -285 148 -63 579 -211 796 -274 328 -94 424 -88 424 27 0 82 -68 237 -180 406 -34 51 -81 135 -106 185 -51 104 -129 212 -270 374 -230 263 -282 336 -319 449 -16 52 -16 54 8 105 37 81 107 157 282 306 245 208 519 486 595 602 78 119 175 313 167 334 -11 27 -113 51 -217 50 -152 -1 -461 -58 -930 -169 -124 -30 -346 -83 -495 -118 -148 -36 -335 -77 -415 -92 -228 -44 -551 -110 -720 -149 -313 -71 -380 -77 -592 -50 -428 53 -1498 323 -1498 377 0 19 469 -15 595 -43 22 -5 66 -10 98 -10 80 0 76 21 -13 64 -145 72 -231 154 -299 285 -80 157 -98 244 -111 551 -18 396 -31 601 -40 626 -37 97 -326 -101 -1195 -819 l-289 -240 -221 26 c-895 107 -1296 159 -1333 173 -28 10 -47 25 -53 41 -9 24 -6 33 48 176 15 39 16 50 5 65 -29 39 -42 86 -53 179 -21 193 16 352 107 453 19 21 31 40 27 43 -4 2 -39 15 -78 27 -104 34 -198 84 -233 125 -37 41 -42 91 -17 152 34 81 9 89 -101 32 l-85 -43 -32 17 c-43 24 -76 78 -89 145 -20 107 -34 120 -91 84z" />
												</g>
											</svg>
										</div>
										<div className="text-sm font-sans font-medium uppercase tracking-wider">
											View Taxonomies Found in a Sample
										</div>
									</div>
								</Link>
							</div>
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
						The{" "}
						<Link className="link link-primary font-semibold" href="/explore">
							Explore
						</Link>{" "}
						pages let you browse and filter data within individual tables. Each table has its own dedicated Explore page
						with specialized filters and visualization options. Make sure to{" "}
						<Link
							className="link link-primary font-semibold"
							href={`/explore/project/${project ? encodeURIComponent(project.project_id) : ""}`}
						>
							check them out
						</Link>
						!
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
			),
			subsections: [
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
							<p className="mb-4">
								On taxonomy Explore pages, GBIF occurrence photos are also fetched when available. Some images may
								include deceased strandings or museum specimens, and a warning is shown before the image appears.
							</p>
						</>
					)
				}
			]
		},
		{
			id: "submit",
			title: "Submit Data",
			content: (
				<>
					<p className="mb-4">
						You need the{" "}
						<Link className="link link-primary" href="#login-and-roles">
							Contributor
						</Link>{" "}
						role to upload data. Use the{" "}
						<Link className="link link-primary" href="/submit">
							Submit
						</Link>{" "}
						tab in the header. Start from the example dataset below, then follow the project and analysis file layouts.
						For OBIS and GBIF publishing, see{" "}
						<Link className="link link-primary" href="#obis-gbif-submission">
							edna2obis
						</Link>
						.
					</p>
				</>
			),
			subsections: [
				{
					id: "example-dataset-ode-testdata",
					title: "Example dataset (ODE test data)",
					content: (
						<>
							<p className="mb-4">
								Browse the{" "}
								<Link
									className="link link-primary"
									href="https://github.com/aomlomics/ODE_testdata"
									target="_blank"
									rel="noopener noreferrer"
								>
									ODE_testdata example datasets
								</Link>
								. The repository includes multiple example projects with file names and TSV layouts you can copy for
								your own submission.
							</p>
							<ul className="mb-4 list-disc pl-6">
								<li>
									<strong>Project step:</strong> three FAIRe metadata TSVs (project, sample, library). The project form
									only uploads these three.
								</li>
								<li>
									<strong>Analysis step:</strong> three TSVs per run (FAIRe analysis metadata, ASV or feature table,
									occurrence table). Submit at least one analysis per project so ASVs and counts load into Explore and
									Search.
								</li>
								<li>
									<strong>Order:</strong> create the project first, then add analyses. The two forms are separate pages
									in the app.
								</li>
							</ul>
							<WorkshopVideoCallout className="mb-4 mt-6 max-w-2xl mx-0" />
						</>
					)
				},
				{
					id: "project-submissions",
					title: "Project Submissions",
					content: (
						<>
							<p className="mb-4">
								All of these are tab-separated (TSV) and follow the FAIRe template. Files with{" "}
								<code className="text-sm">metadata</code> in the name are checklist sheets, not raw sequence tables.
							</p>
							<div className="mb-6 flex flex-wrap justify-center gap-10 sm:justify-start sm:gap-14">
								<div className="flex w-28 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">projectMetadata.tsv</span>
								</div>
								<div className="flex w-28 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">sampleMetadata.tsv</span>
								</div>
								<div className="flex w-28 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">libraryMetadata.tsv</span>
								</div>
							</div>
							<p className="mb-2">
								<strong>projectMetadata.tsv</strong> uses the wide project layout: each row is one FAIRe field. You need
								columns <code className="text-sm">term_name</code> and <code className="text-sm">project_level</code>,
								then one column per assay. The header names after <code className="text-sm">project_level</code> are
								your assay identifiers (for example <code className="text-sm">ssu16sv4v5-emp</code>). Those names must
								match the assay columns you use in the sample and library files.
							</p>
							<p className="mb-2">
								<strong>sampleMetadata.tsv</strong> is one row per sample. Column names are FAIRe field names.
							</p>
							<p className="mb-4">
								<strong>libraryMetadata.tsv</strong> is one row per library (experiment run in FAIRe terms). Lines may
								start with <code className="text-sm">#</code> as comments; the parser ignores them.{" "}
								<code className="text-sm">lib_id</code> values here must match the column headers in your occurrence
								table for each analysis.
							</p>
							<p className="mb-2">
								<code className="text-sm">project_id</code> must be identical across all three files. Assay headers must
								line up everywhere you reference an assay.
							</p>
							<p className="mb-2">Required fields in the project metadata file include:</p>
							<ul className="mb-0 list-disc pl-6">
								<li>project_id</li>
								<li>project_contact</li>
								<li>assay_type</li>
								<li>checkls_ver</li>
								<li>pcr_0_1</li>
								<li>assay_name</li>
								<li>targetTaxonomicAssay</li>
								<li>pcr_primer_forward</li>
								<li>pcr_primer_reverse</li>
							</ul>
						</>
					)
				},
				{
					id: "analysis-submissions",
					title: "Analysis Submissions",
					content: (
						<>
							<p className="mb-4">
								You pick an existing project you are allowed to edit. Each analysis run uploads three TSV files: FAIRe
								analysis metadata, then two data tables (ASV or feature table and occurrence table). Those two are not
								FAIRe checklist spreadsheets; they hold sequences, taxonomy, and counts.
							</p>
							<div className="mb-6 flex flex-wrap justify-center gap-10 sm:justify-start sm:gap-14">
								<div className="flex w-32 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">analysisMetadata.tsv</span>
								</div>
								<div className="flex w-32 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">ASV table (TSV)</span>
								</div>
								<div className="flex w-32 flex-col items-center text-center">
									<ExampleFileGlyph className="size-14 shrink-0 text-primary" />
									<span className="mt-2 text-sm">occurrence table (TSV)</span>
								</div>
							</div>
							<p className="mb-2">
								<strong>analysisMetadata.tsv</strong> is long format: each row has{" "}
								<code className="text-sm">term_name</code> and <code className="text-sm">values</code>. It must include{" "}
								<code className="text-sm">project_id</code>, <code className="text-sm">assay_name</code>, and a unique{" "}
								<code className="text-sm">analysis_run_name</code> for every run you upload.
							</p>
							<p className="mb-2">
								<strong>ASV table (TSV)</strong> has one row per ASV. The importer maps columns into Feature,
								Assignment, and Taxonomy rows. The first column is <code className="text-sm">featureid</code>. You also
								need <code className="text-sm">dna_sequence</code>, taxonomy fields such as{" "}
								<code className="text-sm">taxonomy</code> and <code className="text-sm">verbatimIdentification</code>,
								rank columns, and <code className="text-sm">Confidence</code>, using the same names as FAIRe or
								Tourmaline exports.
							</p>
							<p className="mb-4">
								If you use{" "}
								<a
									className="link link-primary"
									href="https://github.com/aomlomics/tourmaline/tree/develop"
									target="_blank"
									rel="noopener noreferrer"
								>
									Tourmaline
								</a>{" "}
								for amplicon processing, it writes these two data files in the same general shape as the examples below:
								wide ASV taxa features table with taxonomy columns, and a wide occurrence table keyed by{" "}
								<code className="text-sm">featureid</code> with one column per library. You still need the separate
								FAIRe <code className="text-sm">analysisMetadata.tsv</code> for run metadata.
							</p>
							<p className="mb-4">
								<strong>Not using Tourmaline:</strong> match the column headers and types from the examples (or from a
								Tourmaline run on your checklist version). For <code className="text-sm">featureid</code>, Tourmaline
								uses the MD5 hash (hex) of the ASV DNA sequence. You can check a sequence with:
							</p>
							<pre className="mb-4 overflow-x-auto rounded-lg bg-base-300 p-4 font-mono text-sm leading-relaxed">
								{`$ echo -n "YOUR_DNA_SEQUENCE_HERE" | md5sum
abc12d6cd12a574f2183f003593d3940  -`}
							</pre>
							<p className="mb-4">
								Replace the string with your full sequence (no newline inside the quotes). The left column of the output
								is the <code className="text-sm">featureid</code> value to use for that ASV. The sample hash above is
								only an illustration; your result depends on the sequence you pass in.
							</p>
							<AnalysisAsvTablePreview />
							<p className="mb-3 mt-10">
								<strong>Occurrence Table</strong> (Tourmaline export) is a wide table: first row is the header. The
								first column is feature IDs (usually under the header <code className="text-sm">featureid</code>). Every
								other column is one <code className="text-sm">lib_id</code> from your library metadata, in the same
								spelling. Each later row is one ASV and the cells are non-negative integers. Use{" "}
								<code className="text-sm">0</code> where a feature is absent in a library. Empty or non-numeric cells
								fail validation. Only counts greater than zero are stored as occurrence records in the database.
							</p>
							<AnalysisOccurrenceTablePreview />
							<p className="mb-3">
								Other pipelines (DADA2, QIIME 2, and so on) can work if you export the same layout and column names.
								Compare your headers to the{" "}
								<a
									className="link link-primary"
									href="https://github.com/aomlomics/ODE_testdata/tree/main/noaa-sefsc-gu1901"
									target="_blank"
									rel="noopener noreferrer"
								>
									ODE_testdata
								</a>{" "}
								example or a Tourmaline export when you are unsure.
							</p>
						</>
					)
				},
				{
					id: "data-format-rationale",
					title: "Data Format Rationale",
					content: (
						<>
							<p className="mb-4">
								Ocean DNA Explorer is aligned with the{" "}
								<Link className="link link-primary" href="https://fair-edna.github.io/" target="_blank">
									FAIRe eDNA
								</Link>{" "}
								standard, with small changes for features on this site. FAIRe is a shared checklist for eDNA metadata so
								datasets stay findable and reusable.
							</p>
							<p className="mb-2">
								The checklist has 337 terms (mandatory, recommended, and optional) across steps like sample collection,
								PCR, and bioinformatics. Ocean DNA Explorer uses the same term set with minor additions or omissions.
								Fields draw on standards such as:
							</p>
							<ul className="mb-4 list-disc pl-6">
								<li>MIxS (Minimum Information about any Sequence) and extensions</li>
								<li>Darwin Core for biodiversity</li>
								<li>MIQE for quantitative PCR</li>
								<li>MIEM for eDNA and eRNA metabarcoding</li>
								<li>Terms written specifically for eDNA workflows</li>
							</ul>
							<p className="mb-4">
								That shared structure helps your data work here, in downstream tools, and alongside other environmental
								datasets.
							</p>
							<WorkshopVideoCallout compact />
						</>
					)
				},
				{
					id: "amplicon-sequence-processing",
					title: "Amplicon Sequence Processing (Tourmaline)",
					content: (
						<>
							<p className="mb-4">
								<Link
									className="link link-primary"
									href="https://github.com/aomlomics/tourmaline/tree/develop"
									target="_blank"
								>
									Tourmaline 2
								</Link>{" "}
								from{" "}
								<Link className="link link-primary" href="https://github.com/aomlomics" target="_blank">
									AOML Omics
								</Link>{" "}
								is a Snakemake workflow around QIIME 2. It produces quality-filtered reads, ASV tables, and taxonomic
								assignments you can upload as an analysis. You can attach several analyses to one project to compare
								parameter choices. Output file shapes match{" "}
								<Link className="link link-primary" href="#analysis-submissions">
									Analysis Submissions
								</Link>{" "}
								and the{" "}
								<Link className="link link-primary" href="#example-dataset-ode-testdata">
									example dataset
								</Link>
								.
							</p>
						</>
					)
				},
				{
					id: "faire-metadata-template",
					title: "FAIRe Metadata Template",
					content: (
						<>
							<p className="mb-4">
								<Link className="link link-primary" href="https://github.com/aomlomics/FAIReSheets" target="_blank">
									FAIReSheets
								</Link>{" "}
								builds Google Sheets from the NOAA FAIRe checklist. You can add your own terms to the checklist first;
								those show up as extra columns when you generate sheets. The checklist is the data dictionary and
								includes controlled vocabularies for many fields.
							</p>
							<p className="mb-4">
								Generated sheets cover project, sample, experiment run (library), and analysis metadata with field names
								the portal expects. The same filled templates can feed{" "}
								<Link className="link link-primary" href="#obis-gbif-submission">
									edna2obis
								</Link>{" "}
								for OBIS and GBIF.
							</p>
							<p className="mb-4">
								FAIReSheets runs as a Python script on your computer. Request access by emailing{" "}
								<a className="link link-primary" href="mailto:bayden.willms@noaa.gov">
									bayden.willms@noaa.gov
								</a>
								.
							</p>
							<WorkshopVideoCallout compact />
						</>
					)
				},
				{
					id: "fill-in-metadata-templates",
					title: "Fill in Metadata Templates",
					content: (
						<>
							<p className="mb-4">
								See the{" "}
								<a
									href="https://noaa-omics-dmg.readthedocs.io/en/latest/metadata-guidelines.html"
									className="link link-primary"
								>
									NOAA Omics Data Management Guide
								</a>{" "}
								for field-level detail. Below is how to record missing values and how to keep IDs consistent across
								sheets.
							</p>

							<h4>Handling missing data (dead values)</h4>
							<p className="mb-4">
								For NCBI and other INSDC archives, use their controlled missing-value vocabulary. Do not leave cells
								empty. Following{" "}
								<a
									className="link link-primary"
									href="https://www.insdc.org/submitting-standards/missing-value-reporting/"
									target="_blank"
									rel="noreferrer"
								>
									INSDC missing-value reporting
								</a>{" "}
								keeps templates aligned with what those systems expect at submission time. Data can be missing for many
								reasons; some locations are generalized on purpose to protect species or culturally sensitive places.
								For any required field you cannot fill, use that vocabulary; optional fields should use the same pattern
								when missing.
							</p>

							<h4>Recommended dead values</h4>
							<p className="mb-4">Use only the following accepted dead values when filling metadata templates.</p>
							<p className="mb-4">
								Our dead / missing values terminology maps to the INSDC missing value reporting standard:{" "}
								<a
									className="link link-primary"
									href="https://www.insdc.org/technical-specifications/missing-value-reporting/"
									target="_blank"
									rel="noreferrer"
								>
									INSDC Missing Value Reporting
								</a>
								.
							</p>
							<div className="mb-4 overflow-x-auto">
								<table className="table table-zebra w-full">
									<thead>
										<tr>
											<th>Value to enter in the data templates</th>
											<th>When to use</th>
											<th>Applies to</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<code>missing</code>
											</td>
											<td>
												The value exists but was not recorded at the time of data collection; it is unknown whether it
												could be obtained.
											</td>
											<td>All fields</td>
										</tr>
										<tr>
											<td>
												<code>not applicable</code>
											</td>
											<td>
												The field is not relevant to this sample type or experimental context; the concept does not
												apply (e.g., &quot;depth&quot; for a terrestrial soil sample in a marine-focused schema).
											</td>
											<td>All fields</td>
										</tr>
										<tr>
											<td>
												<code>not collected</code>
											</td>
											<td>
												The value was not collected intentionally; the decision was made not to measure or record it,
												and it cannot be retrieved retrospectively.
											</td>
											<td>All fields</td>
										</tr>
										<tr>
											<td>
												<code>not provided</code>
											</td>
											<td>
												The value may exist and may have been collected, but was not included in the submission.
												Distinct from not collected in that the information could potentially still be obtained from the
												submitter.
											</td>
											<td>All fields</td>
										</tr>
										<tr>
											<td>
												<code>restricted access</code>
											</td>
											<td>
												The value exists and is known but cannot be shared publicly, typically due to legal, ethical, or
												privacy constraints (e.g., precise coordinates of endangered species localities, or indigenous
												community data).
											</td>
											<td>All fields</td>
										</tr>
									</tbody>
								</table>
							</div>

							<h4>User defined terms</h4>
							<p className="mb-4">
								If you need columns that are not in the NOAA checklist, add them as user defined terms in the checklist
								before you run FAIReSheets, or add columns by hand in the sheet. See{" "}
								<Link className="link link-primary" href="#faire-metadata-template">
									FAIRe Metadata Template
								</Link>
								.
							</p>

							<h4>Important linking fields</h4>
							<ul className="mb-4 list-disc pl-6">
								<li>
									<code className="text-sm">project_id</code> must be the same string in every metadata file for that
									project.
								</li>
								<li>
									<code className="text-sm">analysis_run_name</code> must be unique for each analysis and must match
									what you put in the analysisMetadata TSV.
								</li>
								<li>
									In project metadata, use <code className="text-sm">project_level</code> for values that apply to the
									whole project, and the per-assay columns (for example <code className="text-sm">ssu16sv4v5-emp</code>)
									when values differ by assay.
								</li>
							</ul>
							<p className="mb-0">Download each sheet as TSV before you upload.</p>
						</>
					)
				},
				{
					id: "obis-gbif-submission",
					title: "OBIS + GBIF Submission",
					content: (
						<>
							<p className="mb-0">
								<Link className="link link-primary" href="https://github.com/baydenwillms/edna2obis-3.0/tree/main">
									edna2obis
								</Link>{" "}
								reads the same file layout you use for Ocean DNA Explorer and converts it to Darwin Core for submission
								to OBIS (Ocean Biodiversity Information System) and GBIF (Global Biodiversity Information Facility).
							</p>
							<WorkshopVideoCallout compact className="mt-4" />
						</>
					)
				}
			]
		}
	] as Section[];
}
