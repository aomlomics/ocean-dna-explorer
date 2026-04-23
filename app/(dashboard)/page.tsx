import { MainStats, MainStatsSkeleton, AssayStats } from "@/app/components/DataSummary";
import Link from "next/link";
import Image from "next/image";
import ThemeAwareLogo from "../components/images/ThemeAwareLogo";
import { prismaImages } from "../helpers/prismaImages";
import Carousel from "../components/images/Carousel";
import { Suspense } from "react";
import TopTaxonomiesSummary from "@/app/components/TopTaxonomiesSummary";
import ClientMap from "../components/map/ClientMap";
import DataSummaryHighlights, { FeaturedOrganismsSection } from "../components/DataSummaryHighlights";
import DashCard from "../components/dashboard/DashCard";
import {
	TopInstitutionsCard,
	SamplingEnvironmentsCard,
	SampleCategoriesCard,
	TemporalCoverageCard,
	DepthCoverageCard,
	MetadataCompletenessCard,
	WidgetCardSkeleton
} from "../components/DashboardExtras";

const heroPrimaryBtnClass =
	"btn btn-md btn-secondary bg-primary/90 backdrop-blur-sm outline-none border-0 text-white font-normal hover:bg-primary transition-all duration-300 text-base px-6 py-3 min-h-12";

const NullComponent = () => null;
const MainStatsSafe = MainStats ?? NullComponent;
const MainStatsSkeletonSafe = MainStatsSkeleton ?? NullComponent;
const AssayStatsSafe = AssayStats ?? NullComponent;
const TopTaxonomiesSummarySafe = TopTaxonomiesSummary ?? NullComponent;
const ClientMapSafe = ClientMap ?? NullComponent;
const DataSummaryHighlightsSafe = DataSummaryHighlights ?? NullComponent;
const FeaturedOrganismsSectionSafe = FeaturedOrganismsSection ?? NullComponent;
const DashCardSafe = DashCard ?? NullComponent;
const TopInstitutionsCardSafe = TopInstitutionsCard ?? NullComponent;
const SamplingEnvironmentsCardSafe = SamplingEnvironmentsCard ?? NullComponent;
const SampleCategoriesCardSafe = SampleCategoriesCard ?? NullComponent;
const TemporalCoverageCardSafe = TemporalCoverageCard ?? NullComponent;
const DepthCoverageCardSafe = DepthCoverageCard ?? NullComponent;
const MetadataCompletenessCardSafe = MetadataCompletenessCard ?? NullComponent;
const WidgetCardSkeletonSafe = WidgetCardSkeleton ?? NullComponent;

export default function Home() {
	return (
		<main className="relative flex flex-col grow bg-base-400 text-base-content">
			<div className="absolute top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2 sm:p-4 text-center">
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

			<div className="relative w-full h-screen max-h-[68vh] min-h-[320px] sm:max-h-[64vh] bg-black overflow-hidden z-content-overlay">
				<Suspense fallback={<div className="absolute inset-0 overflow-hidden bg-base-100"></div>}>
					<SuspenseCarousel />
				</Suspense>

				<div className="absolute inset-0 flex items-center z-content">
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

			<div
				id="dataSummary"
				className="z-1000 scroll-mt-20 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 pb-12"
			>
				<div className="max-w-7xl mx-auto space-y-14">

					{/* Row 1 — The 4 headline stat cards. */}
					<Suspense fallback={<MainStatsSkeletonSafe />}>
						<MainStatsSafe />
					</Suspense>

					{/*
					 * Row 2 — Map + right column that stacks Target Genes on top and
					 * Top Institutions on the bottom. Target Genes is intentionally
					 * shorter now; map's height grows via flex to line up roughly
					 * with the bottom of the Top Institutions list.
					 *
					 * The map has NO card wrapper or title — the map is self-
					 * explanatory, so we just give it a rounded container.
					 */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
						<div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-[0_10px_28px_-16px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.22)]">
							<div className="h-[420px] sm:h-[520px] lg:h-full min-h-[520px] w-full">
								<ClientMapSafe
									url={"/api/sample"}
									legend
									titleTable="project"
									cluster
									clusterRadius={20}
								/>
							</div>
						</div>

						<div className="lg:col-span-4 flex flex-col gap-5">
							<DashCardSafe
								title="Target genes"
								info={{
									title: "Target genes",
									description:
										"Share of public assays grouped by their target gene (e.g. COI, 18S, 12S). This tells you what barcodes the ODE record is biased toward.",
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
								<Suspense fallback={<div className="h-64 skeleton rounded-lg" />}>
									<AssayStatsSafe compact />
								</Suspense>
							</DashCardSafe>
							<Suspense fallback={<WidgetCardSkeletonSafe className="h-64" />}>
								<TopInstitutionsCardSafe />
							</Suspense>
						</div>
					</div>

					{/* Row 3 — Latest submissions (project + analysis) */}
					<Suspense>
						<DataSummaryHighlightsSafe />
					</Suspense>

					{/*
					 * Row 4 — Dispersed real-data widgets. Three useful stats about
					 * the sampling record. These all hit the Sample table directly
					 * with single-pass aggregates, so they're cheap.
					 */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						<Suspense fallback={<WidgetCardSkeletonSafe />}>
							<SamplingEnvironmentsCardSafe />
						</Suspense>
						<Suspense fallback={<WidgetCardSkeletonSafe />}>
							<TemporalCoverageCardSafe />
						</Suspense>
						<Suspense fallback={<WidgetCardSkeletonSafe />}>
							<DepthCoverageCardSafe />
						</Suspense>
					</div>

					{/* Row 5 — Featured Organisms carousel */}
					<FeaturedOrganismsSectionSafe />

					{/* Row 6 — Life Across ODE (moved AFTER featured orgs) */}
					<Suspense>
						<TopTaxonomiesSummarySafe />
					</Suspense>

					{/*
					 * Row 7 — Metadata Completeness (wider, holistic) alongside
					 * Sample Categories so the metadata row still feels balanced.
					 */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
						<div className="lg:col-span-2">
							<Suspense fallback={<WidgetCardSkeletonSafe className="h-60" />}>
								<MetadataCompletenessCardSafe />
							</Suspense>
						</div>
						<Suspense fallback={<WidgetCardSkeletonSafe className="h-60" />}>
							<SampleCategoriesCardSafe />
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

async function SuspenseCarousel() {
	const carouselImages = await prismaImages.image.findMany({ include: { Attribution: true } });

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
