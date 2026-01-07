import { MainStats, AssayStats } from "@/app/components/DataSummary";
import Link from "next/link";
import Image from "next/image";
import ThemeAwareLogo from "../components/images/ThemeAwareLogo";
import { publicPrisma } from "../helpers/prisma";
import { prismaImages } from "../helpers/prismaImages";
import Carousel from "../components/images/Carousel";
import Map from "@/app/components/map/Map";
import { Suspense } from "react";

export default async function Home() {
	const carouselImages = (await prismaImages.image.findMany({ include: { Attribution: true } }))
		.map((value) => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	return (
		<main className="relative flex flex-col grow bg-base-400 text-base-content">
			<div className="absolute top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2 sm:p-4 text-center">
				<p className="text-sm sm:text-base">
					<span className="font-bold">BETA:</span> The Ocean DNA Explorer is under active development. Please report
					bugs and feature requests{" "}
					<a
						href="https://github.com/aomlomics/ocean-dna-explorer/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="underline hover:text-gray-200"
					>
						here
					</a>
					.
				</p>
			</div>
			<div className="relative w-full h-screen max-h-[80vh] bg-black overflow-hidden z-content-overlay">
				<Carousel images={carouselImages} />
				{/* Updated hero content container */}
				<div className="absolute inset-0 flex items-center z-content">
					<div className="w-full px-4 sm:px-4 md:px-6 lg:px-8 xl:px-8 max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] xl:max-w-[85%] mx-auto">
						<div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
							<h1 className="text-6xl sm:text-7xl md:text-7xl lg:text-7xl xl:text-8xl font-light leading-[0.9] sm:leading-[0.95] mb-2 sm:mb-2">
								<span className="block text-primary font-light">Welcome</span>
							</h1>

							<div className="text-base-content/90 font-normal -mt-1 sm:-mt-2">
								<span className="block text-3xl text-shadow-2xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-5xl leading-tight mb-2 sm:mb-3">
									to the <span className="text-primary">Ocean DNA Explorer</span>
								</span>

								<div className="text-lg sm:text-xl md:text-xl lg:text-xl xl:text-2xl text-shadow-xl leading-relaxed sm:leading-snug text-base-content max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mb-6 sm:mb-8 lg:mb-10">
									<span className="block">
										a data sharing platform, search engine, and visualization
										<br />
										and analysis tool for ocean environmental DNA data
									</span>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
								<Link
									href="#dataSummary"
									className="btn btn-md sm:btn-md lg:btn-lg btn-secondary bg-primary/90 backdrop-blur-sm outline-none text-white font-normal hover:bg-primary transition-all duration-300 text-base sm:text-base lg:text-lg px-6 sm:px-6 lg:px-8 py-4 sm:py-4 lg:py-4 min-h-12 sm:min-h-12 lg:min-h-14"
								>
									Start Here
								</Link>
								<Link
									href="/explore/project"
									className="btn btn-md sm:btn-md lg:btn-lg btn-secondary bg-primary/90 backdrop-blur-sm outline-none text-white font-normal hover:bg-primary transition-all duration-300 text-base sm:text-base lg:text-lg px-6 sm:px-6 lg:px-8 py-4 sm:py-4 lg:py-4 min-h-12 sm:min-h-12 lg:min-h-14"
								>
									Explore the Data
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Removing data summary arrow for now */}
			{/* <div className="relative mb-12 text-center">
				<Link
					href="#dataSummary"
					className="relative inline-block after:absolute after:content-[''] after:inset-[-40px] after:cursor-pointer"
				>
					<p className="text-primary text-xl font-medium">Start Here!</p>
					<div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-8 w-12 text-primary mx-auto"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
						</svg>
					</div>
				</Link>
			</div> */}
			<div id="dataSummary" className="z-1000 px-4 sm:px-6 lg:px-8 pb-12 -mt-16 sm:-mt-20 md:-mt-16">
				<div className="mb-20">
					<Suspense>
						<MainStats />
					</Suspense>
				</div>

				{/* Interactive Data Journey Visualization */}
				{/* <div className="mb-32">
					<div className="text-center mb-12">
						<h2 className="text-3xl lg:text-4xl text-primary mb-4 font-light">
							Explore the Data Journey
						</h2>
						<p className="text-lg text-base-content/80 max-w-3xl mx-auto leading-relaxed">
							Discover how ocean environmental DNA data flows from research vessels to taxonomic identification. 
							Click the magnifying glasses to zoom deeper into each step of the scientific process.
						</p>
					</div>
					
					<div className="max-w-6xl mx-auto">
						<EDNAVisualization />
					</div>
					
					<div className="text-center mt-8 text-sm text-base-content/60">
						<p>Interactive visualization showing the relationship between database tables and real-world sampling</p>
					</div>
				</div> */}

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-24">
					{/* Map Section */}
					<div className="lg:col-span-7">
						<div className="mb-8 text-2xl text-base-content">
							<span>Showing all </span>
							<span className="text-primary">Projects</span>
						</div>
						<Map query={publicPrisma.sample.findMany} legend titleTable="project" cluster clusterRadius={20} />
					</div>

					{/* Assay Stats Section */}
					<div className="lg:col-span-5 flex flex-col">
						<div className="mb-8 text-2xl text-base-content">
							<span className="text-primary mr-1">Assays</span>
							<span>used across the Ocean DNA Explorer</span>
						</div>
						<Suspense>
							<AssayStats />
						</Suspense>
					</div>
				</div>

				{/* Funding Institutes Section */}
				<div className="mt-24 lg:mt-32 mb-12 lg:mb-24">
					<h2 className="text-2xl lg:text-3xl text-primary mb-6 lg:mb-8 text-center">Supported By:</h2>

					<div className="max-w-4xl mx-auto text-lg text-main mb-8 lg:mb-16 text-center leading-tight">
						<p>
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
					<div className="p-8 rounded-lg justify-center mx-auto max-w-fit mt-8 lg:-mt-4">
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
				</div>
			</div>
		</main>
	);
}
