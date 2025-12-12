import Image from "next/image";
import Link from "next/link";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";
import TableMetadata from "@/types/tableMetadata";

const dataJourneySteps: {
	key: string;
	title: string;
	type: "table" | "concept";
	description: string;
	icon: "project" | "ctd" | "niskin" | "dna" | "laptop" | "dolphin";
}[] = [
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
		icon: "niskin"
	},
	{
		key: "assay",
		title: "Assay",
		type: "table",
		description: TableMetadata.assay.description,
		icon: "dna"
	},
	{
		key: "assayPrep",
		title: "AssayPrep",
		type: "table",
		description: TableMetadata.assayPrep.description,
		icon: "dna"
	},
	{
		key: "library",
		title: "Library",
		type: "table",
		description: TableMetadata.library.description,
		icon: "dna"
	},
	{
		key: "analysis",
		title: "Analysis",
		type: "table",
		description: TableMetadata.analysis.description,
		icon: "laptop"
	},
	{
		key: "occurrence",
		title: "Occurrence",
		type: "table",
		description: TableMetadata.occurrence.description,
		icon: "dolphin"
	},
	{
		key: "feature",
		title: "Feature",
		type: "table",
		description: TableMetadata.feature.description,
		icon: "dna"
	},
	{
		key: "assignment",
		title: "Assignment",
		type: "table",
		description: TableMetadata.assignment.description,
		icon: "dolphin"
	},
	{
		key: "taxonomy",
		title: "Taxonomy",
		type: "table",
		description: TableMetadata.taxonomy.description,
		icon: "dolphin"
	}
];

const fairModelBlurbs = [
	{
		title: "FAIR eDNA Collaboration",
		body: "The Ocean DNA Explorer is built in partnership with the FAIR eDNA community to promote Findable, Accessible, Interoperable, and Reusable (FAIR) practices for eDNA data."
	},
	{
		title: "FaiReSheets",
		body: "FaiReSheets helps generate standardized metadata tables that are ready for Ocean DNA Explorer submission and aligned with FAIR eDNA templates."
	},
	{
		title: "FaiRe2NCBI",
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

function DataJourneyIcon({ type }: { type: (typeof dataJourneySteps)[number]["icon"] }) {
	if (type === "project") {
		return (
			<svg
				viewBox="0 0 423.43 168.09"
				className="h-14 w-auto text-primary"
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
			<div
				className="w-12 h-20 text-primary"
				style={{
					backgroundColor: "currentColor",
					WebkitMaskImage: "url(/images/icons/ctd_icon.svg)",
					maskImage: "url(/images/icons/ctd_icon.svg)",
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

	if (type === "niskin") {
		return (
			<svg
				viewBox="0 0 215.27 892.2"
				className="h-20 w-auto text-primary"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
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
				className="w-12 h-12 text-primary"
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
				className="w-14 h-14 text-primary"
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

	return (
		<div
			className="w-16 h-16 text-primary"
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
	);
}

export default function AboutUsPage() {
	return (
		<main className="min-h-screen bg-base-100 text-base-content">
			{/* Mission + banner */}
			<section className="relative w-screen -ml-[50vw] left-1/2 overflow-hidden">
				<div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[440px]">
					<Image
						src="/images/about_us_banner.JPG"
						alt="Ocean surface and research vessel"
						fill
						className="object-cover"
						priority
						sizes="100vw"
					/>
					{/* Darken top slightly and fade bottom into page background */}
					<div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/35 to-transparent pointer-events-none" />
					<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-base-100 pointer-events-none" />

					<div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-base-100 mb-4">
							Our Mission
						</h1>
						<p className="max-w-3xl text-sm sm:text-base md:text-lg text-base-100/90">
							The Ocean DNA Explorer empowers scientists and citizens to advance ocean discovery and conservation.
							We provide a unified, accessible platform for exploring, visualizing, and sharing standardized
							environmental DNA (eDNA) datasets.
						</p>
					</div>
				</div>
			</section>

			<section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20 sm:space-y-24">
				{/* About Us */}
				<div className="text-center space-y-4">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">About Us</h2>
					<p className="text-base sm:text-lg leading-relaxed text-base-content/90 max-w-3xl mx-auto">
						The Ocean DNA Explorer is a robust data platform, search engine, and visualization tool dedicated to
						ocean environmental DNA (eDNA) data. As part of a larger effort to standardize eDNA data, ODE is built to
						host datasets generated using protocols like FAIR eDNA and BeBop. We provide customized features for users
						to compare studies, discover trends, and perform complex searches on data contributed by NOAA Omics,
						NOAA Ocean Exploration, and partner organizations.
					</p>
				</div>

				{/* Support section – mirrored from home page with updated text */}
				<div className="space-y-8">
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
								NOAA&apos;s Atlantic Oceanographic and Meteorological Laboratory (AOML)
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
				<section className="space-y-10">
					<div className="text-center space-y-3">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">The Data Journey</h2>
						<p className="text-base sm:text-lg text-base-content/90 max-w-3xl mx-auto">
							The Ocean DNA Explorer links physical sampling, molecular protocols, and bioinformatics into a single
							connected data model. Each step connects real-world sampling and environmental context to downstream
							features, assignments, and taxonomic information.
						</p>
					</div>

					<div className="space-y-10">
						{dataJourneySteps.map((step) => (
							<div
								key={step.key}
								className="relative py-6"
							>
								{/* Curved dashed connector from text to icon (desktop only) */}
								<svg
									aria-hidden="true"
									className="hidden lg:block absolute inset-y-0 left-0 right-0 pointer-events-none"
								>
									<path
										d="M 40 60 C 160 0, 260 120, 420 70"
										fill="none"
										stroke="currentColor"
										className="text-primary/40"
										strokeWidth="2"
										strokeDasharray="4 6"
										strokeLinecap="round"
									/>
								</svg>

								<div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
									<div className="order-2 lg:order-1 text-center lg:text-left space-y-2">
										<h3
											className={`text-xl sm:text-2xl font-semibold ${
												step.type === "table" ? "text-primary" : "text-base-content"
											}`}
										>
											{step.title}
										</h3>
										<p className="text-sm sm:text-base text-base-content/85">{step.description}</p>
									</div>

									<div className="order-1 lg:order-2 flex justify-center lg:justify-end">
										<div className="relative flex items-center justify-center">
											<div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-base-100 border-2 border-primary/60 flex items-center justify-center shadow-sm">
												<DataJourneyIcon type={step.icon} />
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* FAIR eDNA Data Model */}
				<section className="space-y-10">
					<div className="text-center space-y-3">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">
							FAIR eDNA Data Model
						</h2>
						<p className="text-base sm:text-lg text-base-content/90 max-w-3xl mx-auto">
							The Ocean DNA Explorer follows FAIR eDNA standards so that datasets are easy to find, access, combine,
							and reuse across projects and institutions. By aligning with a shared data model, we make it
							straightforward to move between shipboard sampling, laboratory workflows, and open data repositories.
						</p>
						<p className="text-base sm:text-lg text-base-content/80 max-w-3xl mx-auto">
							The tools and pipelines below help generate standardized metadata tables, process raw sequence data,
							and submit results to community archives while keeping everything interoperable with the Ocean DNA
							Explorer.
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

				{/* Team */}
				<section className="space-y-8">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary text-center">Team</h2>
					<div className="space-y-4 text-center">
						<div>
							<p className="text-lg font-semibold">Carter Rollins</p>
							<p className="text-base text-base-content/80">
								Research Engineer II, MSU/NGI – Lead developer, database engineer, web developer.
							</p>
						</div>
						<div>
							<p className="text-lg font-semibold">Bayden Willms</p>
							<p className="text-base text-base-content/80">
								Research Engineer I, MSU/NGI – Developer, UI/UX design, web and Python developer.
							</p>
						</div>
						<div>
							<p className="text-lg font-semibold">Luke Thompson</p>
							<p className="text-base text-base-content/80">
								Research Professor, MSU/NGI – Principal investigator.
							</p>
						</div>
					</div>
				</section>

				{/* GitHub callout */}
				<section className="pt-4">
					<div className="max-w-3xl mx-auto rounded-3xl bg-primary text-primary-content px-6 sm:px-10 py-8 sm:py-10 text-center shadow-lg">
						<h2 className="text-2xl sm:text-3xl font-semibold mb-3">Help Us Improve</h2>
						<p className="text-base sm:text-lg mb-6">
							Found a bug, have a feature request, or want to suggest a new visualization? Open an issue on our
							GitHub repository so we can continue improving the Ocean DNA Explorer together.
						</p>
						<Link
							href="https://github.com/aomlomics/ocean-dna-explorer/issues"
							target="_blank"
							rel="noreferrer"
							className="btn btn-outline border-primary-content text-primary-content hover:bg-primary-content hover:text-primary"
						>
							Go to GitHub Issues
						</Link>
					</div>
				</section>
			</section>
		</main>
	);
}


