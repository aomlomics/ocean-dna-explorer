"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const OceanGlobe = dynamic(() => import("@/app/components/learn/OceanGlobe"), {
	ssr: false,
	loading: () => <div className="aspect-square w-full max-w-xs mx-auto bg-base-200/50 rounded-full animate-pulse" />
});

import TaxonomyLaptop from "@/app/components/learn/TaxonomyLaptop";
import AnalysisLaptop from "@/app/components/learn/AnalysisLaptop";
import TableMetadata, { type DataTableNames } from "@/types/tableMetadata";

// Tables that appear in the data journey (have descriptions in TableMetadata)
type DataJourneyTableKey = (typeof DataTableNames)[0];

// Database table blurb with link to explore page. Uses TableMetadata description when table is set; children = supplemental text.
function TableBlurb({
	title,
	href,
	table,
	children,
	className = "",
	centerTitle = false
}: {
	title: string;
	href: string;
	table?: DataJourneyTableKey;
	children?: React.ReactNode;
	className?: string;
	centerTitle?: boolean;
}) {
	const description = table != null ? TableMetadata[table].description : null;
	const definitionPrefix = description ? (children ? " " : "") : null;
	const linkPlural = table != null ? TableMetadata[table].plural : `${title}s`;
	return (
		<div className={`rounded-2xl p-4 sm:p-5 ${className}`}>
			<div className={`flex flex-wrap items-center gap-2 mb-2 ${centerTitle ? "justify-center" : ""}`}>
				<h3 className="text-xl sm:text-2xl font-semibold text-primary">{title}</h3>
				<span className="rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-medium">
					Database table
				</span>
			</div>
			<p className="text-sm sm:text-base text-base-content/80 leading-relaxed mb-3">
				{children}
				{definitionPrefix}
				{description ? (
					<>
						<span className="text-primary">ODE Definition: </span>
						{description}
					</>
				) : null}
			</p>
			<Link
				href={href}
				target="_blank"
				className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline transition-colors"
			>
				Show me {linkPlural}
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</Link>
		</div>
	);
}

// Process step blurb (not a database table)
function ProcessBlurb({
	title,
	children,
	className = ""
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`rounded-2xl p-4 sm:p-5 ${className}`}>
			<h3 className="text-xl sm:text-2xl font-semibold text-base-content mb-2">{title}</h3>
			<p className="text-sm sm:text-base text-base-content/80 leading-relaxed">{children}</p>
		</div>
	);
}

// Section header
function SectionHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<h2 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary text-center mb-8 ${className}`}>
			{children}
		</h2>
	);
}

// Full-width section wrapper with waves
function TintedSection({ children }: { children: React.ReactNode }) {
	return (
		<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] bg-base-200/60 [html[data-theme='dark']_&]:bg-base-300/50">
			{/* Wave at top */}
			<svg
				className="absolute -top-px left-0 w-full h-14 sm:h-20 text-base-100 rotate-180"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
			</svg>

			<div className="pt-10 sm:pt-12 pb-10 sm:pb-12">{children}</div>

			{/* Wave at bottom */}
			<svg
				className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
			</svg>
		</section>
	);
}

export default function DataJourney() {
	return (
		<div className="relative">
			{/* ============================================ */}
			{/* INTRO: How eDNA Appears in Water */}
			{/* ============================================ */}
			<section className="max-w-7xl mx-auto px-8 sm:px-6 pt-2 sm:pb-8">
				<div id="step1" className="grid lg:grid-cols-[1fr_1.3fr] pb-8 gap-4 lg:gap-8 items-center">
					{/* Left: Text blurb */}
					<div>
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-4">
							An Invisible Signature of Life
						</h2>
						<p className="text-base sm:text-lg text-base-content/80 leading-relaxed">
							Every organism, whether it be a microbe or a whale, leaves behind traces of genetic material in its
							environment. We can detect this environmental DNA (eDNA) by taking a water sample. A single bottle of
							seawater contains the genetic fingerprints of an entire community.
						</p>
					</div>

					{/* Right: Water drop diagram */}
					<div className="relative w-full h-90 sm:h-110 lg:h-130 overflow-hidden">
						<Image
							src="/images/biorender/water_drop.png"
							alt="Sources of environmental DNA in water"
							fill
							sizes="(max-width: 1024px) 180vw, 1200px"
							className="object-contain scale-[1.22] sm:scale-[1.31] lg:scale-[1.28] [html[data-theme='dark']_&]:hidden"
							priority
						/>
						<Image
							src="/images/biorender/water_drop_dark.png"
							alt="Sources of environmental DNA in water"
							fill
							sizes="(max-width: 1024px) 180vw, 1200px"
							className="object-contain scale-[1.22] sm:scale-[1.31] lg:scale-[1.28] hidden [html[data-theme='dark']_&]:block"
							priority
						/>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 1: THE EXPEDITION */}
			{/* ============================================ */}
			<TintedSection>
				<div id="step2" className="max-w-7xl mx-auto pt-10 px-4 sm:px-6">
					<SectionHeader>The Expedition</SectionHeader>

					<div className="space-y-1 lg:space-y-2 pb-6">
						{/* Ship with CTD + Project & Sample Collection blurbs */}
						<div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-8 items-center">
							{/* Ship image */}
							<div className="relative w-full h-75 sm:h-95 lg:h-115">
								<Image
									src="/images/biorender/ship_with_ctd.png"
									alt="Research vessel deploying CTD rosette"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
									priority
								/>
								<Image
									src="/images/biorender/ship_with_ctd_dark.png"
									alt="Research vessel deploying CTD rosette"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
									priority
								/>
							</div>

							{/* Project + Sample Collection blurbs, stacked */}
							<div className="space-y-8 ">
								<TableBlurb title="Project" href="/explore/project" table="project">
									A foundational table in the database which brings together all expeditions and scientific objectives
									under a unified project.
								</TableBlurb>

								<ProcessBlurb title="Sample Collection">
									Samples can be taken from different environments like water, sediment, air, soil, and many others.
									Marine water is typically collected with a CTD rosette (seen here), but it can also be collected with
									an autonomous sampler, ROV, by scuba or snorkeling, and more. With proper data management, we can
									connect DNA data with environmental measurements like pH, salinity, and temperature.
								</ProcessBlurb>
							</div>
						</div>

						{/* Sample blurb + Sample bio image */}
						<div id="step3" className="grid lg:grid-cols-[1fr_1.3fr] gap-4 lg:gap-8 items-end">
							{/* Sample blurb */}
							<TableBlurb title="Sample" href="/explore/sample" table="sample">
								A piece of environmental material captured at a distinct place and time. Samples often follow a
								hierarchy: one collection event can include multiple depths, replicate bottles (e.g. A, B, C), and
								negative controls. This table tracks the filtration and storage methods used to preserve the DNA before
								it reaches the lab.
							</TableBlurb>

							{/* Sample bio image */}
							<div className="relative w-full h-65 sm:h-85 lg:h-100">
								<Image
									src="/images/biorender/sample_bio.png"
									alt="CTD to Niskin to sample bottles workflow"
									fill
									sizes="(max-width: 1024px) 100vw, 760px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
									priority
								/>
								<Image
									src="/images/biorender/sample_bio_dark.png"
									alt="CTD to Niskin to sample bottles workflow"
									fill
									sizes="(max-width: 1024px) 100vw, 760px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
									priority
								/>
							</div>
						</div>
					</div>
				</div>
			</TintedSection>

			{/* ============================================ */}
			{/* SECTION 2: INTO THE LAB */}
			{/* ============================================ */}
			<section id="step4" className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-10 sm:pb-12">
				<SectionHeader className="mb-2 sm:mb-3">Into the Lab</SectionHeader>

				<div className="space-y-3 lg:space-y-5">
					{/* Top 3 blocks: keep these tighter together */}
					<div className="space-y-1 lg:space-y-2">
						{/* DNA Extraction: text left, image right */}
						<div className="grid lg:grid-cols-[1fr_1.3fr] gap-4 lg:gap-8 items-center">
							<ProcessBlurb title="DNA Extraction">
								First, we have to extract the DNA from the sampled water. We take the biomass (or living material)
								captured on filters and use chemicals to break open the cells and isolate the DNA. This laboratory
								process turns liters of filtered water into a small volume of purified genetic material we can work with
								in the lab.
							</ProcessBlurb>

							<div className="relative w-full h-60 sm:h-75 lg:h-87.5">
								<Image
									src="/images/biorender/dna_extraction.png"
									alt="DNA extraction workflow"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/biorender/dna_extraction_dark.png"
									alt="DNA extraction workflow"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
								/>
							</div>
						</div>

						{/* Assay: image left, text right */}
						<div id="step5" className="grid lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-8 items-center">
							<div className="relative w-full h-60 sm:h-75 lg:h-87.5">
								<Image
									src="/images/biorender/second_wetlab_step.png"
									alt="PCR amplification targeting specific genetic markers"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/biorender/second_wetlab_step_dark.png"
									alt="PCR amplification targeting specific genetic markers"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
								/>
							</div>

							<TableBlurb title="Assay" href="/explore/assay" table="assay">
								An assay is a molecular lens used to find specific organisms or groups of organisms by defining the
								genetic hooks (called primers) that target specific sequences out of the total environmental DNA mix.
								Primers are designed to only bind to the sequences from specific organisms.
							</TableBlurb>
						</div>

						{/* Thermocycler + AssayPrep & Pooling */}
						<div>
							<div className="relative w-full max-w-5xl mx-auto h-55 sm:h-70 lg:h-80 overflow-hidden">
								<Image
									src="/images/biorender/thermocycler.png"
									alt="Thermocycler PCR amplification"
									fill
									sizes="(max-width: 1024px) 100vw, 900px"
									// Tweak: scale values to “crop” whitespace inside the PNG.
									className="object-contain scale-125 lg:scale-150 [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/biorender/thermocycler_dark.png"
									alt="Thermocycler PCR amplification"
									fill
									sizes="(max-width: 1024px) 100vw, 900px"
									// Tweak: keep in sync with light mode scale values above.
									className="object-contain scale-125 lg:scale-150 hidden [html[data-theme='dark']_&]:block"
								/>
							</div>

							<div id="step6" className="mt-0 grid md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto">
								<TableBlurb title="AssayPrep" href="/explore/assayPrep" table="assayPrep">
									The parameters for the PCR (polymerase chain reaction) used to make copies of a target DNA segment. It
									records the specific thermocycler settings and chemical mixes used to amplify the DNA for further
									processing.
								</TableBlurb>

								<ProcessBlurb title="Pooling &amp; Indexing">
									This step combines multiple amplified samples into a single mixture (pooling) while adding unique
									molecular barcodes to every fragment. These digital tags allow the computer to identify which sample
									each sequence came from after the mixture is sequenced.
								</ProcessBlurb>
							</div>
						</div>
					</div>

					{/* Library + Sequencing */}
					<div>
						<div className="relative w-full max-w-5xl mx-auto h-55 sm:h-70 lg:h-80 overflow-hidden mt-0">
							<Image
								src="/images/biorender/library_bio.png"
								alt="Sequencing workflow"
								fill
								sizes="(max-width: 1024px) 100vw, 900px"
								// Tweak: scale values to “crop” whitespace inside the PNG.
								className="object-contain scale-125 lg:scale-150 [html[data-theme='dark']_&]:hidden"
							/>
							<Image
								src="/images/biorender/library_bio_dark.png"
								alt="Sequencing workflow"
								fill
								sizes="(max-width: 1024px) 100vw, 900px"
								// Tweak: keep in sync with light mode scale values above.
								className="object-contain scale-125 lg:scale-150 hidden [html[data-theme='dark']_&]:block"
							/>
						</div>

						<div id="step7" className="mt-0 grid md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto">
							<TableBlurb title="Library" href="/explore/library" table="library">
								The final collection of prepared DNA that tracks the transition from physical samples to digital files.
								This table records the indexing details and sequencing run parameters.
							</TableBlurb>

							<ProcessBlurb title="Sequencing">
								We load the pooled, barcoded library into a sequencer (e.g. an Illumina machine). The machine reads the
								order of DNA letters (A, T, C, G) in millions of fragments at once, turning the liquid library into
								digital files of raw sequence data for the next step: bioinformatics.
							</ProcessBlurb>
						</div>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 3: DIGITAL DISCOVERY */}
			{/* ============================================ */}
			<TintedSection>
				<div id="step8" className="max-w-7xl mx-auto pt-10 px-4 sm:px-6">
					<SectionHeader className="mb-8 sm:mb-10">Digital Discovery</SectionHeader>

					<div className="space-y-6 lg:space-y-8">
						{/* Analysis with animated laptop */}
						<div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-8 items-center">
							<div className="relative w-full h-70 sm:h-90 lg:h-105">
								<AnalysisLaptop className="w-full h-full" />
							</div>

							<TableBlurb title="Analysis" href="/explore/analysis" table="analysis">
								Raw data is cleaned and processed through software pipelines like{" "}
								<a
									href="https://github.com/aomlomics/tourmaline"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline hover:text-primary-focus"
								>
									Tourmaline
								</a>
								{", seen here, to turn raw data into clear biological results."}
							</TableBlurb>
						</div>

						{/* Feature: blurb left, image right */}
						<div id="step9" className="grid lg:grid-cols-[1fr_1.3fr] gap-4 lg:gap-8 items-center">
							<TableBlurb title="Feature" href="/explore/feature" table="feature">
								A dictionary of unique genetic fingerprints which allows us to track the same organism across different
								samples and studies.
							</TableBlurb>

							<div className="relative w-full h-80 sm:h-105 lg:h-125 lg:-mt-10">
								<Image
									src="/images/biorender/feature_bio.png"
									alt="Feature identification from sequence data"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/biorender/feature_bio_dark.png"
									alt="Feature identification from sequence data"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
								/>
							</div>
						</div>

						{/* Taxonomy & Assignment with animated laptop */}
						<div id="step10" className="pt-0 grid lg:grid-cols-[1.2fr_1fr] gap-4 lg:gap-8 items-center">
							<div className="relative w-full h-70 sm:h-90 lg:h-105">
								<TaxonomyLaptop className="w-full h-full" />
							</div>

							<div className="space-y-4">
								<TableBlurb title="Taxonomy" href="/explore/taxonomy" table="taxonomy">
									This is the official tree of life that provides the hierarchical ranks used to categorize every
									organism in the database.
								</TableBlurb>

								<TableBlurb title="Assignment" href="/explore/assignment" table="assignment">
									This is the bridge where we connect a specific DNA sequence to a taxonomic classification and record
									our confidence in that match.
								</TableBlurb>
							</div>
						</div>

						{/* Occurrence with Globe - centered */}
						<div id="step11" className="flex flex-col items-center">
							<div className="w-full max-w-100 sm:max-w-120 lg:max-w-140 mb-0">
								<OceanGlobe className="w-full" />
							</div>

							<TableBlurb
								title="Occurrence"
								href="/explore/occurrence"
								table="occurrence"
								className="max-w-lg text-center"
								centerTitle
							>
								An occurrence is an organism at a time and place. It links a specific DNA sequence to a taxonomic
								classification and records the confidence in that match.
							</TableBlurb>
						</div>
					</div>
				</div>
			</TintedSection>

			{/* BioRender attribution */}
			<div className="py-12 sm:py-16 flex justify-center">
				<a
					href="https://www.biorender.com"
					target="_blank"
					rel="noopener noreferrer"
					className="flex flex-col items-center gap-2 text-base-content/60 hover:text-base-content/80 transition-colors"
				>
					<Image
						src="/images/biorender/biorender_logo.jpeg"
						alt="BioRender"
						width={360}
						height={120}
						className="h-18 w-auto object-contain"
					/>
					<span className="text-base text-center pt-2">Graphics created using BioRender</span>
				</a>
			</div>
		</div>
	);
}
