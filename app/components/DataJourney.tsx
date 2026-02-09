"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const OceanGlobe = dynamic(() => import("@/app/components/OceanGlobe"), {
	ssr: false,
	loading: () => (
		<div className="aspect-square w-full max-w-xs mx-auto bg-base-200/50 rounded-full animate-pulse" />
	)
});

import TaxonomyLaptop from "@/app/components/TaxonomyLaptop";
import AnalysisLaptop from "@/app/components/AnalysisLaptop";

// Database table blurb with link to explore page
function TableBlurb({ 
	title, 
	href, 
	children,
	className = "",
	accent = true
}: { 
	title: string; 
	href: string;
	children: React.ReactNode;
	className?: string;
	accent?: boolean;
}) {
	return (
		<div className={`${accent ? "border-l-2 border-primary/25 pl-5" : ""} ${className}`}>
			<h3 className="text-xl sm:text-2xl font-semibold text-primary mb-2">{title}</h3>
			<p className="text-sm sm:text-base text-base-content/80 leading-relaxed mb-3">
				{children}
			</p>
			<Link 
				href={href} 
				target="_blank"
				className="inline-flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary hover:underline transition-colors"
			>
				Show me {title}s
				<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
				</svg>
			</Link>
		</div>
	);
}

// Process step blurb (not a database table)
function ProcessBlurb({ 
	title, 
	children,
	className = "",
	accent = true
}: { 
	title: string; 
	children: React.ReactNode;
	className?: string;
	accent?: boolean;
}) {
	return (
		<div className={`${accent ? "border-l-2 border-base-content/15 pl-5" : ""} ${className}`}>
			<h3 className="text-xl sm:text-2xl font-semibold text-base-content mb-2">{title}</h3>
			<p className="text-sm sm:text-base text-base-content/80 leading-relaxed">
				{children}
			</p>
		</div>
	);
}

// Section header
function SectionHeader({ children }: { children: React.ReactNode }) {
	return (
		<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary text-center mb-8">
			{children}
		</h2>
	);
}

// Full-width section wrapper with waves
function TintedSection({ children }: { children: React.ReactNode }) {
	return (
		<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-200/60 [html[data-theme='dark']_&]:bg-base-300/50">
			{/* Wave at top */}
			<svg
				className="absolute -top-px left-0 w-full h-14 sm:h-20 text-base-100 rotate-180"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					fill="currentColor"
					d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z"
				/>
			</svg>

			<div className="pt-12 sm:pt-14 pb-12 sm:pb-14">
				{children}
			</div>

			{/* Wave at bottom */}
			<svg
				className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					fill="currentColor"
					d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z"
				/>
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
			<section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-14 sm:pb-16">
				<div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center">
					{/* Left: Text blurb */}
					<div>
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-4">
							The Invisible Signature of Life
						</h2>
						<p className="text-base sm:text-lg text-base-content/80 leading-relaxed">
							Every organism leaves behind traces of genetic material in its environment. 
							By sampling water or sediment, we can detect this environmental DNA (eDNA)—
							shed through skin cells, scales, mucus, waste, and decay. A single water sample 
							contains the genetic fingerprints of an entire community.
						</p>
					</div>

					{/* Right: Water drop diagram */}
					<div className="relative w-full h-[360px] sm:h-[440px] lg:h-[520px]">
						<Image
							src="/images/biorender/water_drop.png"
							alt="Sources of environmental DNA in water"
							fill
							sizes="(max-width: 1024px) 100vw, 700px"
							className="object-contain"
							priority
						/>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 1: THE EXPEDITION */}
			{/* ============================================ */}
			<TintedSection>
				<div className="max-w-7xl mx-auto px-4 sm:px-6">
					<SectionHeader>The Expedition</SectionHeader>

					<div className="space-y-12 lg:space-y-16">
						{/* Ship with CTD + Project & Sample Collection blurbs */}
						<div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-center">
							{/* Ship image */}
							<div className="relative w-full h-[300px] sm:h-[380px] lg:h-[460px]">
								<Image
									src="/images/biorender/ship_with_ctd.png"
									alt="Research vessel deploying CTD rosette"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain"
									priority
								/>
							</div>

							{/* Project + Sample Collection blurbs, stacked */}
							<div className="space-y-8">
								<TableBlurb title="Project" href="/explore/project">
									Research initiatives collecting eDNA samples. Projects organize sampling cruises, 
									define research objectives, and link all downstream data to a single scientific effort.
								</TableBlurb>

								<ProcessBlurb title="Sample Collection">
									Capturing an environmental snapshot. A CTD cast links biological data to 
									physical ocean measurements—latitude, longitude, depth, temperature, and 
									salinity—at the moment of collection.
								</ProcessBlurb>
							</div>
						</div>

						{/* Sample blurb + Sample bio image */}
						<div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center">
							{/* Sample blurb */}
							<TableBlurb title="Sample" href="/explore/sample">
								The physical material. This table tracks filtration volumes, pore sizes, and 
								storage conditions (e.g., -80°C) before DNA extraction.
							</TableBlurb>

							{/* Sample bio image */}
							<div className="relative w-full h-[260px] sm:h-[340px] lg:h-[400px]">
								<Image
									src="/images/biorender/sample_bio.png"
									alt="CTD to Niskin to sample bottles workflow"
									fill
									sizes="(max-width: 1024px) 100vw, 760px"
									className="object-contain"
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
			<section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
				<SectionHeader>Into the Lab</SectionHeader>

				<div className="space-y-12 lg:space-y-16">
					{/* DNA Extraction: text left, image right */}
					<div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 lg:gap-10 items-center">
						<ProcessBlurb title="DNA Extraction">
							This is the bridge from the field to the bench. We isolate the total environmental 
							DNA (eDNA) from the biomass captured on the filters, moving from liters of seawater 
							to microliters of genetic material.
						</ProcessBlurb>

						<div className="relative w-full h-[240px] sm:h-[300px] lg:h-[350px]">
							<Image
								src="/images/biorender/dna_extraction.png"
								alt="DNA extraction workflow"
								fill
								sizes="(max-width: 1024px) 100vw, 700px"
								className="object-contain"
							/>
						</div>
					</div>

					{/* Assay: image left, text right */}
					<div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-10 items-center">
						<div className="relative w-full h-[240px] sm:h-[300px] lg:h-[350px]">
							<Image
								src="/images/biorender/second_wetlab_step.png"
								alt="PCR amplification targeting specific genetic markers"
								fill
								sizes="(max-width: 1024px) 100vw, 700px"
								className="object-contain"
							/>
						</div>

						<TableBlurb title="Assay" href="/explore/assay">
							The Assay table is your &quot;molecular lens.&quot; It stores the static definitions of the 
							primers used to &quot;hook&quot; and find specific biological groups (like fish or bacteria) 
							within the total eDNA pool.
						</TableBlurb>
					</div>

					{/* Thermocycler + AssayPrep & Pooling */}
					<div>
						<div className="relative w-full max-w-4xl mx-auto h-[220px] sm:h-[300px] lg:h-[350px]">
							<Image
								src="/images/biorender/thermocycler.png"
								alt="Thermocycler PCR amplification"
								fill
								sizes="(max-width: 1024px) 100vw, 900px"
								className="object-contain"
							/>
						</div>

						<div className="mt-8 grid md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto">
							<TableBlurb title="AssayPrep" href="/explore/assayPrep">
								The action record. This table documents exactly how the DNA was &quot;cooked&quot; in the 
								thermocycler: the temperatures, cycle counts, and master mixes used.
							</TableBlurb>

							<ProcessBlurb title="Pooling &amp; Indexing">
								Individual amplified samples are combined into a single &quot;Pool.&quot; Every fragment 
								is tagged with a unique molecular barcode so the computer can identify its origin later.
							</ProcessBlurb>
						</div>
					</div>

					{/* Library + Sequencing */}
					<div>
						<div className="relative w-full max-w-4xl mx-auto h-[220px] sm:h-[300px] lg:h-[350px]">
							<Image
								src="/images/biorender/library_bio.png"
								alt="Sequencing workflow"
								fill
								sizes="(max-width: 1024px) 100vw, 900px"
								className="object-contain"
							/>
						</div>

						<div className="mt-8 grid md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto">
							<TableBlurb title="Library" href="/explore/library">
								The Library table tracks the transition from liquid to data. It records the sequencing 
								platform, the specific barcodes used, and the final raw &quot;read count&quot; of sequences 
								generated by the machine.
							</TableBlurb>

							<ProcessBlurb title="Sequencing">
								The pooled library enters the sequencer, where millions of DNA fragments are read 
								simultaneously, converting molecular information into digital data.
							</ProcessBlurb>
						</div>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 3: DIGITAL DISCOVERY */}
			{/* ============================================ */}
			<TintedSection>
				<div className="max-w-7xl mx-auto px-4 sm:px-6">
					<SectionHeader>Digital Discovery</SectionHeader>

					<div className="space-y-12 lg:space-y-16">
						{/* Analysis with animated laptop */}
						<div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-center">
							<div className="relative w-full h-[280px] sm:h-[360px] lg:h-[420px]">
								<AnalysisLaptop className="w-full h-full" />
							</div>

							<TableBlurb title="Analysis" href="/explore/analysis">
								The digital audit trail. This table records the software versions (like DADA2), 
								the quality filters, and the parameters used to &quot;denoise&quot; raw data into clean 
								biological signals.
							</TableBlurb>
						</div>

						{/* Feature: blurb left, image right */}
						<div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 lg:gap-10 items-center">
							<TableBlurb title="Feature" href="/explore/feature">
								The collapse of millions of individual reads into unique &quot;fingerprints&quot; called Features. 
								This table is a dictionary of every unique DNA sequence discovered, allowing us to 
								track specific organisms across different oceans and years.
							</TableBlurb>

							<div className="relative w-full h-[320px] sm:h-[420px] lg:h-[500px]">
								<Image
									src="/images/biorender/feature_bio.png"
									alt="Feature identification from sequence data"
									fill
									sizes="(max-width: 1024px) 100vw, 700px"
									className="object-contain"
								/>
							</div>
						</div>

						{/* Taxonomy & Assignment with animated laptop */}
						<div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
							<div className="relative w-full h-[280px] sm:h-[360px] lg:h-[420px]">
								<TaxonomyLaptop className="w-full h-full" />
							</div>

							<div className="space-y-8">
								<TableBlurb title="Taxonomy" href="/explore/taxonomy">
									Naming the DNA. Taxonomy stores scientific names from Kingdom to Species, 
									providing the biological identity behind each genetic sequence.
								</TableBlurb>

								<TableBlurb title="Assignment" href="/explore/assignment">
									The final identity. Assignment records our statistical confidence telling 
									users how sure we are that a DNA sequence belongs to a specific animal.
								</TableBlurb>
							</div>
						</div>

						{/* Occurrence with Globe - centered */}
						<div className="flex flex-col items-center">
							<div className="w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[560px] mb-6">
								<OceanGlobe className="w-full" />
							</div>

							<TableBlurb title="Occurrence" href="/explore/occurrence" accent={false} className="max-w-lg text-center">
								The heart of the database. The Occurrence table records exactly how many times 
								each DNA fingerprint (Feature) was detected in each specific bottle of water (Sample).
							</TableBlurb>
						</div>
					</div>
				</div>
			</TintedSection>

			{/* Closing */}
			<div className="py-12 text-center">
				<p className="text-base text-base-content/60 italic">
					From ocean to database — every step connected, every observation traceable.
				</p>
			</div>
		</div>
	);
}
