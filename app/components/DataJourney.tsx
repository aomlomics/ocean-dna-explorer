"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with canvas
const OceanGlobe = dynamic(() => import("@/app/components/OceanGlobe"), {
	ssr: false,
	loading: () => (
		<div className="aspect-square w-full max-w-xs mx-auto bg-base-200/50 rounded-full animate-pulse" />
	)
});

import TaxonomyLaptop from "@/app/components/TaxonomyLaptop";

// Simple label for database tables
function TableBadge() {
	return (
		<span className="text-xs font-medium tracking-wider uppercase text-primary/70">
			Database Table
		</span>
	);
}

export default function DataJourney() {
	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
			{/* Header */}
			<header className="text-center mb-12 sm:mb-16 space-y-3">
				<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">
					The Ocean DNA Data Journey
				</h2>
				<p className="text-sm sm:text-base lg:text-lg text-base-content/90 max-w-3xl mx-auto leading-relaxed">
					How a drop of seawater becomes global biodiversity knowledge. The Ocean DNA Explorer
					links physical sampling, molecular protocols, and bioinformatics into a single
					connected data model.
				</p>
			</header>

			{/* ============================================ */}
			{/* SECTION 1: THE EXPEDITION */}
			{/* ============================================ */}
			<section className="mb-16 sm:mb-20">
				<h3 className="text-lg sm:text-xl font-semibold text-base-content mb-6 text-center">
					<span className="text-primary">1.</span> The Expedition
				</h3>

				{/* Ship with CTD */}
				<div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-10 items-start mb-8">
					<div className="relative w-full h-[280px] sm:h-[340px] lg:h-[380px]">
						<Image
							src="/images/biorender/ship_with_ctd.png"
							alt="Research vessel deploying CTD rosette into the ocean"
							fill
							sizes="(max-width: 1024px) 100vw, 600px"
							className="object-contain"
							priority
						/>
					</div>
					<div className="space-y-6 lg:pt-8">
						<div>
							<TableBadge />
							<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Project &amp; Sample Collection</h4>
							<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
								<strong>Projects</strong> organize research cruises and define study goals. A CTD cast 
								captures a massive environmental snapshot, linking biological data to precise latitude, 
								longitude, depth, and salinity measurements at the moment of collection.
							</p>
						</div>
						<div>
							<TableBadge />
							<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Sample</h4>
							<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
								The physical material retrieved from the sea. This table tracks the &quot;life&quot; of the 
								individual sample: the volume filtered (e.g., 2L), the filter pore size used, and 
								storage conditions (e.g., -80°C) before it reaches the lab.
							</p>
						</div>
					</div>
				</div>

				{/* CTD → Niskin → Bottles flow */}
				<div className="overflow-x-auto pb-2">
					<div className="flex items-center justify-center gap-3 sm:gap-5 lg:gap-8 min-w-max px-2">
						{/* CTD */}
						<div className="relative h-[180px] sm:h-[220px] lg:h-[260px] w-[100px] sm:w-[130px] lg:w-[160px] shrink-0">
							<Image
								src="/images/biorender/ctd_light_mode.png"
								alt="CTD instrument"
								fill
								sizes="160px"
								className="object-contain [html[data-theme='dark']_&]:hidden"
							/>
							<Image
								src="/images/biorender/ctd_dark_mode.png"
								alt="CTD instrument"
								fill
								sizes="160px"
								className="object-contain hidden [html[data-theme='dark']_&]:block"
							/>
						</div>

						{/* Arrow */}
						<svg viewBox="0 0 60 24" className="w-8 sm:w-10 lg:w-12 h-6 text-primary shrink-0" aria-hidden="true">
							<defs>
								<marker id="arrow1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
									<path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
								</marker>
							</defs>
							<line x1="2" y1="12" x2="48" y2="12" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow1)" />
						</svg>

						{/* Niskin */}
						<div className="relative h-[160px] sm:h-[200px] lg:h-[240px] w-[60px] sm:w-[75px] lg:w-[90px] shrink-0">
							<Image
								src="/images/biorender/niskin_bottle.png"
								alt="Niskin bottle"
								fill
								sizes="90px"
								className="object-contain"
							/>
						</div>

						{/* Arrow */}
						<svg viewBox="0 0 60 24" className="w-8 sm:w-10 lg:w-12 h-6 text-primary shrink-0" aria-hidden="true">
							<defs>
								<marker id="arrow2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
									<path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
								</marker>
							</defs>
							<line x1="2" y1="12" x2="48" y2="12" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrow2)" />
						</svg>

						{/* Sample bottles */}
						<div className="relative h-[160px] sm:h-[200px] lg:h-[240px] w-[160px] sm:w-[200px] lg:w-[240px] shrink-0">
							<div className="absolute left-0 bottom-0 w-[55px] sm:w-[70px] lg:w-[85px] h-[130px] sm:h-[160px] lg:h-[200px]">
								<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="85px" className="object-contain" />
							</div>
							<div className="absolute left-[40px] sm:left-[50px] lg:left-[60px] bottom-2 w-[55px] sm:w-[70px] lg:w-[85px] h-[130px] sm:h-[160px] lg:h-[200px]">
								<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="85px" className="object-contain" />
							</div>
							<div className="absolute left-[80px] sm:left-[100px] lg:left-[120px] bottom-0 w-[55px] sm:w-[70px] lg:w-[85px] h-[130px] sm:h-[160px] lg:h-[200px]">
								<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="85px" className="object-contain" />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 2: WET LAB - EXTRACTION */}
			{/* ============================================ */}
			<section className="mb-16 sm:mb-20">
				<h3 className="text-lg sm:text-xl font-semibold text-base-content mb-6 text-center">
					<span className="text-primary">2.</span> The Wet Lab — Extraction &amp; Definitions
				</h3>

				{/* DNA Extraction image */}
				<div className="relative w-full h-[200px] sm:h-[280px] lg:h-[340px] mb-6">
					<Image
						src="/images/biorender/dna_extraction.png"
						alt="DNA extraction workflow from filters to purified eDNA"
						fill
						sizes="(max-width: 1280px) 100vw, 1000px"
						className="object-contain"
					/>
				</div>

				{/* Three text columns */}
				<div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
					<div>
						<h4 className="text-base sm:text-lg font-semibold text-base-content">DNA Extraction</h4>
						<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
							Moving from liters of water to microliters of genetic material. We isolate 
							total environmental DNA (eDNA) from the biomass captured on filters.
						</p>
					</div>
					<div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Assay (The Blueprint)</h4>
						<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
							The &quot;Molecular Lens.&quot; This table defines the specific DNA primers—the 
							genetic &quot;hooks&quot; designed to target only specific groups (like fish 12S or 
							bacteria 16S).
						</p>
					</div>
					<div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">AssayPrep (The Action)</h4>
						<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
							The real-world lab records. This table documents exactly how the DNA was 
							&quot;cooked&quot; in the thermocycler: the temperatures, cycle counts, and master 
							mixes used.
						</p>
					</div>
				</div>

				{/* Second wet lab step */}
				<div className="relative w-full h-[180px] sm:h-[240px] lg:h-[300px] mt-8">
					<Image
						src="/images/biorender/second_wetlab_step.png"
						alt="PCR amplification and library preparation"
						fill
						sizes="(max-width: 1024px) 100vw, 800px"
						className="object-contain"
					/>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 3: SEQUENCING */}
			{/* ============================================ */}
			<section className="mb-16 sm:mb-20">
				<h3 className="text-lg sm:text-xl font-semibold text-base-content mb-6 text-center">
					<span className="text-primary">3.</span> The Wet Lab — Sequencing
				</h3>

				{/* Thermocycler image */}
				<div className="relative w-full h-[200px] sm:h-[280px] lg:h-[340px] mb-6">
					<Image
						src="/images/biorender/thermocycler.png"
						alt="Thermocycler to sequencer workflow"
						fill
						sizes="(max-width: 1280px) 100vw, 1000px"
						className="object-contain"
					/>
				</div>

				{/* Two text columns */}
				<div className="grid sm:grid-cols-2 gap-6 sm:gap-10 max-w-3xl mx-auto">
					<div>
						<h4 className="text-base sm:text-lg font-semibold text-base-content">Pooling &amp; Indexing</h4>
						<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
							Individual amplified samples are combined into a single &quot;Pool.&quot; Every fragment 
							is tagged with a unique molecular barcode so the computer can identify its 
							origin later.
						</p>
					</div>
					<div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Library</h4>
						<p className="text-sm sm:text-base text-base-content/85 leading-relaxed mt-1">
							The bridge from liquid to digital. This table records the sequencing platform 
							used (e.g., Illumina MiSeq), the barcode indices, and the final raw read 
							counts generated.
						</p>
					</div>
				</div>
			</section>

			{/* ============================================ */}
			{/* SECTION 4: DIGITAL DISCOVERY */}
			{/* ============================================ */}
			<section>
				<h3 className="text-lg sm:text-xl font-semibold text-base-content mb-8 text-center">
					<span className="text-primary">4.</span> Digital Discovery &amp; Results
				</h3>

				{/* 2x2 Grid */}
				<div className="grid sm:grid-cols-2 gap-8 sm:gap-10">
					{/* Analysis */}
					<div className="flex flex-col items-center text-center">
						<div className="w-full max-w-xs p-3 rounded-lg bg-base-200/60 dark:bg-base-300/40 font-mono text-xs mb-4">
							<div className="text-primary"><span className="text-accent">$</span> dada2 --denoise</div>
							<div className="text-base-content/70">├── quality_filter: 0.01</div>
							<div className="text-base-content/70">├── min_overlap: 12</div>
							<div className="text-base-content/70">├── chimera_method: consensus</div>
							<div className="text-success">└── ASVs generated: 2,847</div>
						</div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Analysis</h4>
						<p className="text-sm text-base-content/85 leading-relaxed mt-1 max-w-sm">
							The digital audit trail. Records bioinformatics software and quality filtering 
							thresholds used to &quot;denoise&quot; raw data into clean biological signals.
						</p>
					</div>

					{/* Feature (ASV) */}
					<div className="flex flex-col items-center text-center">
						<div className="mb-4 flex items-center justify-center">
							<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-primary/40 flex items-center justify-center">
								<span className="font-mono text-sm sm:text-base font-semibold text-primary">ACGTACGT</span>
							</div>
						</div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Feature (ASV)</h4>
						<p className="text-sm text-base-content/85 leading-relaxed mt-1 max-w-sm">
							Unique genetic &quot;fingerprints.&quot; Instead of millions of reads, we store unique 
							Amplicon Sequence Variants (ASVs), allowing us to track organisms globally.
						</p>
					</div>

					{/* Taxonomy & Assignment */}
					<div className="flex flex-col items-center text-center">
						<div className="relative w-full max-w-sm h-[220px] sm:h-[260px] lg:h-[280px] mb-2">
							<TaxonomyLaptop className="w-full h-full" />
						</div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Taxonomy &amp; Assignment</h4>
						<p className="text-sm text-base-content/85 leading-relaxed mt-1 max-w-sm">
							Giving the DNA a name. <strong>Taxonomy</strong> stores scientific names, 
							and <strong>Assignment</strong> records our statistical confidence in the match.
						</p>
					</div>

					{/* Occurrence */}
					<div className="flex flex-col items-center text-center">
						<div className="w-full max-w-[220px] sm:max-w-[240px] mb-2">
							<OceanGlobe className="w-full" />
						</div>
						<TableBadge />
						<h4 className="text-base sm:text-lg font-semibold text-primary mt-1">Occurrence</h4>
						<p className="text-sm text-base-content/85 leading-relaxed mt-1 max-w-sm">
							The biological census. The intersection of Sample and Feature, recording 
							exactly how many times a specific organism was detected in a specific bottle of water.
						</p>
					</div>
				</div>
			</section>

			{/* Closing */}
			<div className="mt-12 sm:mt-16 text-center">
				<p className="text-sm sm:text-base text-base-content/70 italic">
					From ocean to database — every step connected, every observation traceable.
				</p>
			</div>
		</div>
	);
}
