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
					The Ocean DNA Explorer is a data portal for uploading and finding ocean eDNA data. This help documentation
					will guide you through the various features of the platform.
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
						<p className="mb-4">
							The Ocean DNA Explorer requires you to login to access certain features of the platform, like submitting data.
						</p>
						<p className="mb-4">
							You can login with several types of accounts using the Sign-In button in the top right corner of the
							website. Rest assured, your personal data is not stored in our database. Authentication is handled by
							Clerk, a user management platform. You can delete your account at any time by clicking your profile
							picture in the top right corner of the website, then clicking "Manage Account" in the dropdown, and then
							clicking "Security" and finally "Delete Account".
						</p>
						<p className="mb-4">
							The roles available on the Ocean DNA Explorer are listed below. Please note, Contributor is what you need to submit data, and
							the other roles are mostly for internal use by the Ocean DNA Explorer team:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>
								Admin: Full access to the platform, including managing other user's roles, and can view both public and
								private data
							</li>
							<li>Moderator: Similar to admin, except they cannot manage Admin's roles</li>
							<li>
								Contributor: Allows you to submit data to the platform, privately or publically, and to access the
								Submissions Manager to view, delete, or edit your own submissions. Click{" "}
								<Link className="link link-primary font-bold" href="/contribute">
									HERE
								</Link>{" "}
								to request to be a Contributor.
							</li>
							<li>
								Non-signed in User: View public datasets, query the API, browse the Explore pages, and use the Search
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
							To find it, click your profile picture in the top right corner of the website, and then click "My
							Submissions" in the dropdown.
						</p>
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
						<p className="mb-4">The Ocean DNA Explorer provides several key features to help you work with marine eDNA data:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>
								{" "}
								<Link className="link link-primary font-semibold" href="/explore">
									Explore
								</Link>{" "}
								projects, samples, analyses, features, and taxonomies with filters and a graphical user interface via
								the Explore page
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
								across datasets using powerful query capabilities via the Search page
							</li>
							<li>
								{" "}
								<Link className="link link-primary font-semibold" href="/submit">
									Submit
								</Link>{" "}
								your own data in standardized formats via the Submit page
							</li>
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
							We welcome your feedback to improve the Ocean DNA Explorer. If you encounter any issues or have suggestions for new features,
							please let us know.
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
			}
		]
	},
	{
		id: "submit",
		title: "Submit Data",
		content: (
			<>
				<p className="mb-4 font-semibold">
					NOTE: You must have a role of at least{" "}
					<Link className="link link-primary font-semibold" href="#login-and-roles">
						Contributor
					</Link>{" "}
					to submit data.{" "}
				</p>
				<p className="mb-4">
					This section will help guide you through the process of contributing your own data to the Ocean DNA Explorer. Once
					you have{" "}
					<Link className="link link-primary font-semibold" href="#data-format-rationale">
						formatted
					</Link>{" "}
					your data, you can{" "}
					<Link className="link link-primary font-semibold" href="/submit">
						submit
					</Link>{" "}
					eDNA projects and analyses to share with the scientific community on the Ocean DNA Explorer, OBIS (Ocean
					Biodiversity Information System), and GBIF (Global Biodiversity Information Facility).
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
							moderators and admins of the Ocean DNA Explorer. You can make a private submission public at any time, but you cannot make a
							public submission private.
						</p>
						<p className="mb-4">
							{" "}
							We encourage users to eventually make their data public. The purpose of private submissions is in case you
							are unsure of your data quality or if you are new to the submission process.{" "}
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
							The Ocean DNA Explorer's data format is modeled after the{" "}
							<Link className="link link-primary" href="https://fair-edna.github.io/" target="_blank">
								FAIRe eDNA standard
							</Link>
							, with a few modifications to enable the enhanced features which the Ocean DNA Explorer provides. The FAIRe (Findable,
							Accessible, Interoperable, Reusable) eDNA initiative is a multi-organization, international collaboration
							that has developed a comprehensive metadata checklist specifically for eDNA data.
						</p>
						<p className="mb-4">
							The FAIRe metadata checklist consists of 337 data terms (38 mandatory, 51 highly recommended, 128
							recommended and 120 optional terms), organized into workflow sections such as sample collection, PCR, and
							bioinformatics. The Ocean DNA Explorer's data format uses the same checklist, with a few additions and subtractions. The
							FAIRe data fields are sourced from existing data standards including:
						</p>
						<ul className="list-disc ml-6 mb-4">
							<li>MIxS (Minimum Information about any Sequence) and its extensions</li>
							<li>Darwin Core (DwC) for biodiversity data</li>
							<li>MIQE guidelines for quantitative PCR</li>
							<li>MIEM guidelines for eDNA and eRNA metabarcoding</li>
							<li>158 new terms specifically developed for eDNA procedures and datasets</li>
						</ul>
						<p className="mb-4">
							This comprehensive approach ensures that eDNA datasets can be properly documented, discovered, and reused
							across the scientific community, supporting data-driven biodiversity management at broad scales, aiming to
							connect eDNA data to other environmental data for cross discipline reuse.
						</p>
					</>
				)
			},
			{
				id: "amplicon-sequence-processing",
				title: "Amplicon Sequence Processing (Tourmaline)",
				content: (
					<>
						<p className="mb-4">
							{" "}
							<Link
								className="link link-primary"
								href="https://github.com/aomlomics/tourmaline/tree/develop"
								target="_blank"
							>
								Tourmaline 2
							</Link>{" "}
							is an amplicon sequence analysis workflow developed by the{" "}
							<Link className="link link-primary" href="https://github.com/aomlomics" target="_blank">
								AOML Omics
							</Link>{" "}
							team. It provides a simple command line interface for a Snakemake workflow that calls QIIME 2 and other
							commands, generating quality controlled sequence data, amplicon sequence variant tables, and taxonomic
							assignments. Tourmaline 2 output can be uploaded to the Ocean DNA Explorer as an analysis. Multiple analyses can be uploaded
							for the same project, allowing users to compare the output from different sets of parameters.{" "}
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
							Metadata templates can be generated using{" "}
							<Link className="link link-primary" href="https://github.com/aomlomics/FAIReSheets" target="_blank">
								FAIReSheets
							</Link>
							, a tool that creates standardized eDNA data templates directly in Google Sheets. It is NOAA's
							implementation of the{" "}
							<Link className="link link-primary" href="#data-format-rationale" target="_blank">
								FAIRe eDNA
							</Link>{" "}
							templates.
						</p>
						<p className="mb-4">
							The templates are generated based on the FAIRe NOAA checklist, which serves as the data dictionary. A key
							feature is the ability to add your own User Defined terms to this checklist. When you run FAIReSheets, any
							custom terms you've added to the checklist Excel file will be included in your generated Google Sheets
							template, ensuring all your relevant data fields are captured.
						</p>
						<p className="mb-4">
							The checklist also provides controlled vocabularies for many fields, ensuring consistent data entry and
							units of measure across the eDNA community. This standardization is crucial for data interoperability and
							reuse.
						</p>
						<p className="mb-4">
							The generated templates for project, sample, experiment run, and analysis metadata are designed for
							instant submission to the Ocean DNA Explorer. Once filled, data formatted with these templates can also be easily prepared
							for submission to the Ocean DNA Explorer, but ALSO for submission to OBIS and GBIF using the{" "}
							<Link className="link link-primary" href="#obis-gbif-submission">
								edna2obis
							</Link>{" "}
							tool.
						</p>
						<p className="mb-4">
							To use FAIReSheets, you will need to run a Python script on your local computer. Access to the tool is
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
							Now it's time to fill in your data to the metadata templates. This is a critical step to ensure your data
							is standardized and interoperable. Please see the{" "}
							<a
								href="https://noaa-omics-dmg.readthedocs.io/en/latest/metadata-guidelines.html"
								className="link link-primary"
							>
								NOAA Omics Data Management Guide
							</a>{" "}
							for more information on the data format and metadata requirements.
						</p>

						<h4 className="text-lg font-medium mb-2 mt-4">Handling Missing Data (Dead Values)</h4>
						<p className="mb-4">
							Data can be absent for many different reasons, and the scientific community has historically used various
							approaches to indicate missing information. For example, location data may be intentionally obscured or
							generalized to safeguard endangered species or protect sites of cultural significance to Indigenous
							communities.
						</p>
						<p className="mb-4">
							For required fields that lack data, you must specify why the information is unavailable using the INSDC
							missing value controlled vocabulary format. This practice is also recommended for optional fields. Rather
							than leaving cells empty, select the most appropriate "dead value" from the controlled vocabulary:
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
										.filter((key) => !["true", "false", "0", "1"].includes(key))
										.map((deadValue) => (
											<tr key={deadValue}>
												<td>{deadValue}</td>
												<td>
													{deadValue.startsWith("not applicable")
														? "Field does not apply to this column"
														: deadValue.startsWith("missing: not collected")
														? "Data was not collected for X reason"
														: deadValue.startsWith("missing: not provided")
														? "Data exists but was not provided"
														: deadValue.startsWith("missing: restricted access")
														? "Data cannot be shared due to restrictions"
														: "Data should exist but is unavailable"}
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>

						<h4 className="text-lg font-medium mb-2 mt-12">User Defined Terms</h4>
						<p className="mb-4">
							If you have data fields which you want in your templates that are NOT in the FAIRe NOAA checklist (data
							dictionary), you can add them as User Defined terms. As mentioned in the{" "}
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
								Project ID: The project_id must be identical across all metadata files (project, sample, etc.) to link
								them together.
							</li>
							<li>
								Analysis Run Names: Verify that each analysis file's analysis_run_name is correct in each
								analysisMetadata file, and is unique for each analysis.
							</li>
							<li>
								Assay-Specific vs. Project-Level Data: In the project metadata, fields can apply to all analyses
								(denoted by a value in the project_level column) or they may have a different value per assay. For assay
								specific values, use the corresponding assay-specific column (e.g., "ssu16sv4v5-emp" or "ssu18sv9-emp").
							</li>
						</ul>
						<p className="font-bold">
							{" "}
							Once you have filled in your Google Sheet, download each sheet as a TSV File, and you are ready to submit
							to the Ocean DNA Explorer!
						</p>
					</>
				)
			},
			{
				id: "project-submissions",
				title: "Project Submissions",
				content: (
					<>
						<p className="mb-4">
							Any metadata file submitted to the Ocean DNA Explorer must be in TSV format. To submit a project, you'll need to submit one
							or more analyses alongside it.
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
							Any metadata file submitted to the Ocean DNA Explorer must be in TSV format. Analyses can be submitted WITHOUT a project, as
							long as the project it is related to is already uploaded to the Ocean DNA Explorer.
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
							{" "}
							<Link className="link link-primary" href="https://github.com/baydenwillms/edna2obis-3.0/tree/main">
								edna2obis
							</Link>{" "}
							converts the Ocean DNA Explorer input files to the expected format for submission to OBIS (Ocean Biodiversity Information
							System), and GBIF (Global Biodiversity Information Facility). its input file structure MATCHES that of
							the Ocean DNA Explorer, so if you're submitting data here, you can easily submit to OBIS and GBIF as well.
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
				<p className="mb-4">
					The{" "}
					<Link className="link link-primary font-semibold" href="/search">
						Search page
					</Link>{" "}
					allows you to query data across multiple tables in the Ocean DNA Explorer. This is different from the{" "}
					<Link className="link link-primary font-semibold" href="#explore">
						Explore pages
					</Link>
					, which let you filter and browse data within a single table at a time.
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
							The Search page provides an advanced query builder that lets you construct complex filters across
							different data tables.
						</p>
						<p className="mb-4">To use the Search page:</p>
						<ol className="list-decimal ml-6 mb-4">
							<li>Select which table you want to search (Projects, Samples, Analyses, Features, or Taxonomies)</li>
							<li>Add filters using the query builder to specify your search criteria</li>
							<li>
								Filters can include conditions based on fields from related tables (e.g., search for Samples where the
								Project's institution is "NOAA")
							</li>
							<li>Combine multiple filters using AND/OR logic: Each filter and/or relation is combined with AND logic. You can add an OR condition (the filters and/or relations within the OR group are combined with OR logic), and the OR block itself is combined with the other filters and/or relations with AND logic (the same as any other filter or relation).</li>
							<li>View the results that match your query</li>
						</ol>
						<p className="mb-4">
							The key advantage of the Search page is that it allows you to query across table relationships, which is
							not possible on individual Explore pages.
						</p>
					</>
				)
			},
			{
				id: "search-vs-explore",
				title: "Search vs Explore",
				content: (
					<>
						<p className="mb-4">Understanding when to use Search versus Explore:</p>
						<div className="mb-4">
							<h4 className="font-semibold mb-2">
								Use the{" "}
								<Link className="link link-primary" href="/search">
									Search Page
								</Link>{" "}
								when:
							</h4>
							<ul className="list-disc ml-6 mb-4">
								<li>You need to query across multiple tables (e.g., find taxonomies from a specific project)</li>
								<li>You want to filter based on relationships between different data types</li>
								<li>You need complex query logic with multiple conditions</li>
							</ul>
						</div>
						<div className="mb-4">
							<h4 className="font-semibold mb-2">
								Use the{" "}
								<Link className="link link-primary" href="/explore">
									Explore Pages
								</Link>{" "}
								when:
							</h4>
							<ul className="list-disc ml-6 mb-4">
								<li>You want to browse all data in a single table</li>
								<li>You only need to filter within one table's own fields</li>
								<li>You want a quick overview of available data in a category</li>
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
							Here are some common query patterns. Click the cards below to open the Search page with these filters
							pre-filled:
						</p>

						<div className="flex gap-8">
							<Link href='/search/advanced?table=sample&advanced=[["project_id","equals","noaa-aoml-gomecc4"]]'>
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

							<Link href='/search/advanced?table=taxonomy&advanced=[["sample","samp_name","equals","GOMECC4_27N_Sta1_Deep_A"]]'>
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
						Explore pages
					</Link>{" "}
					let you browse and filter data within individual tables in the Ocean DNA Explorer. Each table (Projects, Samples, Analyses,
					Features, Taxonomies) has its own dedicated Explore page with specialized filters and visualization options.
				</p>
				<p className="mb-4">
					<strong>Key features of Explore pages:</strong>
				</p>
				<ul className="list-disc ml-6 mb-4">
					<li>Switch between different tables using the tab buttons at the top</li>
					<li>Apply filters from the sidebar on the left to narrow down results</li>
					<li>Use the search bar at the top to search across all columns</li>
					<li>Search within specific columns using the column header search inputs</li>
					<li>View detailed information by clicking on individual records</li>
				</ul>
				<p className="mb-4">
					<strong>Note:</strong> Explore pages only filter data within the selected table. To query across multiple
					tables (e.g., find all taxonomies in a specific project), use the{" "}
					<Link className="link link-primary font-semibold" href="#search">
						Search page
					</Link>{" "}
					instead.
				</p>
			</>
		),
		subsections: [
			{
				id: "searching-on-explore",
				title: "Searching on Explore Pages",
				content: (
					<>
						<p className="mb-4">
							Each Explore page has its own built-in search capabilities for quick filtering within that specific table.
						</p>
						<div className="mb-4">
							<h4 className="font-semibold mb-2">Features on Explore Pages:</h4>
							<ul className="list-disc ml-6 mb-4">
								<li>
									<strong>Global search bar:</strong> Located at the top of the table, this searches across all
									columns simultaneously
								</li>
								<li>
									<strong>Column-specific search:</strong> Each column has its own search input in the header, allowing
									you to filter by that specific field
								</li>
								<li>
									<strong>Filter sidebar:</strong> Use the filters on the left side to narrow results by specific
									criteria
								</li>
							</ul>
						</div>
						<p className="mb-4">
							<strong>Important limitation:</strong> Explore page searches only work within that table's own data. You
							cannot filter Samples based on Project properties using the Sample Explore page. For cross-table queries,
							use the{" "}
							<Link className="link link-primary" href="#search">
								Search page
							</Link>{" "}
							instead.
						</p>
					</>
				)
			},
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
							Analyses are bioinformatic processing runs that convert raw sequence data into occurrences (counts) of features (species), documenting all parameters and methods used.
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
							<Link className="link link-primary" href="/contribute">
								here
							</Link>
							.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I use the API?</h4>
						<p>
							A: The API has a dedicated{" "}
							<Link className="link link-primary" href="/api">
								documentation page
							</Link>
							, or you can use the Explore page to view the data through the website.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do I contact the Ocean DNA Explorer team?</h4>
						<p>
							A: Please contact us via the{" "}
							<Link className="link link-primary" href="https://github.com/aomlomics/node/issues">
								GitHub issues page
							</Link>
							.
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
						<h4 className="font-medium mb-2">Q: How do I cite data from the Ocean DNA Explorer?</h4>
						<p>
							A: Each project has a project_contact, recordedBy, institution, and institutionID, which can be used to
							cite the project.
						</p>
					</div>

					<div>
						<h4 className="font-medium mb-2">Q: How do you protect our personal data?</h4>
						<p>
							A: There is no personal data stored in the Ocean DNA Explorer database. User authentication is handled by the platform's
							reputableauthentication provider, Clerk, and all data is stored in a secure database.
						</p>
					</div>
				</div>
			</>
		)
	}
];
