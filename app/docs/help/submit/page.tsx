import { AnalysisAsvTablePreview, AnalysisOccurrenceTablePreview } from "@/app/components/docs/DocExampleTables";
import DocsPageSection from "@/app/components/docs/DocsPageSection";
import WorkshopVideoCallout from "@/app/components/WorkshopVideoCallout";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Submit | Help",
	description:
		"Learn how to submit projects and analyses using FAIRe metadata templates, example datasets, and supported data formats, including Tourmaline processing and OBIS/GBIF submission."
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

//TODO: make this page not LORGE
export default function HelpSubmitPage() {
	return (
		<DocsPageSection
			page="help"
			section="submit"
			header={
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
			}
			subsections={[
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
			]}
		/>
	);
}
