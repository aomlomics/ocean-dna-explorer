 "use client";

import Image from "next/image";
import Link from "next/link";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";

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

export default function AboutPage() {
	return (
		<main className="min-h-screen bg-base-100 text-base-content">
			{/* Mission banner */}
			<section className="relative w-full mb-6 sm:mb-8">
				<div className="px-4 pt-8 sm:pt-10 md:pt-12 pb-4 text-center">
					<h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-primary">Our Mission</h1>
					<p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-base-content/90">
						The Ocean DNA Explorer empowers scientists and citizens to advance ocean discovery and conservation. We
						provide a unified, accessible platform for exploring, visualizing, and sharing standardized environmental
						DNA (eDNA) datasets.
					</p>
				</div>
				{/* Decorative ocean wave illustration */}
				<div className="relative w-full mt-2 sm:mt-3 h-20 sm:h-24 md:h-28 lg:h-32">
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
