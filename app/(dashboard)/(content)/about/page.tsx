import Image from "next/image";
import Link from "next/link";
import ThemeAwareLogo from "@/app/components/images/ThemeAwareLogo";
import WorkshopVideoCallout, { OBON_HREF, WORKSHOP_PLAYLIST_HREF } from "@/app/components/WorkshopVideoCallout";

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
		<div className="min-h-screen bg-base-100 text-base-content -mt-4">
			{/* Mission banner */}
			<section id="mission" className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] mb-28 bg-base-100">
				<div className="relative h-100">
					<Image
						src="/images/about_banner.jpg"
						alt="About page banner"
						fill
						sizes="100vw"
						className="object-cover opacity-15"
						priority
					/>
					<div className="relative z-10 h-full flex pt-28">
						<div className="w-full max-w-5xl mx-auto px-6 text-center">
							<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-primary [html[data-theme='dark']_&]:text-primary">
								Our Mission
							</h1>
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
						<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
					</svg>
				</div>
			</section>

			{/* About the Platform */}
			<section className="max-w-4xl mx-auto px-6 text-center mb-20">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-10">About the Platform</h2>
				<p className="text-lg sm:text-xl leading-relaxed text-base-content/90">
					The Ocean DNA Explorer is a data portal, search engine, and visualization tool dedicated to ocean
					environmental DNA (eDNA) data. Built to host datasets generated using standardized protocols, it enables
					researchers to compare studies, discover trends, and perform complex searches across data contributed by NOAA
					Omics, NOAA Ocean Exploration, and partner organizations worldwide.
				</p>
			</section>

			{/* Team */}
			<section id="team" className="max-w-5xl mx-auto px-6 text-center mb-28 pt-16">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-20">Team</h2>
				<div className="grid gap-20 md:grid-cols-3">
					{teamMembers.map((member) => (
						<div key={member.name} className="flex flex-col items-center">
							<div className="relative mb-8 h-36 w-36 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
								<Image src={member.image} alt={member.name} fill sizes="144px" className="object-cover" />
							</div>
							<h3 className="text-xl font-semibold text-base-content mb-2">{member.name}</h3>
							<p className="text-base text-base-content/70">{member.role}</p>
							<p className="text-sm text-base-content/70">{member.affiliation}</p>
						</div>
					))}
				</div>
			</section>

			{/* Supported By */}
			<section id="supportedBy" className="max-w-4xl mx-auto px-6 text-center mb-34 pt-16">
				<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-10">Supported By</h2>
				<p className="text-lg sm:text-xl text-base-content/90 leading-relaxed mb-20">
					The Ocean DNA Explorer is developed by the{" "}
					<Link
						href="https://www.northerngulfinstitute.org/"
						className="text-primary hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						Northern Gulf Institute
					</Link>{" "}
					at{" "}
					<Link
						href="https://www.msstate.edu/"
						className="text-primary hover:underline"
						target="_blank"
						rel="noreferrer"
					>
						Mississippi State University
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
					(projects NO_0062 and NO_0066).
				</p>
				<div className="flex flex-col lg:flex-row justify-center items-center gap-14 lg:gap-28">
					<Link
						href="https://oceanexplorer.noaa.gov/welcome.html"
						target="_blank"
						rel="noreferrer"
						className="relative h-20 w-56 lg:h-28 lg:w-72"
					>
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
					<Link
						href="https://www.northerngulfinstitute.org/"
						target="_blank"
						rel="noreferrer"
						className="relative h-20 w-80 lg:h-28 lg:w-104"
					>
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
			<section id="dataStandards" className="mb-24 pt-6">
				{/* Hero intro */}
				<div className="max-w-4xl mx-auto px-6 text-center mb-10">
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary mb-10">
						Data Standard &amp; Software Tools
					</h2>
					<p className="text-lg sm:text-xl text-base-content/90 leading-relaxed">
						The Ocean DNA Explorer implements the{" "}
						<Link
							href="https://fair-edna.github.io/"
							className="text-primary hover:underline font-medium"
							target="_blank"
							rel="noreferrer"
						>
							FAIR eDNA metadata standard
						</Link>
						, an international, community driven environmental DNA data standard built on existing standards like Darwin
						Core and MIxS that helps eDNA data become Findable, Accessible, Interoperable, and Reusable. Our team, along
						with collaborators across the FAIR eDNA community, has built a suite of open source tools to help you format
						your data to the FAIR eDNA standard, including metadata template generation, amplicon sequence processing
						workflows, and data publishing tools. The{" "}
						<Link
							href={WORKSHOP_PLAYLIST_HREF}
							className="text-primary hover:underline font-medium"
							target="_blank"
							rel="noreferrer"
						>
							FAIR eDNA Workshop
						</Link>{" "}
						video series from{" "}
						<Link
							href={OBON_HREF}
							className="text-primary hover:underline font-medium"
							target="_blank"
							rel="noreferrer"
						>
							OBON
						</Link>{" "}
						demonstrates many of these tools, and the{" "}
						<Link
							href="https://noaa-omics-dmg.readthedocs.io/"
							className="text-primary hover:underline font-medium"
							target="_blank"
							rel="noreferrer"
						>
							NOAA Omics Data Management Guide
						</Link>{" "}
						has detailed documentation on the software packages and workflows.
					</p>
				</div>

				<WorkshopVideoCallout className="mx-auto mb-8 max-w-2xl" />

				{/* Software tools */}
				<div className="max-w-5xl mx-auto px-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						<Link
							href="https://github.com/aomlomics/fairesheets"
							target="_blank"
							rel="noreferrer"
							className="group flex flex-col rounded-2xl p-6 bg-base-200/40 hover:bg-base-200/60 transition-colors"
						>
							<h3 className="text-lg font-semibold text-base-content group-hover:text-primary transition-colors mb-2">
								FAIReSheets
							</h3>
							<p className="text-base text-base-content/75 leading-relaxed flex-1">
								Build standardized metadata templates in Google Sheets, aligned with the FAIR eDNA standard and ready
								for Ocean DNA Explorer submission.
							</p>
							<span className="btn btn-primary btn-sm mt-4 w-fit">View on GitHub</span>
						</Link>
						<Link
							href="https://github.com/aomlomics/tourmaline"
							target="_blank"
							rel="noreferrer"
							className="group flex flex-col rounded-2xl p-6 bg-base-200/40 hover:bg-base-200/60 transition-colors"
						>
							<h3 className="text-lg font-semibold text-base-content group-hover:text-primary transition-colors mb-2">
								Tourmaline
							</h3>
							<p className="text-base text-base-content/75 leading-relaxed flex-1">
								Amplicon sequence processing workflow using QIIME 2 and Snakemake.
							</p>
							<span className="btn btn-primary btn-sm mt-4 w-fit">View on GitHub</span>
						</Link>
						<Link
							href="https://github.com/aomlomics/faire2ncbi"
							target="_blank"
							rel="noreferrer"
							className="group flex flex-col rounded-2xl p-6 bg-base-200/40 hover:bg-base-200/60 transition-colors"
						>
							<h3 className="text-lg font-semibold text-base-content group-hover:text-primary transition-colors mb-2">
								FAIRe2NCBI
							</h3>
							<p className="text-base text-base-content/75 leading-relaxed flex-1">
								Convert NOAA FAIRe Excel metadata files to NCBI BioSample and SRA submission templates.
							</p>
							<span className="btn btn-primary btn-sm mt-4 w-fit">View on GitHub</span>
						</Link>
						<div className="flex flex-col sm:flex-row justify-center gap-6 lg:col-span-3">
							<Link
								href="https://github.com/aomlomics/FAIRe2QIIME"
								target="_blank"
								rel="noreferrer"
								className="group flex flex-col rounded-2xl p-6 bg-base-200/40 hover:bg-base-200/60 transition-colors w-full sm:max-w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
							>
								<h3 className="text-lg font-semibold text-base-content group-hover:text-primary transition-colors mb-2">
									FAIRe2QIIME
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed flex-1">
									A Python CLI tool that converts NOAA FAIRe Excel metadata files into QIIME2-compatible metadata and
									manifest files for streamlined microbiome sequencing data analysis.
								</p>
								<span className="btn btn-primary btn-sm mt-4 w-fit">View on GitHub</span>
							</Link>
							<Link
								href="https://github.com/aomlomics/edna2obis"
								target="_blank"
								rel="noreferrer"
								className="group flex flex-col rounded-2xl p-6 bg-base-200/40 hover:bg-base-200/60 transition-colors w-full sm:max-w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
							>
								<h3 className="text-lg font-semibold text-base-content group-hover:text-primary transition-colors mb-2">
									edna2obis
								</h3>
								<p className="text-base text-base-content/75 leading-relaxed flex-1">
									Convert occurrence outputs and NOAA FAIRe metadata files to Darwin Core for publishing to biodiversity
									aggregators OBIS and GBIF.
								</p>
								<span className="btn btn-primary btn-sm mt-4 w-fit">View on GitHub</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Contribute */}
			<section className="max-w-3xl mx-auto px-6 text-center mb-28">
				<Image
					src="/images/construction_octo.png"
					alt="Construction octopus"
					width={320}
					height={320}
					className="mx-auto -mb-10"
				/>
				<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary mb-4">Help Us Improve</h2>
				<p className="text-lg sm:text-xl text-base-content/85 mb-8">
					Found a bug, have a feature request, or want to suggest a new visualization?
					<br />
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
		</div>
	);
}
