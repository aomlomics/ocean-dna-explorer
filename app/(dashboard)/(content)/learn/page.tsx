import Image from "next/image";
import dynamic from "next/dynamic";
import UnderConstruction from "@/app/components/UnderConstruction";
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
				<div id="panel-discoveries">
					<UnderConstruction message="This page is under construction." />

					{/* Title above first wave */}
					<div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary text-center mb-2">
							Tech to match the science
						</h2>
						<p className="text-base sm:text-lg text-base-content/80 text-center max-w-2xl mx-auto">
							The Ocean DNA Explorer was built not just to display data, but to help answer scientific questions about eDNA data.
						</p>
					</div>

					{/* Wave section 1: Visualize */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-200/60 [html[data-theme='dark']_&]:bg-base-300/50">
						<svg className="absolute -top-px left-0 w-full h-14 sm:h-20 text-base-100 rotate-180" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
						<div className="pt-14 sm:pt-16 pb-14 sm:pb-16">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div>
										<p className="text-sm font-medium uppercase tracking-wider text-primary mb-2">Visualize</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											Build the right charts for your question
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Choose filters and dimensions on the Visualize page to compare taxa, sites, or time periods and spot trends in your eDNA data.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Filter by taxonomy, project, or sample metadata",
												"Pick dimensions (e.g. site, date, species) for axes and grouping",
												"Export or share views for reports and collaboration"
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
										<a href="/explore" className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline transition-colors">
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
						<svg className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
					</section>

					{/* Wave section 2: Search */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-100">
						<div className="pt-10 sm:pt-12 pb-10 sm:pb-12">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div className="lg:order-2">
										<p className="text-sm font-medium uppercase tracking-wider text-primary mb-2">Search</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											Pull the right data with targeted searches
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Use the Search page to query across projects, samples, and occurrences. Combine filters and advanced search to narrow results to the exact subset you need.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Search by species, location, assay, or sample metadata",
												"Use advanced filters for complex questions",
												"Export results for further analysis or reporting"
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
										<a href="/search" className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline transition-colors">
											Go to Search
											<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
										</a>
									</div>
									<div className="flex flex-col gap-4 lg:order-1">
										<div className="rounded-2xl bg-base-200/80 aspect-video w-full min-h-[200px]" aria-hidden />
										<div className="rounded-2xl bg-base-200/80 aspect-video w-full min-h-[160px]" aria-hidden />
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Wave section 3: Map */}
					<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-base-200/60 [html[data-theme='dark']_&]:bg-base-300/50">
						<svg className="absolute -top-px left-0 w-full h-14 sm:h-20 text-base-100 rotate-180" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
							<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
						</svg>
						<div className="pt-14 sm:pt-16 pb-14 sm:pb-16">
							<div className="max-w-7xl mx-auto px-4 sm:px-6">
								<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
									<div>
										<p className="text-sm font-medium uppercase tracking-wider text-primary mb-2">Map</p>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
											Focus on regions and sites that matter
										</h3>
										<p className="text-base text-base-content/80 leading-relaxed mb-6">
											Draw on the map or select sites to restrict your view to a study area, watershed, or transect. Combine map selection with Search and Visualize to analyze by geography.
										</p>
										<ul className="space-y-3 mb-8">
											{[
												"Draw polygons or circles to define areas of interest",
												"Filter by detected vs. not detected at sites",
												"Compare presence across sites over time"
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
										<a href="/explore" className="inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline transition-colors">
											Explore the map
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
						<svg className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
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
