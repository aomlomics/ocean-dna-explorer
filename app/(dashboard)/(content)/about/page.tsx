 "use client";

import Image from "next/image";
import Link from "next/link";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";
import { AssigningTaxonomyLoop } from "@/app/components/eDNA_graphic/analysis_viz";
import BasePairMatrix from "@/app/components/BasePairMatrix";
import TableMetadata from "@/types/tableMetadata";

const dataJourneySteps: {
	key: string;
	title: string;
	type: "table" | "concept";
	description: string;
	icon:
		| "project"
		| "ctd"
		| "niskin"
		| "dna"
		| "laptop"
		| "dolphin"
		| "assay"
		| "sampleIcon"
		| "folder"
		| "fish"
		| "eye";
}[] = [
	// Ordered journey:
	// project → sample collection → sample → feature → library →
	// analysis → assay → assayPrep → assignment → taxonomy → occurrence
	{
		key: "project",
		title: "Project",
		type: "table",
		description: TableMetadata.project.description,
		icon: "project"
	},
	{
		key: "sample-collection",
		title: "Sample Collection",
		type: "concept",
		description:
			"Researchers collect seawater and environmental measurements using instruments like CTDs and Niskin bottles, linking each environmental snapshot to downstream DNA data.",
		icon: "ctd"
	},
	{
		key: "sample",
		title: "Sample",
		type: "table",
		description: TableMetadata.sample.description,
		icon: "sampleIcon"
	},
	{
		key: "feature",
		title: "Feature",
		type: "table",
		description: TableMetadata.feature.description,
		icon: "dna"
	},
	{
		key: "library",
		title: "Library",
		type: "table",
		description: TableMetadata.library.description,
		icon: "folder"
	},
	{
		key: "analysis",
		title: "Analysis",
		type: "table",
		description: TableMetadata.analysis.description,
		icon: "laptop"
	},
	{
		key: "assay",
		title: "Assay",
		type: "table",
		description: TableMetadata.assay.description,
		icon: "assay"
	},
	{
		key: "assayPrep",
		title: "AssayPrep",
		type: "table",
		description: TableMetadata.assayPrep.description,
		icon: "dna"
	},
	{
		key: "assignment",
		title: "Assignment",
		type: "table",
		description: TableMetadata.assignment.description,
		icon: "eye"
	},
	{
		key: "taxonomy",
		title: "Taxonomy",
		type: "table",
		description: TableMetadata.taxonomy.description,
		icon: "dolphin"
	},
	{
		key: "occurrence",
		title: "Occurrence",
		type: "table",
		description: TableMetadata.occurrence.description,
		icon: "fish"
	}
];

const desktopDataJourneySteps = dataJourneySteps;
const remainingDesktopTableSteps = desktopDataJourneySteps.filter(
	(step) =>
		step.type === "table" &&
		![
			"project",
			"sample",
			"feature",
			"library",
			"analysis",
			"assay",
			"assayPrep",
			"assignment",
			"taxonomy",
			"occurrence"
		].includes(step.key)
);

const fairModelBlurbs = [
	{
		title: "FAIR eDNA Metadata Standard",
		body: "The Ocean DNA Explorer is built in partnership with the FAIR eDNA community to promote Findable, Accessible, Interoperable, and Reusable (FAIR) practices for eDNA data."
	},
	{
		title: "FAIReSheets",
		body: "FaiReSheets helps generate standardized metadata tables that are ready for Ocean DNA Explorer submission and aligned with FAIR eDNA templates."
	},
	{
		title: "FAIRe2NCBI",
		body: "FaiRe2NCBI streamlines the process of preparing and submitting sequence data and metadata to NCBI archives from FAIR eDNA-compliant tables."
	},
	{
		title: "edna2obis",
		body: "edna2obis converts occurrence data into formats suitable for biodiversity aggregators such as OBIS and GBIF, extending the reach of eDNA observations."
	},
	{
		title: "Tourmaline",
		body: "Tourmaline is an amplicon sequence processing workflow that turns raw sequence data into high-quality features and occurrences ready for analysis."
	},
	{
		title: "NOAA Omics Data Management Guide",
		body: "For more on standards, workflows, and best practices, see the NOAA Omics Data Management Guide, which underpins the design of the Ocean DNA Explorer."
	}
];

const teamMembers = [
	{
		name: "Carter Rollins",
		role: "Research Engineer II, MSU/NGI – Lead developer, database engineer, web developer."
	},
	{
		name: "Bayden Willms",
		role: "Research Engineer I, MSU/NGI – Developer, UI/UX design, web and Python developer."
	},
	{
		name: "Luke Thompson",
		role: "Research Professor, MSU/NGI – Principal investigator."
	}
];

function DataJourneyIcon({
	type,
	variant,
	className
}: {
	type: (typeof dataJourneySteps)[number]["icon"];
	variant?: "dolphin" | "tuna" | "shark" | "shrimp" | "copepod";
	className?: string;
}) {
	if (type === "project") {
		return (
			<svg
				viewBox="0 0 423.43 168.09"
				className={`w-auto text-primary ${className ?? "h-20"}`}
				fill="none"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			>
				<path d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13" />
				<path d="M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0Z" />
				<polygon points="419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83" />
				<path d="M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36Z" />
			</svg>
		);
	}

	if (type === "ctd") {
		return (
			<>
				<img
					src="/images/icons/ctd_icon_light.png"
					alt="CTD Instrument"
					className={`${className ?? "w-20 h-36"} [html[data-theme='dark']_&]:hidden`}
				/>
				<img
					src="/images/icons/ctd_icon_dark.png"
					alt="CTD Instrument"
					className={`${className ?? "w-20 h-36"} hidden [html[data-theme='dark']_&]:block`}
				/>
			</>
		);
	}

	if (type === "niskin") {
		return (
			<svg
				viewBox="0 0 215.27 892.2"
				className={`w-auto text-primary ${className ?? "h-32"}`}
				fill="none"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M140.47,104.49h34.4c3.1,3.6.8,9.8,1.5,14.3-.5,2.2-6.4-.4-6,3.1l42.9,40,2,5v566.1l-1.5,4.5-43.4,40.5,6.8,5.2c.6,2.2.8,12.3-2.3,12.3h-34.4v85.5c0,1.2-3.7,7.1-5,8-2.1,1.3-7.7,2.4-10.4,2.6-7.3.6-26,1-32.9,0-3-.5-10.5-5.7-10.5-8.4v-86l-1.5-1.5h-33.9c-3.1,0-3-11-2.3-13.3,1.3-4.3,8-1.4,6.8-4.2-2.2-1.7-5.4-7.2-8.3-6.4-1.6.4-2.7,3.3-4.4,3.8-2.3.6-4.6-1.4-6.6-.8-1.2.4-8.2,9.8-10.1,11-1.4.8-2.2,1.2-4,1-1.3-.2-15.6-13.8-16.6-15.5-4.4-7.5,11.6-14.2,10.9-17.8-.2-.8-1.8-1.7-1.7-3,.1-2.2,3.9-4.2,3.9-6.2l-7.1-10c-2.1-184,3.4-368.1-1-552-.1-6.1-1.1-14.5,2.5-19.6l43.4-41.5-7.1-2.1c-1.8-4.7-.8-9.7.1-14.4h35.4l1.5-1.5V8.19c0-2.5,6.5-7,9.6-7.4,7.7-1.1,29.9-1,37.8,0,4.8.5,11.5,5.8,11.5,10.5v93.5h0v-.3Z" />
			</svg>
		);
	}

	if (type === "dna") {
		return (
			<div
				className={`text-primary ${className ?? "w-14 h-14"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/dna_icon.svg)",
					maskImage: "url(/images/icons/dna_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "laptop") {
		return (
			<div
				className={`text-primary ${className ?? "w-20 h-20"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/laptop_icon.svg)",
					maskImage: "url(/images/icons/laptop_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "assay") {
		return (
			<div
				className={`text-primary ${className ?? "w-20 h-20"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/assay_icon.svg)",
					maskImage: "url(/images/icons/assay_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "sampleIcon") {
		return (
			<div
				className={`text-primary ${className ?? "w-16 h-24"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/sample_icon.svg)",
					maskImage: "url(/images/icons/sample_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "folder") {
		return (
			<div
				className={`text-primary ${className ?? "w-18 h-18"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/folder_icon.svg)",
					maskImage: "url(/images/icons/folder_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "fish") {
		return (
			<div
				className={`text-primary ${className ?? "w-20 h-20"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/fish_icon.svg)",
					maskImage: "url(/images/icons/fish_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	if (type === "eye") {
		return (
			<div
				className={`text-primary ${className ?? "w-16 h-16"}`}
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/eye_icon.svg)",
					maskImage: "url(/images/icons/eye_icon.svg)",
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain"
				}}
			/>
		);
	}

	return (
		<div
			className={`text-primary ${className ?? "w-16 h-16"}`}
			style={{
				backgroundColor: "currentColor",
				WebkitMaskImage:
					variant === "tuna"
						? "url(/images/outlines/lg_bluefin_tuna.svg)"
						: variant === "shark"
						? "url(/images/outlines/xl_lamniformes.svg)"
						: variant === "shrimp"
						? "url(/images/outlines/md_shrimp.svg)"
						: variant === "copepod"
						? "url(/images/outlines/sm_copepod.svg)"
						: "url(/images/outlines/xl_dolphin.svg)",
				maskImage:
					variant === "tuna"
						? "url(/images/outlines/lg_bluefin_tuna.svg)"
						: variant === "shark"
						? "url(/images/outlines/xl_lamniformes.svg)"
						: variant === "shrimp"
						? "url(/images/outlines/md_shrimp.svg)"
						: variant === "copepod"
						? "url(/images/outlines/sm_copepod.svg)"
						: "url(/images/outlines/xl_dolphin.svg)",
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskPosition: "center",
				maskPosition: "center",
				WebkitMaskSize: "contain",
				maskSize: "contain"
			}}
		/>
	);
}

export default function AboutPage() {
	const projectStep = dataJourneySteps.find((s) => s.key === "project");
	const sampleCollectionStep = dataJourneySteps.find((s) => s.key === "sample-collection");
	const sampleStep = dataJourneySteps.find((s) => s.key === "sample");
	const featureStep = dataJourneySteps.find((s) => s.key === "feature");
	const libraryStep = dataJourneySteps.find((s) => s.key === "library");
	const analysisStep = dataJourneySteps.find((s) => s.key === "analysis");
	const assayStep = dataJourneySteps.find((s) => s.key === "assay");
	const assayPrepStep = dataJourneySteps.find((s) => s.key === "assayPrep");
	const assignmentStep = dataJourneySteps.find((s) => s.key === "assignment");
	const taxonomyStep = dataJourneySteps.find((s) => s.key === "taxonomy");
	const occurrenceStep = dataJourneySteps.find((s) => s.key === "occurrence");

	return (
		<main className="min-h-screen bg-base-100 text-base-content">
			{/* Mission banner */}
			<section className="relative -mt-6 sm:-mt-8 lg:-mt-10 left-1/2 right-1/2 -mx-[50vw] w-screen mb-4 sm:mb-6">
				<div className="px-4 pt-12 sm:pt-16 md:pt-20 pb-4 text-center">
					<h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-primary">Our Mission</h1>
					<p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-base-content/90">
						The Ocean DNA Explorer empowers scientists and citizens to advance ocean discovery and conservation. We
						provide a unified, accessible platform for exploring, visualizing, and sharing standardized environmental
						DNA (eDNA) datasets.
					</p>
				</div>
				<div className="relative w-full mt-2 sm:mt-3 mb-8 sm:mb-10 h-24 sm:h-28 md:h-32 lg:h-36">
					<Image
						src="/images/ocean_surface_abstract.svg"
						alt="Abstract ocean surface line illustration"
						fill
						sizes="100vw"
						className="object-cover"
						priority
					/>
				</div>
			</section>

			<section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-20 space-y-24 sm:space-y-28">
				{/* About Us */}
				<div className="text-center space-y-4">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">About Us</h2>
					<p className="text-base sm:text-lg leading-relaxed text-base-content/90 max-w-3xl mx-auto">
						The Ocean DNA Explorer is a robust data platform, search engine, and visualization tool dedicated to ocean
						environmental DNA (eDNA) data. As part of a larger effort to standardize eDNA data, ODE is built to host
						datasets generated using protocols like FAIR eDNA and BeBop. We provide customized features for users to
						compare studies, discover trends, and perform complex searches on data contributed by NOAA Omics, NOAA Ocean
						Exploration, and partner organizations.
					</p>
				</div>

				{/* Team */}
				<section className="space-y-6">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl mb-16 font-semibold text-primary text-center">Team</h2>
					<div className="grid gap-12 md:grid-cols-3">
						{teamMembers.map((member) => (
							<div key={member.name} className="flex flex-col items-center text-center space-y-2">
								<div className="mb-3 h-24 w-24 rounded-full bg-linear-to-br from-primary/70 via-primary/40 to-base-100 border-2 border-primary/50 shadow-md" />
								<p className="text-base font-semibold tracking-wide text-base-content/90">{member.name}</p>
								<p className="text-sm sm:text-base text-base-content/75">{member.role}</p>
							</div>
						))}
					</div>
				</section>

				{/* Support section – mirrored from home page with updated text */}
				<div className="space-y-8 pt-4 sm:pt-6">
					<div className="text-center space-y-4">
						<h2 className="text-2xl lg:text-3xl text-primary font-semibold">Supported By</h2>
						<p className="text-base sm:text-lg text-base-content/90 max-w-3xl mx-auto leading-relaxed">
							The Ocean DNA Explorer is a product of the{" "}
							<Link
								href="https://www.northerngulfinstitute.org/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Northern Gulf Institute (NGI)
							</Link>{" "}
							at{" "}
							<Link
								href="https://www.msstate.edu/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								Mississippi State University (MSU)
							</Link>{" "}
							in collaboration with{" "}
							<Link
								href="https://www.aoml.noaa.gov/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA&apos;s Atlantic Oceanographic and Meteorological Laboratory
							</Link>
							. The project is supported by{" "}
							<Link
								href="https://oceanexplorer.noaa.gov/"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA Ocean Exploration
							</Link>{" "}
							and{" "}
							<Link
								href="https://oceanexplorer.noaa.gov/technology/omics/noaa-omics.html"
								className="text-primary hover:underline"
								target="_blank"
								rel="noreferrer"
							>
								NOAA Omics
							</Link>{" "}
							projects NO_0062 and NO_0066.
						</p>
					</div>

					<div className="flex flex-col lg:flex-row justify-center items-center gap-10 lg:gap-20">
						<div className="relative h-16 w-48 lg:h-24 lg:w-64">
							<Link href="https://oceanexplorer.noaa.gov/welcome.html" target="_blank" rel="noreferrer">
								<Image
									src="/images/noaa_oar_logo.svg"
									alt="NOAA Oceanic and Atmospheric Research logo"
									fill
									sizes="(max-width: 1024px) 12rem, 16rem"
									className="object-contain noaa-oar-logo [html[data-theme='dark']_&]:hidden"
								/>
								<Image
									src="/images/noaa_oar_logo_dark.svg"
									alt="NOAA Oceanic and Atmospheric Research logo"
									fill
									sizes="(max-width: 1024px) 12rem, 16rem"
									className="object-contain noaa-oar-logo hidden [html[data-theme='dark']_&]:block"
								/>
							</Link>
						</div>
						<div className="relative h-16 w-80 lg:h-24 lg:w-104">
							<Link href="https://www.northerngulfinstitute.org/" target="_blank" rel="noreferrer">
								<ThemeAwareLogo
									src="/images/ngi_msu_logo_FINAL.svg"
									alt="Mississippi State University, Northern Gulf Institute Logo"
									fill={true}
									className="object-contain"
								/>
							</Link>
						</div>
					</div>
				</div>

				{/* The Data Journey */}
				<section className="space-y-20 lg:space-y-28">
					<div className="text-center space-y-4">
						<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary">The Data Journey</h2>
						<p className="text-base sm:text-lg lg:text-xl text-base-content/90 max-w-4xl mx-auto leading-relaxed">
							The Ocean DNA Explorer links physical sampling, molecular protocols, and bioinformatics into a single
							connected data model. Each step connects real-world sampling and environmental context to downstream
							features, assignments, and taxonomic information.
						</p>
					</div>

					{/* Step 1: Project — Ship with CTD */}
					<div className="space-y-6">
						<div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
							<div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px]">
								<Image
									src="/images/biorender/ship_with_ctd.png"
									alt="Research vessel deploying CTD"
									fill
									sizes="(max-width: 1024px) 100vw, 900px"
									className="object-contain object-center"
									priority
								/>
							</div>
							<div className="flex flex-col gap-12 lg:gap-20 pt-4 lg:pt-8">
								{projectStep && (
									<div className="space-y-3">
										<h3 className="text-2xl lg:text-3xl font-semibold text-primary">{projectStep.title}</h3>
										<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
											{projectStep.description} Projects organize sampling cruises, define research objectives, and link all downstream data to a single scientific effort.
										</p>
									</div>
								)}
								{sampleCollectionStep && (
									<div className="space-y-3">
										<h3 className="text-2xl lg:text-3xl font-semibold text-base-content">
											{sampleCollectionStep.title}
										</h3>
										<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
											{sampleCollectionStep.description}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Step 2: Sample — CTD → Niskin → Bottles */}
					<div className="space-y-8">
						<div className="overflow-x-auto pb-4">
							<div className="flex items-center justify-start lg:justify-center gap-6 lg:gap-10 min-w-max px-4">
								{/* CTD */}
								<div className="relative h-[340px] sm:h-[400px] lg:h-[480px] w-[180px] sm:w-[220px] lg:w-[280px] shrink-0">
									<Image
										src="/images/biorender/ctd_light_mode.png"
										alt="CTD instrument"
										fill
										sizes="(max-width: 768px) 180px, (max-width: 1024px) 220px, 280px"
										className="object-contain [html[data-theme='dark']_&]:hidden"
									/>
									<Image
										src="/images/biorender/ctd_dark_mode.png"
										alt="CTD instrument"
										fill
										sizes="(max-width: 768px) 180px, (max-width: 1024px) 220px, 280px"
										className="object-contain hidden [html[data-theme='dark']_&]:block"
									/>
								</div>
								{/* Arrow 1 */}
								<svg viewBox="0 0 80 24" className="w-16 sm:w-20 lg:w-24 h-8 text-primary shrink-0" aria-hidden="true">
									<defs>
										<marker id="arrow1" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
											<path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
										</marker>
									</defs>
									<line x1="4" y1="12" x2="65" y2="12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow1)" />
								</svg>
								{/* Niskin */}
								<div className="relative h-[280px] sm:h-[340px] lg:h-[400px] w-[100px] sm:w-[120px] lg:w-[150px] shrink-0">
									<Image
										src="/images/biorender/niskin_bottle.png"
										alt="Niskin bottle"
										fill
										sizes="(max-width: 768px) 100px, (max-width: 1024px) 120px, 150px"
										className="object-contain"
									/>
								</div>
								{/* Arrow 2 */}
								<svg viewBox="0 0 80 24" className="w-16 sm:w-20 lg:w-24 h-8 text-primary shrink-0" aria-hidden="true">
									<defs>
										<marker id="arrow2" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
											<path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
										</marker>
									</defs>
									<line x1="4" y1="12" x2="65" y2="12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrow2)" />
								</svg>
								{/* Sample bottles (staggered) */}
								<div className="relative h-[280px] sm:h-[340px] lg:h-[400px] w-[280px] sm:w-[340px] lg:w-[420px] shrink-0">
									<div className="absolute left-0 bottom-0 w-[100px] sm:w-[120px] lg:w-[150px] h-[220px] sm:h-[260px] lg:h-[320px]">
										<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="150px" className="object-contain" />
									</div>
									<div className="absolute left-[70px] sm:left-[90px] lg:left-[110px] bottom-4 w-[100px] sm:w-[120px] lg:w-[150px] h-[220px] sm:h-[260px] lg:h-[320px]">
										<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="150px" className="object-contain" />
									</div>
									<div className="absolute left-[140px] sm:left-[180px] lg:left-[220px] bottom-1 w-[100px] sm:w-[120px] lg:w-[150px] h-[220px] sm:h-[260px] lg:h-[320px]">
										<Image src="/images/biorender/sample_bottle.png" alt="Sample bottle" fill sizes="150px" className="object-contain" />
									</div>
								</div>
							</div>
						</div>
						{sampleStep && (
							<div className="max-w-lg mx-auto text-center space-y-3">
								<h3 className="text-2xl lg:text-3xl font-semibold text-primary">{sampleStep.title}</h3>
								<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
									{sampleStep.description} Each sample preserves a snapshot of biodiversity from a specific place and time, ready for molecular analysis.
								</p>
							</div>
						)}
					</div>

					{/* Step 3: Into the Lab */}
					<div className="space-y-10">
						<div className="text-center space-y-3">
							<h3 className="text-2xl lg:text-3xl font-semibold text-base-content">Into the Lab</h3>
							<p className="text-base lg:text-lg text-base-content/85 leading-relaxed max-w-3xl mx-auto">
								Samples collected at sea are filtered, preserved, and transported to the laboratory where DNA is extracted and prepared for sequencing.
							</p>
						</div>
						{/* DNA Extraction */}
						<div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
							<Image
								src="/images/biorender/dna_extraction.png"
								alt="DNA extraction workflow"
								fill
								sizes="100vw"
								className="object-contain"
							/>
						</div>
						<div className="max-w-lg mx-auto text-center space-y-3">
							<h3 className="text-2xl lg:text-3xl font-semibold text-base-content">DNA Extraction</h3>
							<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
								Filters are processed to isolate environmental DNA, capturing genetic material shed by organisms living in the sampled water.
							</p>
						</div>
					</div>

					{/* Step 4: Wet Lab Processing */}
					<div className="space-y-10">
						<div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
							<div className="relative w-full h-[280px] sm:h-[360px] lg:h-[440px]">
								<Image
									src="/images/biorender/second_wetlab_step.png"
									alt="Wet lab processing"
									fill
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-contain"
								/>
							</div>
							<div className="space-y-3 text-center lg:text-left">
								<h3 className="text-2xl lg:text-3xl font-semibold text-primary">AssayPrep</h3>
								<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
									{assayPrepStep?.description} Extracted DNA is amplified using targeted primers, creating libraries ready for high-throughput sequencing.
								</p>
							</div>
						</div>
					</div>

					{/* Step 5: Thermocycler / PCR */}
					<div className="space-y-10">
						<div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
							<div className="space-y-3 text-center lg:text-left order-2 lg:order-1">
								<h3 className="text-2xl lg:text-3xl font-semibold text-base-content">Pooling &amp; Sequencing</h3>
								<p className="text-base lg:text-lg text-base-content/85 leading-relaxed">
									Amplified samples are pooled together and loaded onto a sequencer, generating millions of DNA reads that represent the biodiversity captured in each sample.
								</p>
							</div>
							<div className="relative w-full h-[280px] sm:h-[360px] lg:h-[440px] order-1 lg:order-2">
								<Image
									src="/images/biorender/thermocycler.png"
									alt="Thermocycler for PCR amplification"
									fill
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-contain"
								/>
							</div>
						</div>
					</div>
				</section>

				{/* FAIR eDNA Data Model */}
				<section className="space-y-10">
					<div className="text-center space-y-3">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">FAIR eDNA Data Model</h2>
						<p className="text-base sm:text-lg text-base-content/90 max-w-3xl mx-auto">
							The Ocean DNA Explorer follows FAIR eDNA standards so that datasets are easy to find, access, combine, and
							reuse across projects and institutions. By aligning with a shared data model, we make it straightforward
							to move between shipboard sampling, laboratory workflows, and open data repositories.
						</p>
						<p className="text-base sm:text-lg text-base-content/80 max-w-3xl mx-auto">
							The tools and pipelines below help generate standardized metadata tables, process raw sequence data, and
							submit results to community archives while keeping everything interoperable with the Ocean DNA Explorer.
						</p>
					</div>

					<div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
						{fairModelBlurbs.map((item) => (
							<div
								key={item.title}
								className="h-full rounded-2xl bg-base-200/70 dark:bg-base-300/40 px-5 py-4 text-center shadow-sm"
							>
								<h3 className="text-lg font-semibold text-primary mb-2">{item.title}</h3>
								<p className="text-sm sm:text-base text-base-content/85">{item.body}</p>
							</div>
						))}
					</div>
				</section>

				{/* GitHub callout */}
				<section className="pt-10 sm:pt-12">
					<div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
						<div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 p-2 sm:p-3">
							<Image
								src="/images/construction_octo.png"
								alt="Construction octopus"
								fill
								sizes="96px"
								className="object-contain"
								priority
							/>
						</div>
						<div className="space-y-2 text-left">
							<h2 className="text-lg sm:text-xl font-semibold text-primary">Help Us Improve</h2>
							<p className="text-sm sm:text-base text-base-content/85">
								Found a bug, have a feature request, or want to suggest a new visualization? Open an issue on our GitHub
								repository so we can continue improving the Ocean DNA Explorer together.
							</p>
							<Link
								href="https://github.com/aomlomics/ocean-dna-explorer/issues"
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center text-sm font-medium text-primary hover:underline"
							>
								<span>Open an issue on GitHub</span>
								<span aria-hidden className="ml-1">
									↗
								</span>
							</Link>
						</div>
					</div>
				</section>
			</section>
		</main>
	);
}
