import Image from "next/image";
import Link from "next/link";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";

const teamMembers = [
	{
		name: "Carter Rollins",
		role: "Lead Developer & Database Engineer",
		affiliation: "Research Engineer II, MSU/NGI",
		image: "/images/carter_about_page_photo.jpg"
	},
	{
		name: "Bayden Willms",
		role: "Developer & UI/UX Design",
		affiliation: "Research Engineer I, MSU/NGI",
		image: "/images/bayden_about_page_photo.jpg"
	},
	{
		name: "Luke Thompson",
		role: "Principal Investigator",
		affiliation: "Research Professor, MSU/NGI",
		image: "/images/luke_about_page_photo.jpg"
	}
];

export default function AboutPage() {
	return (
		<main className="min-h-screen bg-base-100 text-base-content -mt-4">
			{/* Mission banner */}
			<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-28 bg-base-100">
				<div className="relative h-[400px]">
					<Image
						src="/images/sponge_about_page_light.jpg"
						alt="Ocean sponge close-up"
						fill
						sizes="100vw"
						className="object-cover opacity-20 [html[data-theme='dark']_&]:hidden"
						priority
					/>
					<Image
						src="/images/squid_about_page_dark.jpg"
						alt="Deep sea squid"
						fill
						sizes="200vw"
						className="object-cover opacity-50 hidden [html[data-theme='dark']_&]:block"
						priority
					/>
					<div className="relative z-10 h-full flex items-center">
						<div className="w-full max-w-5xl mx-auto px-6 text-center">
							<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-primary [html[data-theme='dark']_&]:text-white">Our Mission</h1>
							<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
								The Ocean DNA Explorer empowers scientists and citizens to advance ocean discovery and conservation. We
								provide a unified, accessible platform for exploring, visualizing, and sharing standardized
								environmental DNA (eDNA) datasets.
							</p>
						</div>
					</div>
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
				</div>
			</section>

			{/* About the Platform */}
			<section className="max-w-4xl mx-auto px-6 text-center mb-44">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-10">About the Platform</h2>
				<p className="text-lg sm:text-xl leading-relaxed text-base-content/90">
					The Ocean DNA Explorer is a data platform, search engine, and visualization tool dedicated to ocean
					environmental DNA (eDNA) data. Built to host datasets generated using standardized protocols, it enables
					researchers to compare studies, discover trends, and perform complex searches across data contributed by
					NOAA Omics, NOAA Ocean Exploration, and partner organizations worldwide.
				</p>
			</section>

			{/* Team */}
			<section className="max-w-5xl mx-auto px-6 text-center mb-44">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-20">Team</h2>
				<div className="grid gap-20 md:grid-cols-3">
					{teamMembers.map((member) => (
						<div key={member.name} className="flex flex-col items-center">
							<div className="relative mb-8 h-36 w-36 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
								<Image
									src={member.image}
									alt={member.name}
									fill
									sizes="144px"
									className="object-cover"
								/>
							</div>
							<h3 className="text-xl font-semibold text-base-content mb-2">{member.name}</h3>
							<p className="text-base text-primary font-medium mb-1">{member.role}</p>
							<p className="text-sm text-base-content/70">{member.affiliation}</p>
						</div>
					))}
				</div>
			</section>

			{/* Supported By */}
			<section className="max-w-4xl mx-auto px-6 text-center mb-44">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-10">Supported By</h2>
				<p className="text-lg sm:text-xl text-base-content/90 leading-relaxed mb-20">
					The Ocean DNA Explorer is developed by the{" "}
					<Link href="https://www.northerngulfinstitute.org/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
						Northern Gulf Institute
					</Link>{" "}
					at{" "}
					<Link href="https://www.msstate.edu/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
						Mississippi State University
					</Link>{" "}
					in collaboration with{" "}
					<Link href="https://www.aoml.noaa.gov/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
						NOAA&apos;s Atlantic Oceanographic and Meteorological Laboratory
					</Link>
					. The project is supported by{" "}
					<Link href="https://oceanexplorer.noaa.gov/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
						NOAA Ocean Exploration
					</Link>{" "}
					and{" "}
					<Link href="https://oceanexplorer.noaa.gov/technology/omics/noaa-omics.html" className="text-primary hover:underline" target="_blank" rel="noreferrer">
						NOAA Omics
					</Link>{" "}
					(projects NO_0062 and NO_0066).
				</p>
				<div className="flex flex-col lg:flex-row justify-center items-center gap-14 lg:gap-28">
					<Link href="https://oceanexplorer.noaa.gov/welcome.html" target="_blank" rel="noreferrer" className="relative h-20 w-56 lg:h-28 lg:w-72">
						<Image
							src="/images/noaa_oar_logo.svg"
							alt="NOAA Oceanic and Atmospheric Research logo"
							fill
							sizes="288px"
							className="object-contain [html[data-theme='dark']_&]:hidden"
						/>
						<Image
							src="/images/noaa_oar_logo_dark.svg"
							alt="NOAA Oceanic and Atmospheric Research logo"
							fill
							sizes="288px"
							className="object-contain hidden [html[data-theme='dark']_&]:block"
						/>
					</Link>
					<Link href="https://www.northerngulfinstitute.org/" target="_blank" rel="noreferrer" className="relative h-20 w-80 lg:h-28 lg:w-104">
						<ThemeAwareLogo
							src="/images/ngi_msu_logo_FINAL.svg"
							alt="Mississippi State University, Northern Gulf Institute Logo"
							fill={true}
							className="object-contain"
						/>
					</Link>
				</div>
			</section>

			{/* Data Standards & Software - Redesigned */}
			<section className="mb-28">
				{/* Hero intro */}
				<div className="max-w-4xl mx-auto px-6 text-center mb-10">
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-8">Data Standards &amp; Software</h2>
					<p className="text-lg sm:text-xl text-base-content/90 leading-relaxed">
						The Ocean DNA Explorer implements the{" "}
						<Link href="https://fair-edna.github.io/" className="text-primary hover:underline font-medium" target="_blank" rel="noreferrer">
							FAIR eDNA metadata standard
						</Link>
						—an international, community-driven standard built on Darwin Core and MIxS that helps environmental DNA data stay Findable, Accessible, Interoperable, and Reusable. For workflows and best practices, see the{" "}
						<Link href="https://noaa-omics-dmg.readthedocs.io/" className="text-primary hover:underline font-medium" target="_blank" rel="noreferrer">
							NOAA Omics Data Management Guide
						</Link>.
					</p>
				</div>

				{/* Software Pipeline - Full width visual */}
				<div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-200/40 py-14">
					<div className="max-w-6xl mx-auto px-6">
						<p className="text-center text-sm sm:text-base font-semibold tracking-widest text-base-content/70 mb-8">
							Open-Source Tools
						</p>
						
						{/* Pipeline flow */}
						<div className="grid lg:grid-cols-4 gap-6 lg:gap-4">
							{/* Step 1 */}
							<Link
								href="https://github.com/aomlomics/fairesheets"
								target="_blank"
								rel="noreferrer"
								className="group relative min-h-[320px] bg-base-100/80 dark:bg-base-100/10 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-primary/30 flex flex-col"
							>
								<h3 className="text-xl font-semibold text-base-content group-hover:text-primary transition-colors mb-3">
									FAIReSheets
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed">
									Build standardized metadata templates in Google Sheets, aligned with FAIR eDNA and ready for Ocean DNA Explorer submission.
								</p>
								<span className="mt-auto pt-6 text-base text-primary font-medium">View on GitHub →</span>
							</Link>

							{/* Step 2 */}
							<Link
								href="https://github.com/aomlomics/tourmaline"
								target="_blank"
								rel="noreferrer"
								className="group relative min-h-[320px] bg-base-100/80 dark:bg-base-100/10 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-primary/30 flex flex-col"
							>
								<h3 className="text-xl font-semibold text-base-content group-hover:text-primary transition-colors mb-3">
									Tourmaline
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed">
									Process raw amplicon reads into high-quality features and occurrences using reproducible, science-grade workflows.
								</p>
								<span className="mt-auto pt-6 text-base text-primary font-medium">View on GitHub →</span>
							</Link>

							{/* Step 3 */}
							<Link
								href="https://github.com/aomlomics/faire2ncbi"
								target="_blank"
								rel="noreferrer"
								className="group relative min-h-[320px] bg-base-100/80 dark:bg-base-100/10 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-primary/30 flex flex-col"
							>
								<h3 className="text-xl font-semibold text-base-content group-hover:text-primary transition-colors mb-3">
									FAIRe2NCBI
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed">
									Prepare and submit sequence data and metadata to NCBI archives directly from FAIR eDNA–compliant tables.
								</p>
								<span className="mt-auto pt-6 text-base text-primary font-medium">View on GitHub →</span>
							</Link>

							{/* Step 4 */}
							<Link
								href="https://github.com/aomlomics/edna2obis"
								target="_blank"
								rel="noreferrer"
								className="group relative min-h-[320px] bg-base-100/80 dark:bg-base-100/10 backdrop-blur rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-primary/30 flex flex-col"
							>
								<h3 className="text-xl font-semibold text-base-content group-hover:text-primary transition-colors mb-3">
									edna2obis
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed">
									Convert occurrence outputs to Darwin Core for publishing to biodiversity aggregators like OBIS and GBIF.
								</p>
								<span className="mt-auto pt-6 text-base text-primary font-medium">View on GitHub →</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Contribute */}
			<section className="max-w-3xl mx-auto px-6 text-center mb-32">
				<Image
					src="/images/construction_octo.png"
					alt="Construction octopus"
					width={320}
					height={320}
					className="mx-auto -mb-10"
				/>
				<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-4">Help Us Improve</h2>
				<p className="text-lg sm:text-xl text-base-content/85 mb-8">
					Found a bug, have a feature request, or want to suggest a new visualization?<br />
					We welcome feedback from the community.
				</p>
				<Link
					href="https://github.com/aomlomics/ocean-dna-explorer/issues"
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-2 text-xl font-medium text-primary hover:underline"
				>
					Open an issue on GitHub <span>↗</span>
				</Link>
			</section>
		</main>
	);
}
