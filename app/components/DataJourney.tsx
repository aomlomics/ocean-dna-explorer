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
	className = ""
}: { 
	title: string; 
	href: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<h3 className="text-xl sm:text-2xl font-semibold text-primary mb-2">{title}</h3>
			<p className="text-sm sm:text-base text-base-content/80 leading-relaxed mb-2">
				{children}
			</p>
			<Link 
				href={href} 
				target="_blank"
				className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
	className = ""
}: { 
	title: string; 
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
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
		<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary text-center mb-10">
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
				className="absolute -top-px left-0 w-full h-12 sm:h-16 text-base-100"
				viewBox="0 0 1440 100"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					fill="currentColor"
					d="M0,100 C360,20 1080,20 1440,100 L1440,0 L0,0 Z"
				/>
			</svg>

			<div className="pt-16 sm:pt-20 pb-16 sm:pb-20">
				{children}
			</div>

			{/* Wave at bottom */}
			<svg
				className="absolute -bottom-px left-0 w-full h-12 sm:h-16 text-base-100"
				viewBox="0 0 1440 100"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path
					fill="currentColor"
					d="M0,0 C360,80 1080,80 1440,0 L1440,100 L0,100 Z"
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
			<section className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-12">
				<div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 items-center">
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

					{/* Right: Water drop diagram - LARGE */}
					<div className="relative w-full h-[380px] sm:h-[480px] lg:h-[550px]">
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
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<SectionHeader>The Expedition</SectionHeader>

					{/* Ship with CTD - LARGE */}
					<div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 items-start mb-10">
						{/* Left: Project + Sample Collection blurbs stacked */}
						<div className="space-y-8">
							<TableBlurb title="Project" href="/explore/project" className="max-w-md">
								Research initiatives collecting eDNA samples. Projects organize sampling cruises, 
								define research objectives, and link all downstream data to a single scientific effort.
							</TableBlurb>

							<ProcessBlurb title="Sample Collection" className="max-w-md">
								Capturing an environmental snapshot. A CTD cast links biological data to 
								physical ocean measurements—latitude, longitude, depth, temperature, and 
								salinity—at the moment of collection.
							</ProcessBlurb>
						</div>

						{/* Right: Ship image - LARGE */}
						<div className="relative w-full h-[320px] sm:h-[420px] lg:h-[500px]">
							<Image
								src="/images/biorender/ship_with_ctd.png"
								alt="Research vessel deploying CTD rosette"
								fill
								sizes="(max-width: 1024px) 100vw, 700px"
								className="object-contain"
								priority
							/>
						</div>
					</div>

					{/* CTD → Niskin → Bottles + Sample blurb */}
					<div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
						{/* Flow diagram - CTD BIGGEST, Niskin smallest, bottles medium */}
						<div className="flex items-end justify-center lg:justify-start gap-3 sm:gap-5">
							{/* CTD - LARGEST */}
							<div className="relative h-[220px] sm:h-[320px] lg:h-[400px] w-[140px] sm:w-[200px] lg:w-[250px] shrink-0">
								<Image
									src="/images/biorender/ctd_light_mode.png"
									alt="CTD instrument"
									fill
									sizes="250px"
									className="object-contain [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/biorender/ctd_dark_mode.png"
									alt="CTD instrument"
									fill
									sizes="250px"
									className="object-contain hidden [html[data-theme='dark']_&]:block"
								/>
							</div>

							{/* Arrow */}
							<svg viewBox="0 0 50 24" className="w-8 sm:w-12 h-5 text-primary shrink-0 mb-20 sm:mb-32 lg:mb-40" aria-hidden="true">
								<path d="M2,12 L38,12 M32,6 L38,12 L32,18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>

							{/* Niskin - SMALLEST */}
							<div className="relative h-[120px] sm:h-[180px] lg:h-[220px] w-[35px] sm:w-[50px] lg:w-[65px] shrink-0">
								<Image
									src="/images/biorender/niskin_bottle.png"
									alt="Niskin bottle"
									fill
									sizes="65px"
									className="object-contain"
								/>
							</div>

							{/* Arrow */}
							<svg viewBox="0 0 50 24" className="w-8 sm:w-12 h-5 text-primary shrink-0 mb-20 sm:mb-32 lg:mb-40" aria-hidden="true">
								<path d="M2,12 L38,12 M32,6 L38,12 L32,18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>

							{/* Sample bottles - MEDIUM */}
							<div className="flex items-end -space-x-4 sm:-space-x-6 shrink-0">
								<div className="relative h-[100px] sm:h-[150px] lg:h-[190px] w-[50px] sm:w-[70px] lg:w-[90px]">
									<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="90px" className="object-contain" />
								</div>
								<div className="relative h-[95px] sm:h-[140px] lg:h-[175px] w-[50px] sm:w-[70px] lg:w-[90px]">
									<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="90px" className="object-contain" />
								</div>
								<div className="relative h-[100px] sm:h-[150px] lg:h-[190px] w-[50px] sm:w-[70px] lg:w-[90px]">
									<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="90px" className="object-contain" />
								</div>
							</div>
						</div>

						{/* Sample blurb */}
						<TableBlurb title="Sample" href="/explore/sample" className="max-w-md">
							The physical material. This table tracks filtration volumes, pore sizes, and 
							storage conditions (e.g., -80°C) before DNA extraction.
						</TableBlurb>
					</div>
				</div>
			</TintedSection>

			{/* ============================================ */}
			{/* SECTION 2: INTO THE LAB */}
			{/* ============================================ */}
			<section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
				<SectionHeader>Into the Lab</SectionHeader>

				{/* DNA Extraction */}
				<div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 items-center mb-12">
					<ProcessBlurb title="DNA Extraction" className="max-w-md">
						This is the bridge from the field to the bench. We isolate the total environmental 
						DNA (eDNA) from the biomass captured on the filters, moving from liters of seawater 
						to microliters of genetic material.
					</ProcessBlurb>

					<div className="relative w-full h-[200px] sm:h-[280px] lg:h-[340px]">
						<Image
							src="/images/biorender/dna_extraction.png"
							alt="DNA extraction workflow"
							fill
							sizes="(max-width: 1024px) 100vw, 600px"
							className="object-contain"
						/>
					</div>
				</div>

				{/* Assay */}
				<div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center mb-12">
					<div className="relative w-full h-[220px] sm:h-[320px] lg:h-[400px]">
						<Image
							src="/images/biorender/second_wetlab_step.png"
							alt="PCR amplification targeting specific genetic markers"
							fill
							sizes="(max-width: 1024px) 100vw, 650px"
							className="object-contain"
						/>
					</div>

					<TableBlurb title="Assay" href="/explore/assay" className="max-w-md">
						The Assay table is your &quot;molecular lens.&quot; It stores the static definitions of the 
						primers used to &quot;hook&quot; and find specific biological groups (like fish or bacteria) 
						within the total eDNA pool.
					</TableBlurb>
				</div>

				{/* Thermocycler + AssayPrep + Pooling */}
				<div className="mb-12">
					<div className="relative w-full h-[180px] sm:h-[280px] lg:h-[360px] mb-6">
						<Image
							src="/images/biorender/thermocycler.png"
							alt="Thermocycler PCR amplification"
							fill
							sizes="(max-width: 1280px) 100vw, 900px"
							className="object-contain"
						/>
					</div>

					<div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
						<TableBlurb title="AssayPrep" href="/explore/assayPrep" className="max-w-md">
							The action record. This table documents exactly how the DNA was &quot;cooked&quot; in the 
							thermocycler: the temperatures, cycle counts, and master mixes used.
						</TableBlurb>

						<ProcessBlurb title="Pooling &amp; Indexing" className="max-w-md">
							Individual amplified samples are combined into a single &quot;Pool.&quot; Every fragment 
							is tagged with a unique molecular barcode so the computer can identify its origin later.
						</ProcessBlurb>
					</div>
				</div>

				{/* Library + Sequencing */}
				<div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 items-center">
					<div className="space-y-6">
						<TableBlurb title="Library" href="/explore/library" className="max-w-md">
							The Library table tracks the transition from liquid to data. It records the sequencing 
							platform, the specific barcodes used, and the final raw &quot;read count&quot; of sequences 
							generated by the machine.
						</TableBlurb>

						<ProcessBlurb title="Sequencing" className="max-w-md">
							The pooled library enters the sequencer, where millions of DNA fragments are read 
							simultaneously, converting molecular information into digital data.
						</ProcessBlurb>
					</div>

					<div className="relative w-full h-[200px] sm:h-[280px] lg:h-[360px]">
						<Image
							src="/images/biorender/library_bio.png"
							alt="Sequencing workflow"
							fill
							sizes="(max-width: 1024px) 100vw, 600px"
							className="object-contain"
						/>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 3: DIGITAL DISCOVERY */}
			{/* ============================================ */}
			<TintedSection>
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<SectionHeader>Digital Discovery</SectionHeader>

					{/* Analysis with animated laptop */}
					<div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center mb-14">
						<div className="relative w-full h-[280px] sm:h-[380px] lg:h-[450px]">
							<AnalysisLaptop className="w-full h-full" />
						</div>

						<TableBlurb title="Analysis" href="/explore/analysis" className="max-w-md">
							The digital audit trail. This table records the software versions (like DADA2), 
							the quality filters, and the parameters used to &quot;denoise&quot; raw data into clean 
							biological signals.
						</TableBlurb>
					</div>

					{/* Feature - CENTERED, LARGE */}
					<div className="flex flex-col items-center mb-14">
						<div className="relative w-full max-w-4xl h-[320px] sm:h-[440px] lg:h-[540px] mb-4">
							<Image
								src="/images/biorender/feature_bio.png"
								alt="Feature identification from sequence data"
								fill
								sizes="(max-width: 1024px) 100vw, 900px"
								className="object-contain"
							/>
						</div>

						<TableBlurb title="Feature" href="/explore/feature" className="max-w-xl text-center">
							The collapse of millions of individual reads into unique &quot;fingerprints&quot; called Features. 
							This table is a dictionary of every unique DNA sequence discovered, allowing us to 
							track specific organisms across different oceans and years.
						</TableBlurb>
					</div>

					{/* Taxonomy & Assignment with animated laptop */}
					<div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center mb-14">
						<div className="relative w-full h-[280px] sm:h-[380px] lg:h-[450px]">
							<TaxonomyLaptop className="w-full h-full" />
						</div>

						<div className="space-y-6">
							<TableBlurb title="Taxonomy" href="/explore/taxonomy" className="max-w-md">
								Naming the DNA. Taxonomy stores scientific names from Kingdom to Species, 
								providing the biological identity behind each genetic sequence.
							</TableBlurb>

							<TableBlurb title="Assignment" href="/explore/assignment" className="max-w-md">
								The final identity. Assignment records our statistical confidence telling 
								users how sure we are that a DNA sequence belongs to a specific animal.
							</TableBlurb>
						</div>
					</div>

					{/* Occurrence with Globe - CENTERED */}
					<div className="flex flex-col items-center">
						<div className="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[580px] mb-4">
							<OceanGlobe className="w-full" />
						</div>

						<TableBlurb title="Occurrence" href="/explore/occurrence" className="max-w-lg text-center">
							The heart of the database. The Occurrence table records exactly how many times 
							each DNA fingerprint (Feature) was detected in each specific bottle of water (Sample).
						</TableBlurb>
					</div>
				</div>
			</TintedSection>

			{/* Closing */}
			<div className="py-10 text-center">
				<p className="text-base text-base-content/60 italic">
					From ocean to database — every step connected, every observation traceable.
				</p>
			</div>
		</div>
	);
}
