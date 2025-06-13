import { ReactNode } from "react";
import Link from "next/link";
import { DeadBooleanEnum } from "../../../types/enums";

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

export const helpSections: Section[] = [
	{
		id: "node-overview",
		title: "Overview",
		content: (
			<>
				<p className="mb-4">
					ODE (Ocean DNA Explorer) is a data portal for uploading and finding ocean eDNA data. This help documentation will guide
					you through the various features of the platform.
				</p>
				<p className="mb-4">
					Our goal is to make marine eDNA data more findable, accessible, interoperable, and reusable for researchers,
					policymakers, and to the public.
				</p>
			</>
		),
		subsections: [
			{
				id: "login-and-roles",
				title: "Login and Roles",
				content: (
					<>
						<p className="mb-4">ODE requires you to login to access certain features of the platform, like submitting data.</p>
						<p className="mb-4">You can login with several types of accounts using the Sign-In button in the top right corner of the website. Rest assured, your personal data is not stored in our database. Authentication is handled by Clerk, a user management platform. You can delete your account at any time by clicking your profile picture in the top right corner of the website, then clicking "Manage Account" in the dropdown, and then clicking "Security" and finally "Delete Account".</p>
						<p className="mb-4">The roles available on ODE are listed below. Please note, Contributor is what you need to submit data, and the other roles are mostly for internal use by the ODE team:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Admin: Full access to the platform, including managing other user's roles, and can view both public and private data</li>
							<li>Moderator: Similar to admin, except they cannot manage Admin's roles</li>
							<li>Contributor: Allows you to submit data to the platform, privately or publically, and to access the Submissions Manager to view, delete, or edit your own submissions. Click <Link className="link link-primary font-bold" href="/contribute">HERE</Link> to request to be a Contributor.</li>
							<li>Non-signed in User: View public datasets, query the API, browse the Explore pages, and use the Search page </li>
						</ul>
					</>
				)
			},
			{
				id: "submissions-manager",
				title: "Submissions Manager",
				content: (
					<>
						<p className="mb-4">If you have any role (Contributor or higher), you can access the Submissions Manager.</p>
						<p className="mb-4">To find it, click your profile picture in the top right corner of the website, and then click "My Submissions" in the dropdown.</p>
						<p className="mb-4">The Submissions Manager lets you:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>View all of your project and analyses submitted to the platform</li>
							<li>Delete any of your submissions</li>
							<li>Make any Private data Publically visible (does NOT work vice versa)</li>
							<li>Edit your submissions (change certain field's values without a full re-upload)</li>
						</ul>
					</>
				)
			},
			{
				id: "features-overview",
				title: "Features Overview",
				content: (
					<>
						<p className="mb-4">ODE provides several key features to help you work with marine eDNA data:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>{" "}<Link className="link link-primary font-semibold" href="/explore">Explore</Link> projects, samples, analyses, features, and taxonomies with filters and a graphical user interface via the Explore page</li>
							<li>Leverage the <Link className="link link-primary font-semibold" href="/api">API</Link> to access data programmatically</li>
							<li>{" "}<Link className="link link-primary font-semibold" href="/search">Search</Link> across datasets using powerful query capabilities via the Search page</li>
							<li>{" "}<Link className="link link-primary font-semibold" href="/submit">Submit</Link> your own data in standardized formats via the Submit page</li>
							<li>Download existing datasets via the API or individual Explore pages</li>
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
							We welcome your feedback to improve ODE. If you encounter any issues or have suggestions for new
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
								ODE GitHub Issues
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
		id: "submit",
		title: "Submit Data",
		content: (
			<>
				<p className="mb-4 font-semibold">NOTE: You must have a role of at least{" "}<Link className="link link-primary font-semibold" href="#login-and-roles">Contributor</Link> to submit data. </p>
				<p className="mb-4">
					This section will help guide you through the process of contributing your own data to the ODE platform. Once you have{" "}
					<Link className="link link-primary font-semibold" href="#data-format-rationale">
						formatted
					</Link>{" "} your data, you can {" "}<Link className="link link-primary font-semibold" href="/submit">submit</Link> eDNA projects and
					analyses to share with the scientific community on the Ocean DNA Explorer, OBIS (Ocean Biodiversity Information System), and GBIF (Global Biodiversity Information Facility).
				</p>
			</>
		),
		subsections: [
			{
				id: "public-vs-private-data",
				title: "Public vs Private Data",
				content: (
					<>
						<p className="mb-4">
							Data can be submitted privately or publicly. Private submissions are only visible to you, and to
							moderators and admins of ODE. You can make a private submission public at any time, but you cannot
							make a public submission private.
						</p>
						<p className="mb-4"> We encourage users to eventually make their data public. The purpose of private submissions is in case you are unsure of your data quality or if you are new to the submission process. </p>
					</>
				)
			},
			{
				id: "data-format-rationale",
				title: "Data Format Rationale",
				content: (
					<>
						<p className="mb-4">
							ODE's data format is modeled after the{" "}
							<Link className="link link-primary" href="https://fair-edna.github.io/" target="_blank">
								FAIRe eDNA standard
							</Link>
							, with a few modifications to enable the enhanced features which ODE provides. The FAIRe (Findable, Accessible, Interoperable, Reusable) eDNA initiative is a multi-organization, 
							international collaboration that has developed a comprehensive metadata checklist specifically for eDNA data.
						</p>
						<p className="mb-4">
							The FAIRe metadata checklist consists of 337 data terms (38 mandatory, 51 highly recommended, 128 
							recommended and 120 optional terms), organized into workflow sections such as sample collection, PCR, 
							and bioinformatics. ODE's data format uses the same checklist, with a few additions and subtractions. The FAIRe data fields are sourced from existing data standards including:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>MIxS (Minimum Information about any Sequence) and its extensions</li>
							<li>Darwin Core (DwC) for biodiversity data</li>
							<li>MIQE guidelines for quantitative PCR</li>
							<li>MIEM guidelines for eDNA and eRNA metabarcoding</li>
							<li>158 new terms specifically developed for eDNA procedures and datasets</li>
						</ul>
						<p className="mb-4">
							This comprehensive approach ensures that eDNA datasets can be properly documented, discovered, and 
							reused across the scientific community, supporting data-driven biodiversity management at broad scales, aiming to connect eDNA data to other environmental data for cross discipline reuse.
						</p>
					</>
				)
			},
			{
				id: "amplicon-sequence-processing",
				title: "Amplicon Sequence Processing (Tourmaline)",
				content: (
					<>
						<p className="mb-4">{" "}<Link className="link link-primary" href="https://github.com/aomlomics/tourmaline/tree/develop" target="_blank">Tourmaline 2</Link> is an amplicon sequence analysis workflow developed by the {" "}<Link className="link link-primary" href="https://github.com/aomlomics" target="_blank">AOML Omics</Link> team. It provides a simple command line interface for a Snakemake workflow that calls QIIME 2 and other commands, generating quality controlled sequence data, amplicon sequence variant tables, and taxonomic assignments. Tourmaline 2 output can be uploaded to ODE as an analysis. Multiple analyses can be uploaded for the same project, allowing users to compare the output from different sets of parameters.  </p>
					</>
				)
			},
			{
				id: "faire-metadata-template",
				title: "FAIRe Metadata Template",
				content: (
					<>
						<p className="mb-4">
							Metadata templates can be generated using{" "}
							<Link
								className="link link-primary"
								href="https://github.com/baydenwillms/FAIReSheets/tree/FAIRe2NODE"
								target="_blank"
							>
								FAIRe2NODE
							</Link>
							, a tool that creates standardized eDNA data templates directly in Google Sheets. It is NOAA's
							implementation of the {" "}<Link className="link link-primary" href="#data-format-rationale" target="_blank">FAIRe eDNA</Link> templates.
						</p>
						<p className="mb-4">
							The templates are generated based on the FAIRe NOAA checklist, which serves as the data dictionary. A
							key feature is the ability to add your own User Defined terms to this checklist. When you run
							FAIRe2NODE, any custom terms you've added to the checklist Excel file will be included in your generated Google Sheets template,
							ensuring all your relevant data fields are captured.
						</p>
						<p className="mb-4">
							The checklist also provides controlled vocabularies for many fields, ensuring consistent data entry and units of measure 
							across the eDNA community. This standardization is crucial for data interoperability and reuse.
						</p>
						<p className="mb-4">
							The generated templates for project, sample, experiment run, and analysis metadata are designed for instant submission to ODE. Once filled, data formatted with these templates can also be easily
							prepared for submission to the Ocean DNA Explorer, but ALSO for submission to OBIS and GBIF using the {" "}<Link className="link link-primary" href="#obis-gbif-submission">edna2obis</Link> tool.
						</p>
						<p className="mb-4">
							To use FAIRe2NODE, you will need to run a Python script on your local computer. Access to the tool is
							granted upon request by emailing bayden.willms@noaa.gov
						</p>
					</>
				)
			},
			{
				id: "fill-in-metadata-templates",
				title: "Fill in Metadata Templates",
				content: (
					<>
						<p className="mb-4">
							Now it's time to fill in your data to the metadata templates. This is a critical step to ensure your
							data is standardized and interoperable.
						</p>

						<h4 className="text-lg font-medium mb-2 mt-4">Handling Missing Data (Dead Values)</h4>
						<p className="mb-4">
							Data can be absent for many different reasons, and the scientific community has historically used 
							various approaches to indicate missing information. For example, location data may be intentionally 
							obscured or generalized to safeguard endangered species or protect sites of cultural significance 
							to Indigenous communities.
						</p>
						<p className="mb-4">
							For required fields that lack data, you must specify why the information is unavailable using the 
							INSDC missing value controlled vocabulary format. This practice is also recommended for optional 
							fields. Rather than leaving cells empty, select the most appropriate "dead value" from the controlled 
							vocabulary:
						</p>
						<div className="mb-4">
							<table className="table table-zebra w-full">
								<thead>
									<tr>
										<th>Value to enter in the data templates</th>
										<th>When to Use</th>
									</tr>
								</thead>
								<tbody>
									{/* Boolean values */}
									<tr>
										<td>true</td>
										<td>Boolean field is true</td>
									</tr>
									<tr>
										<td>1</td>
										<td>Boolean field is true</td>
									</tr>
									<tr>
										<td>false</td>
										<td>Boolean field is false</td>
									</tr>
									<tr>
										<td>0</td>
										<td>Boolean field is false</td>
									</tr>
									{/* Dead values */}
									{Object.keys(DeadBooleanEnum)
										.filter(key => !['true', 'false', '0', '1'].includes(key))
										.map(deadValue => (
											<tr key={deadValue}>
												<td>{deadValue}</td>
												<td>
													{deadValue.startsWith('not applicable') 
														? 'Field does not apply to this column'
														: deadValue.startsWith('missing: not collected')
														? 'Data was not collected for X reason'
														: deadValue.startsWith('missing: not provided')
														? 'Data exists but was not provided'
														: deadValue.startsWith('missing: restricted access')
														? 'Data cannot be shared due to restrictions'
														: 'Data should exist but is unavailable'
													}
												</td>
											</tr>
										))
									}
								</tbody>
							</table>
						</div>

						<h4 className="text-lg font-medium mb-2 mt-12">User Defined Terms</h4>
						<p className="mb-4">
							If you have data fields which you want in your templates that are NOT in the FAIRe NOAA checklist (data dictionary), you can add them as User Defined
							terms. As mentioned in the{" "}
							<Link className="link link-primary" href="#faire-metadata-template">
								FAIRe Metadata Template
							</Link>{" "}
							section, you can add these to the FAIRe NOAA checklist before generating your template, or add them
							manually as new columns in your Google Sheet.
						</p>

						<h4 className="text-lg font-medium mb-2 mt-4">Pay Attention to these Important Fields!</h4>
						<p className="mb-4">
							To ensure your data is linked and interpreted correctly, please pay close attention to the following:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>
								Project ID: The project_id must be identical across all metadata files (project, sample, etc.) to link them together.
							</li>
							<li>
								Analysis Run Names: Verify that each analysis file's analysis_run_name is correct in each analysisMetadata file, and is unique for each analysis.
							</li>
							<li>
								Assay-Specific vs. Project-Level Data: In the project metadata, fields can apply to all analyses (denoted by a value in the project_level column) or they may have a different value per assay. For assay specific values, use the corresponding assay-specific column (e.g., "ssu16sv4v5-emp" or "ssu18sv9-emp").
							</li>
						</ul>
						<p className="font-bold"> Once you have filled in your Google Sheet, download each sheet as a TSV File, and you are ready to submit to ODE!</p>
					</>
				)
			},
			{
				id: "project-submissions",
				title: "Project Submissions",
				content: (
					<>
						<p className="mb-4">
							Any metadata file submitted to ODE must be in TSV format. To submit a project, you'll need to submit one or more analyses alongside it.
						</p>
						<p className="mb-2">The following fields are required in your project metadata file:</p>
						<ul className="list-disc ml-6 mb-4">
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
						<p className="mb-4">All files must be in TSV format and follow the FAIRe template structure exactly.</p>
					</>
				)
			},
			{
				id: "analysis-submissions",
				title: "Analysis Submissions",
				content: (
					<>
						<p className="mb-4">
							Any metadata file submitted to ODE must be in TSV format. Analyses can be submitted WITHOUT a project, as long as the project it is related to is already uploaded to ODE.
						</p>
						<p className="mb-2">The following fields are required in your analysis metadata file(s):</p>
						<ul className="list-disc ml-6 mb-4">
							<li>project_id</li>
							<li>assay_name</li>
							<li>analysis_run_name</li>
						</ul>
						<p className="mb-4">All files must be in TSV format and follow the FAIRe template structure exactly.</p>
					</>
				)
			},
			{
				id: "obis-gbif-submission",
				title: "OBIS + GBIF Submission",
				content: (
					<>
						<p className="mb-4">
						{" "}<Link className="link link-primary" href="https://github.com/baydenwillms/edna2obis-3.0/tree/main">edna2obis</Link> converts the ODE input files to the expected format for submission to OBIS (Ocean Biodiversity Information System), and GBIF (Global Biodiversity Information Facility). its input file structure MATCHES
							that of ODE- so if you're submitting data here, you can easily submit to OBIS and GBIF as well.
						</p>
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
				<p className="mb-4 font-semibold text-red-500">NOTE: The search functionality is currently under development and is not yet fully functional. Coming soon!</p>
				<p className="mb-4">
					ODE's search functionality allows you to find specific data across all categories in the platform. You can
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
		id: "explore",
		title: "Explore",
		content: (
			<>
				<p className="mb-4">
					The Explore section lets you browse through different categories of data across ODE. Each
					category represents a table in the database, and they can filtered using the filter menu on the left side of the page.
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
							at least one analysis.
						</p>
						<p className="mb-4">Key project information includes:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Project name and description</li>
							<li>Principal investigator and institution</li>
							<li>Temporal and geographic scope</li>
							<li>Associated samples, taxonomies, primers, and analyses</li>
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
		id: "faq",
		title: "FAQ",
		content: (
			<>
				<div className="space-y-6">
					<p className="mb-4">Frequently asked questions about using the Ocean DNA Explorer.</p>

					<div>
						<h4 className="font-medium mb-2">Q: How do I submit data / become a Contributor?</h4>
						<p>
							A: Submitting data requires you to have the role of Contributor. You can request this role{" "}
							<Link className="link link-primary" href="/contribute">here</Link>.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I use the API?</h4>
						<p>
							A: The API has a dedicated{" "}<Link className="link link-primary" href="/api">documentation page</Link>, or you can use the Explore page to view the data through the website.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I contact the ODE team?</h4>
						<p>
							A: Please contact us via the{" "}<Link className="link link-primary" href="https://github.com/aomlomics/node/issues">GitHub issues page</Link>.
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
							A: Each project has a project_contact, recordedBy, institution, and institutionID, which can be used to cite the project.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do you protect our personal data?</h4>
						<p>
							A: There is no personal data stored in the ODE database. User authentication is handled by the platform's reputableauthentication provider, Clerk, and all data is stored in a secure database.
						</p>
					</div>

				</div>
			</>
		)
	}
];
