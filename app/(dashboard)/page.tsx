import { MainStats, MainStatsSkeleton, AssayStats } from "@/app/components/DataSummary";
import Link from "next/link";
import Image from "next/image";
import ThemeAwareLogo from "../components/images/ThemeAwareLogo";
import { prismaImages } from "../helpers/prismaImages";
import Carousel from "../components/images/Carousel";
import { Suspense } from "react";
import ClientMap from "../components/map/ClientMap";
import DataSummaryHighlights, { FeaturedOrganismsSection } from "../components/DataSummaryHighlights";
import DashCard from "../components/dataSummary/DashCard";
import { DepthCoverageCard } from "../components/dataSummary/DepthCoverageCard";
import {
	TopInstitutionsCard,
	SamplingEnvironmentsCard,
	SamplesOverTimeCard,
	TemporalCoverageCard,
	WidgetCardSkeleton
} from "../components/DashboardExtras";

const heroPrimaryBtnClass =
	"btn btn-md btn-secondary bg-primary/90 backdrop-blur-sm outline-none border-0 text-white font-normal hover:bg-primary transition-all duration-300 text-base px-6 py-3 min-h-12";

export default function Home() {
	return (
		<main className="relative flex flex-col grow bg-base-400 text-base-content">
			<div className="absolute top-0 left-0 right-0 z-sticky bg-orange-500 text-white p-2 sm:p-4 text-center">
				<p className="text-sm sm:text-base">
					<span className="font-bold">BETA:</span> The Ocean DNA Explorer is under active development. Please report
					bugs and feature requests on our{" "}
					<Link
						href="https://github.com/aomlomics/ocean-dna-explorer/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="underline hover:text-gray-200"
					>
						Github
					</Link>
					.
				</p>
			</div>

			<div className="relative w-full h-screen max-h-[68vh] min-h-80 sm:max-h-[64vh] bg-black overflow-hidden">
				<Suspense fallback={<div className="absolute inset-0 overflow-hidden bg-base-100"></div>}>
					<SuspenseCarousel />
				</Suspense>

				<div className="absolute inset-0 flex items-center z-raised">
					<div className="w-full px-4 xl:px-8 max-w-[95%] xl:max-w-[85%] mx-auto">
						<div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
							<h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-6xl xl:text-7xl font-light leading-[0.9] sm:leading-[0.95] mb-2 sm:mb-2">
								<span className="block text-primary font-normal">Welcome</span>
							</h1>

							<div className="text-base-content/90 font-normal -mt-1 sm:-mt-2">
								<span className="block text-4xl text-shadow-3xl sm:text-5xl md:text-5xl lg:text-5xl xl:text-6xl font-normal leading-tight mb-2 sm:mb-3">
									to the <span className="text-primary font-normal">Ocean DNA Explorer</span>
								</span>

								<div className="text-lg sm:text-xl md:text-xl lg:text-xl xl:text-2xl text-shadow-xl leading-relaxed sm:leading-snug text-base-content max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mb-4 sm:mb-5">
									<span className="block">
										a data sharing platform, search engine, and visualization
										<br />
										and analysis tool for ocean environmental DNA data
									</span>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
								<Link href="#dataSummary" className={heroPrimaryBtnClass}>
									Start Here
								</Link>
								<Link href="/explore/project" className={heroPrimaryBtnClass}>
									Explore the Data
								</Link>
								<Link href="/learn?section=edna101" className={heroPrimaryBtnClass}>
									What is eDNA?
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div id="dataSummary" className="z-raised scroll-mt-20 px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 pb-12">
				<div className="max-w-7xl mx-auto space-y-14">
					{/*
					 * Row 1 — The 4 headline stat cards at the top. This row is
					 * untouched on purpose — the user likes its current look,
					 * animation and skeleton.
					 */}
					<Suspense fallback={<MainStatsSkeleton />}>
						<MainStats />
					</Suspense>

					{/*
					 * Row 2 — Map on the left, three small stat cards stacked on
					 * the right (Target Genes donut, Temporal Coverage, Data
					 * Contributors). The map fills its column edge-to-edge, no
					 * decorative wrapper.
					 */}
					<div className="space-y-5">
						{/* Row 2a — Map + Target genes at matching height */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
							<div className="lg:col-span-8">
								<div className="h-105 sm:h-130 w-full">
									<ClientMap url={"/api/sample"} legend titleTable="project" cluster />
								</div>
							</div>

							<div className="lg:col-span-4">
								<div className="h-105 sm:h-130 w-full">
									<DashCard
										title="Target Genes"
										titleClassName="text-base-content/75"
										className="h-full"
										padding="none"
										bodyClassName="flex flex-col h-full px-5 sm:px-6 pb-5 sm:pb-6"
										info={{
											title: "Target Genes",
											description:
												"Share of assays grouped by their target gene (e.g. COI, 18S, 12S). This tells you what barcodes the ODE record is biased toward.",
											links: [
												{ label: "Browse assays", href: "/explore/assay" },
												{ label: "View analyses", href: "/explore/analysis" },
												{
													label: "About this chart",
													href: "https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays",
													target: "_blank"
												},
												{
													label: "Request an assay",
													href: "https://github.com/NOAA-Omics/noaa-omics-metabarcoding-assays/issues",
													target: "_blank"
												}
											]
										}}
									>
										<div className="flex-1 min-h-0 w-full">
											<Suspense fallback={<div className="h-full w-full skeleton rounded-lg" />}>
												<AssayStats compact />
											</Suspense>
										</div>
									</DashCard>
								</div>
							</div>
						</div>

						{/* Row 2b — Dashboard body laid out by placement priority:
						    left column = depth/context cards, right column = trend and
						    contributor/explore cards. */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
							<div className="lg:col-span-4 flex flex-col gap-5">
								<Suspense fallback={<WidgetCardSkeleton className="h-88" />}>
									<DepthCoverageCard />
								</Suspense>
								<Suspense fallback={<WidgetCardSkeleton className="h-80" />}>
									<SamplingEnvironmentsCard />
								</Suspense>
								<Suspense fallback={<WidgetCardSkeleton className="h-112" />}>
									{/* TODO: uncomment out once fixed */}
									{/* <MetadataCompletenessCard /> */}
								</Suspense>
							</div>

							<div className="lg:col-span-8 flex flex-col gap-5">
								<Suspense fallback={<WidgetCardSkeleton className="h-64" />}>{/* <TableCountsCard /> */}</Suspense>
								<Suspense fallback={<WidgetCardSkeleton className="h-80" />}>
									<SamplesOverTimeCard />
								</Suspense>
								<div className="w-full lg:w-[70%] lg:mr-auto">
									<Suspense fallback={<WidgetCardSkeleton className="h-56" />}>
										<TemporalCoverageCard />
									</Suspense>
								</div>
								<div className="w-full lg:w-[70%] lg:mr-auto">
									<Suspense fallback={<WidgetCardSkeleton className="h-64" />}>
										<TopInstitutionsCard />
									</Suspense>
								</div>
							</div>
						</div>
					</div>

					{/* Row 3 — Latest submissions (project + analysis) */}
					<Suspense>
						<DataSummaryHighlights />
					</Suspense>

					{/* Row 5 — Featured Organisms carousel */}
					<FeaturedOrganismsSection />

					{/* Row 6 — Life Across ODE */}
					<Suspense>
						{/* TODO: uncomment out once fixed */}
						{/* <TopTaxonomiesSummary /> */}
					</Suspense>
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
							<Link
								href="https://oceanexplorer.noaa.gov/welcome.html"
								target="_blank"
								rel="noreferrer"
								className="relative h-16 w-48 lg:h-24 lg:w-64"
							>
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

							<Link
								href="https://www.northerngulfinstitute.org/"
								target="_blank"
								rel="noreferrer"
								className="relative h-16 w-80 lg:h-24 lg:w-104"
							>
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
		</main>
	);
}

async function SuspenseCarousel() {
	const carouselImages = await prismaImages.image.findMany({
		where: {
			homePage: true
		},
		include: {
			Attribution: true
		}
	});

	let currentIndex = carouselImages.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[carouselImages[currentIndex], carouselImages[randomIndex]] = [
			carouselImages[randomIndex],
			carouselImages[currentIndex]
		];
	}

	return <Carousel images={carouselImages} />;
}
