import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";
import DataJourneySurfaceScene from "@/app/components/DataJourneySurfaceScene";
import { AssigningTaxonomyLoop } from "@/app/components/eDNA_graphic/analysis_viz";
import BasePairMatrix from "@/app/components/BasePairMatrix";
import TableMetadata from "@/types/tableMetadata";
import UnderConstruction from "@/app/components/UnderConstruction";

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
				<section className="space-y-12">
					<div className="text-center space-y-4">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">The Data Journey</h2>
						<p className="text-base sm:text-lg lg:text-xl text-base-content/90 max-w-4xl mx-auto leading-relaxed">
							The Ocean DNA Explorer links physical sampling, molecular protocols, and bioinformatics into a single
							connected data model. Each step connects real-world sampling and environmental context to downstream
							features, assignments, and taxonomic information.
						</p>
					</div>

					{/* Mobile / tablet layout – simple stacked steps with icons */}
					<div className="space-y-10 lg:hidden">
						{dataJourneySteps.map((step, index) => (
							<div key={step.key} className="flex items-start gap-5">
								<div
									className={`shrink-0 pt-1 ${
										index % 3 === 0 ? "-rotate-3" : index % 3 === 1 ? "rotate-2" : "-rotate-1"
									}`}
								>
									<DataJourneyIcon
										type={step.icon}
										variant={
											step.icon === "dolphin"
												? step.key === "occurrence"
													? "tuna"
													: step.key === "feature"
													? "shrimp"
													: step.key === "assignment"
													? "copepod"
													: "dolphin"
												: undefined
										}
									/>
								</div>
								<div className="space-y-2 text-left">
									<h3
										className={`text-xl sm:text-2xl font-semibold tracking-tight ${
											step.type === "table" ? "text-primary" : "text-base-content"
										}`}
									>
										{step.title}
									</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{step.description}</p>
								</div>
							</div>
						))}
					</div>

					{/* Large-screen layout – structured journey with paired text + visuals */}
					<div className="hidden lg:flex flex-col gap-16">
						{/* 1. Project + Boat/CTD scene */}
						<div className="flex items-center gap-12">
							<div className="flex-1 flex justify-center">
								<div className="w-full max-w-2xl h-[500px]">
									<DataJourneySurfaceScene />
								</div>
							</div>
							{projectStep && (
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{projectStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{projectStep.description}</p>
								</div>
							)}
						</div>

						{/* 2. Sample Collection + CTD → Niskin → sample bottles, icons in one row, blurbs under CTD and bottles */}
						<div className="flex flex-col items-center gap-6">
							{/* Icon chain */}
							<div className="flex items-end gap-6">
								<div className="flex items-end h-56">
									<DataJourneyIcon type="ctd" className="h-48 w-auto" />
								</div>
								<svg viewBox="0 0 60 12" className="w-24 h-10 text-primary" aria-hidden="true">
									<path d="M2 6h40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
									<path
										d="M38 2l8 4-8 4"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<div className="flex items-end h-56">
									<DataJourneyIcon type="niskin" className="h-48 w-auto -rotate-2" />
								</div>
								<svg viewBox="0 0 60 12" className="w-24 h-10 text-primary" aria-hidden="true">
									<path d="M2 6h40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
									<path
										d="M38 2l8 4-8 4"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								<div className="flex items-end h-56">
									<div className="flex gap-3 items-end">
										{[0, 1, 2].map((i) => (
											<div
												// Using index is fine here for a static decorative row
												// eslint-disable-next-line react/no-array-index-key
												key={i}
												className="text-primary w-20 h-40"
												style={{
													backgroundColor: "currentColor",
													WebkitMaskImage: "url(/images/icons/sample_bottle.svg)",
													maskImage: "url(/images/icons/sample_bottle.svg)",
													WebkitMaskRepeat: "no-repeat",
													maskRepeat: "no-repeat",
													WebkitMaskPosition: "center",
													maskPosition: "center",
													WebkitMaskSize: "contain",
													maskSize: "contain"
												}}
											/>
										))}
									</div>
								</div>
							</div>

							{/* Blurbs under CTD and sample bottles */}
							<div className="flex justify-between w-full max-w-4xl gap-10">
								{sampleCollectionStep && (
									<div className="flex-1 max-w-sm space-y-2 text-left">
										<h3 className="text-2xl font-semibold text-primary">{sampleCollectionStep.title}</h3>
										<p className="text-base text-base-content/85 leading-relaxed">{sampleCollectionStep.description}</p>
									</div>
								)}
								<div className="flex-1" />
								{sampleStep && (
									<div className="flex-1 max-w-sm space-y-2 text-left">
										<h3 className="text-2xl font-semibold text-primary">{sampleStep.title}</h3>
										<p className="text-base text-base-content/85 leading-relaxed">{sampleStep.description}</p>
									</div>
								)}
							</div>
						</div>

						{/* 3. Feature: large DNA with ACTG grid */}
						<div className="flex items-center gap-12">
							<div className="flex-1 flex justify-center">
								<div className="relative w-80 h-64 flex items-center justify-center">
									{/* ACTG background grid */}
									<div className="absolute inset-0 -z-10 flex flex-col items-center justify-center gap-1 pointer-events-none">
										{[0, 1, 2, 3].map((row) => (
											<div
												// eslint-disable-next-line react/no-array-index-key
												key={row}
												className="text-xs font-mono tracking-[0.35em] text-primary/20"
											>
												ACTGACTGACTGACTG
											</div>
										))}
									</div>
									{/* Big DNA icon */}
									<div
										className="w-140 h-140 text-primary"
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
								</div>
							</div>
							{featureStep && (
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{featureStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{featureStep.description}</p>
								</div>
							)}
						</div>

						{/* 4. Library row with themed PNG icon */}
						{libraryStep && (
							<div className="flex items-center gap-12">
								<div className="flex-1 flex justify-center">
									<div
										className="text-primary w-48 h-36"
										style={{
											backgroundColor: "currentColor",
											WebkitMaskImage: "url(/images/icons/library_icon.png)",
											maskImage: "url(/images/icons/library_icon.png)",
											WebkitMaskRepeat: "no-repeat",
											maskRepeat: "no-repeat",
											WebkitMaskPosition: "center",
											maskPosition: "center",
											WebkitMaskSize: "contain",
											maskSize: "contain"
										}}
									/>
								</div>
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{libraryStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{libraryStep.description}</p>
								</div>
							</div>
						)}

						{/* 5. Analysis row – sequencer + ACTG matrix */}
						{analysisStep && (
							<div className="flex items-center gap-12">
								<div className="flex-1 flex justify-center">
									<div className="flex items-center gap-8">
										{/* Lab sequencer – inline SVG, no mask so line drawing shows */}
										<div className="relative w-40 h-40">
											<Image
												src="/images/icons/sequencer_icon.svg"
												alt="Sequencer machine"
												fill
												sizes="160px"
												className="object-contain"
											/>
										</div>
										{/* ACTG matrix – animated base-pair grid */}
										<BasePairMatrix />
									</div>
								</div>
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{analysisStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">
										{analysisStep.description} This step brings together measurements generated in the lab and results
										from downstream computational analysis.
									</p>
								</div>
							</div>
						)}

						{/* 6. Assay + AssayPrep together */}
						{assayStep && assayPrepStep && (
							<div className="flex items-center gap-12">
								<div className="flex-1 flex justify-center">
									<div className="flex items-center gap-8">
										<DataJourneyIcon type="assay" className="h-24 w-auto" />
										<DataJourneyIcon type="dna" className="h-24 w-auto" />
									</div>
								</div>
								<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl text-left">
									<div className="space-y-2">
										<h3 className="text-2xl font-semibold text-primary">{assayStep.title}</h3>
										<p className="text-base text-base-content/85 leading-relaxed">{assayStep.description}</p>
									</div>
									<div className="space-y-2">
										<h3 className="text-2xl font-semibold text-primary">{assayPrepStep.title}</h3>
										<p className="text-base text-base-content/85 leading-relaxed">{assayPrepStep.description}</p>
									</div>
								</div>
							</div>
						)}

						{/* 7. Assignment row – reuse assigning taxonomy animation */}
						{assignmentStep && (
							<div className="flex items-center gap-12">
								<div className="flex-1 flex justify-center">
									<div className="w-md h-72 max-w-full">
										<AssigningTaxonomyLoop />
									</div>
								</div>
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{assignmentStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{assignmentStep.description}</p>
								</div>
							</div>
						)}

						{/* 8. Taxonomy row – taxonomy outline */}
						{taxonomyStep && (
							<div className="flex items-center gap-12">
								<div className="flex-1 flex justify-center">
									<div
										className="w-40 h-32 text-primary"
										style={{
											backgroundColor: "currentColor",
											WebkitMaskImage: "url(/images/outlines/xl_dolphin.svg)",
											maskImage: "url(/images/outlines/xl_dolphin.svg)",
											WebkitMaskRepeat: "no-repeat",
											maskRepeat: "no-repeat",
											WebkitMaskPosition: "center",
											maskPosition: "center",
											WebkitMaskSize: "contain",
											maskSize: "contain"
										}}
									/>
								</div>
								<div className="flex-1 max-w-md space-y-3 text-left">
									<h3 className="text-2xl font-semibold text-primary">{taxonomyStep.title}</h3>
									<p className="text-base text-base-content/85 leading-relaxed">{taxonomyStep.description}</p>
								</div>
							</div>
						)}

						{/* 9. Occurrence row – world map with pulsing taxa */}
						{occurrenceStep && (
							<div className="mt-6 flex flex-col gap-6">
								<div className="flex flex-col lg:flex-row items-center gap-8">
									<div className="relative w-full lg:w-2/3 h-72 text-primary">
										<div
											className="w-full h-full"
											style={{
												backgroundColor: "currentColor",
												WebkitMaskImage: "url(/images/icons/world_map.svg)",
												maskImage: "url(/images/icons/world_map.svg)",
												WebkitMaskRepeat: "no-repeat",
												maskRepeat: "no-repeat",
												WebkitMaskPosition: "center",
												maskPosition: "center",
												WebkitMaskSize: "contain",
												maskSize: "contain"
											}}
										/>
										{/* Pulsing outlines over the oceans */}
										<div className="absolute inset-0 pointer-events-none">
											<div
												className="absolute left-[28%] top-[38%] w-10 h-10 animate-flash-loop text-base-content [html[data-theme='dark']_&]:text-base-100"
												style={{
													backgroundColor: "currentColor",
													WebkitMaskImage: "url(/images/outlines/xl_dolphin.svg)",
													maskImage: "url(/images/outlines/xl_dolphin.svg)",
													WebkitMaskRepeat: "no-repeat",
													maskRepeat: "no-repeat",
													WebkitMaskPosition: "center",
													maskPosition: "center",
													WebkitMaskSize: "contain",
													maskSize: "contain"
												}}
											/>
											<div
												className="absolute left-[55%] top-[52%] w-9 h-9 animate-flash-loop text-base-content [html[data-theme='dark']_&]:text-base-100"
												style={{
													animationDelay: "250ms",
													backgroundColor: "currentColor",
													WebkitMaskImage: "url(/images/outlines/lg_bluefin_tuna.svg)",
													maskImage: "url(/images/outlines/lg_bluefin_tuna.svg)",
													WebkitMaskRepeat: "no-repeat",
													maskRepeat: "no-repeat",
													WebkitMaskPosition: "center",
													maskPosition: "center",
													WebkitMaskSize: "contain",
													maskSize: "contain"
												}}
											/>
											<div
												className="absolute left-[70%] top-[32%] w-8 h-8 animate-flash-loop text-base-content [html[data-theme='dark']_&]:text-base-100"
												style={{
													animationDelay: "500ms",
													backgroundColor: "currentColor",
													WebkitMaskImage: "url(/images/outlines/md_shrimp.svg)",
													maskImage: "url(/images/outlines/md_shrimp.svg)",
													WebkitMaskRepeat: "no-repeat",
													maskRepeat: "no-repeat",
													WebkitMaskPosition: "center",
													maskPosition: "center",
													WebkitMaskSize: "contain",
													maskSize: "contain"
												}}
											/>
										</div>
									</div>
									<div className="lg:w-1/3 max-w-md space-y-3 text-left">
										<h3 className="text-2xl font-semibold text-primary">{occurrenceStep.title}</h3>
										<p className="text-base text-base-content/85 leading-relaxed">{occurrenceStep.description}</p>
									</div>
								</div>
							</div>
						)}

						{/* 8. Remaining tables – icon + paragraph pairs */}
						{remainingDesktopTableSteps.length > 0 && (
							<div className="max-w-6xl mx-auto w-full pt-4 border-t border-base-content/20">
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
									{remainingDesktopTableSteps.map((step) => (
										<div key={step.key} className="flex items-start gap-4">
											<DataJourneyIcon type={step.icon} className="h-16 w-auto mt-1" />
											<div className="space-y-2 max-w-xs text-left">
												<h3 className="text-2xl font-semibold text-primary">{step.title}</h3>
												<p className="text-base text-base-content/85 leading-relaxed">{step.description}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
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
