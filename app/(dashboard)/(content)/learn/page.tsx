import Image from "next/image";
import dynamic from "next/dynamic";
import LearnSectionToggle from "@/app/components/LearnSectionToggle";

// Dynamic import for the DataJourney component to optimize loading
const DataJourney = dynamic(() => import("@/app/components/DataJourney"), {
	ssr: true,
	loading: () => (
		<div className="min-h-[400px] flex items-center justify-center">
			<div className="animate-pulse text-primary text-xl">Loading Data Journey...</div>
		</div>
	)
});

const ImpactLearnPage = dynamic(() => import("@/app/components/ImpactLearnPage"), {
	ssr: true,
	loading: () => (
		<div className="min-h-[400px] flex items-center justify-center">
			<div className="animate-pulse text-primary text-xl">Loading Impact...</div>
		</div>
	)
});

const TABS = [
	{ id: "edna101", label: "eDNA 101" },
	{ id: "impact", label: "Impact" },
	{ id: "discoveries", label: "Make your own Discoveries" }
] as const;

const VALID_SECTIONS: readonly string[] = TABS.map((t) => t.id);

/** Dark assets for now. Swap or extend with light paths when adding theme switching. */
const DISCOVER_IMAGES = {
	search: [
		"/images/discover_search_example_dark.webp",
		"/images/discover_search_Example_2_dark.webp"
	],
	maps: ["/images/discover_map_draw_shape.webp", "/images/discover_map_ex_2_dark.webp"]
} as const;

type SectionId = (typeof TABS)[number]["id"];
type PageProps = { searchParams: Promise<{ section?: string }> };

export default async function LearnPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const section: SectionId =
		params.section && VALID_SECTIONS.includes(params.section) ? (params.section as SectionId) : "edna101";

	return (
		<main className="min-h-screen bg-base-100 text-base-content -mt-4">
			{/* Page Banner */}
			<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-6 sm:mb-8 bg-base-100">
				<div className="relative min-h-0">
					<Image
						src="/images/learn_page_banner.jpg"
						alt="Learn page banner"
						fill
						sizes="100vw"
						className="object-cover opacity-20"
						priority
					/>
					<div className="relative z-10 w-full max-w-6xl mx-auto px-5 py-14 sm:py-20 text-center">
						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-primary">Learn</h1>
						<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
							Discover how environmental DNA is collected and analyzed, its impact on science, and how to make your own scientific discoveries on the Ocean DNA Explorer
						</p>
						<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
							Use the toggle below to switch between sections
						</p>
						<LearnSectionToggle currentSection={section} />
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

			{/* Section content */}
			{section === "edna101" && (
				<div id="panel-edna101">
					<DataJourney />
				</div>
			)}
			{section === "impact" && (
				<div id="panel-impact">
					<ImpactLearnPage />
				</div>
			)}
			{section === "discoveries" && (
				<div id="panel-discoveries" className="pb-8 sm:pb-12">
					{/* Title above first wave (same bg as first band: base-100) */}
					<div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-14 pb-8 sm:pb-10">
						<h2 className="text-center text-2xl sm:text-3xl font-semibold text-base-content max-w-3xl mx-auto leading-snug">
							Tech built to promote discovery
						</h2>
						<p className="mt-4 text-base sm:text-lg text-base-content/80 text-center max-w-2xl mx-auto leading-relaxed">
							Built to help you ask and answer questions with eDNA data.
						</p>
					</div>

					{/* Wave section 1: Search */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-100">
						<svg
							className="absolute -top-px left-0 w-full h-16 sm:h-24 text-base-100 rotate-180"
							viewBox="0 0 1440 160"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
						<div className="pt-20 sm:pt-28 pb-20 sm:pb-28">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div className="lg:order-2">
										<p className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wider text-primary mb-3">
											Search
										</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											UI search with API export
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Search projects, samples, and occurrences. Build filters and relations in the UI, then use{" "}
											<span className="font-medium text-base-content">Copy as API query</span> to copy the URL and get that data outside the app.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Build the query in the UI",
												"Copy as API query to pull the same data anywhere",
												"Export rows from the results table"
											].map((item, i) => (
												<li key={i} className="flex gap-3 items-start">
													<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
														<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
															<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
														</svg>
													</span>
													<span className="text-base text-base-content/80">{item}</span>
												</li>
											))}
										</ul>
										<a href="/search" className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors">
											Go to Search
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
										</a>
									</div>
									<div className="flex flex-col gap-4 lg:order-1">
										{DISCOVER_IMAGES.search.map((src, i) => (
											<div key={src} className="w-full">
												<Image
													src={src}
													alt={i === 0 ? "Search page with filters" : "Search page with copy as API query"}
													width={1920}
													height={1080}
													className="h-auto w-full rounded-2xl"
													sizes="(max-width: 1024px) 100vw, 42vw"
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
						<svg
							className="absolute -bottom-px left-0 w-full h-16 sm:h-24 text-base-200"
							viewBox="0 0 1440 160"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
					</section>

					{/* Section 2: Maps */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-200">
						<div className="py-16 sm:py-20">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div>
										<p className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wider text-primary mb-3">
											Maps
										</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											Custom maps across the site
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Maps are tailored to each part of the site and the level you are working at. Draw polygons, view search hits on the map, and filter by metadata such as taxonomy, temperature, salinity, or any other fields you have.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Draw polygons for areas you care about",
												"Search hits on the map",
												"Filter by any metadata the data carries"
											].map((item, i) => (
												<li key={i} className="flex gap-3 items-start">
													<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
														<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
															<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
														</svg>
													</span>
													<span className="text-base text-base-content/80">{item}</span>
												</li>
											))}
										</ul>
										<a
											href="/#dataSummary"
											className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
										>
											See the home page project map
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
										</a>
									</div>
									<div className="flex flex-col gap-4 pb-6 sm:pb-8">
										{DISCOVER_IMAGES.maps.map((src, i) => (
											<div key={src} className="w-full">
												<Image
													src={src}
													alt={i === 0 ? "Map with drawn shape" : "Map example"}
													width={1920}
													height={1080}
													className="h-auto w-full rounded-2xl"
													sizes="(max-width: 1024px) 100vw, 42vw"
												/>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
						<svg
							className="absolute -bottom-px left-0 w-full h-16 sm:h-24 text-base-100"
							viewBox="0 0 1440 160"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
					</section>

					{/* Wave section 3: Visualize */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-100">
						<svg
							className="absolute -top-px left-0 w-full h-16 sm:h-24 text-base-100 rotate-180"
							viewBox="0 0 1440 160"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
						<div className="pt-20 sm:pt-28 pb-20 sm:pb-28">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div>
										<p className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wider text-primary mb-3">
											Visualize
										</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											Build charts directly in your browser
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Filter your input data with the search query builder, then open sample scatter plots or taxonomy bar charts. Pick axes, ranks, and absolute or relative abundance. Diversity metrics are computed on the backend from your filters. Pan, zoom, and copy the chart image.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Scatter plots for dates, depth, numbers, and custom sample fields",
												"Taxon bars by rank, per library or grouped by sample fields",
												"All in the page, no coding required"
											].map((item, i) => (
												<li key={i} className="flex gap-3 items-start">
													<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
														<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
															<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
														</svg>
													</span>
													<span className="text-base text-base-content/80">{item}</span>
												</li>
											))}
										</ul>
										<a
											href="/visualize/metadata"
											className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
										>
											Go to Visualize
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
										</a>
									</div>
									<div className="flex flex-col gap-4">
										<div className="rounded-2xl bg-base-300/60 aspect-video w-full min-h-[200px]" aria-hidden />
										<div className="rounded-2xl bg-base-300/60 aspect-video w-full min-h-[160px]" aria-hidden />
									</div>
								</div>
							</div>
						</div>
						<svg
							className="absolute -bottom-px left-0 w-full h-16 sm:h-24 text-base-100"
							viewBox="0 0 1440 160"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
					</section>
				</div>
			)}

			{/* Pill toggle at bottom (duplicate of banner toggle) */}
			<div className="flex justify-center pb-8 sm:pt-5 sm:pb-10">
				<LearnSectionToggle currentSection={section} />
			</div>
		</main>
	);
}
