import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Make your own Discoveries"
};

export default function DiscoveriesPage() {
	return (
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
			<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] bg-base-100">
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
									UI-driven search with API export
								</h3>
								<p className="text-base text-base-content/80 leading-relaxed mb-6">
									Search projects, samples, and occurrences. Build filters and relations in the UI, then use{" "}
									<span className="font-medium text-base-content">Copy as API query</span> to copy the URL and get that
									data outside the app.
								</p>
								<ul className="space-y-3 mb-8">
									{[
										"Build the query in the UI",
										"Copy as API query to pull the same data anywhere",
										"Export rows from the results table"
									].map((item, i) => (
										<li key={i} className="flex gap-3 items-start">
											<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													strokeWidth="2.5"
												>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</span>
											<span className="text-base text-base-content/80">{item}</span>
										</li>
									))}
								</ul>
								<Link
									href="/search"
									className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
								>
									Go to Search
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</Link>
							</div>
							<div className="flex flex-col gap-4 lg:order-1">
								<div className="w-full rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15 overflow-hidden">
									<Image
										src="/images/discover_search_example_light.webp"
										alt="Search page with filters"
										width={1920}
										height={1080}
										className="h-auto w-full [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/discover_search_example_dark.webp"
										alt="Search page with filters"
										width={1920}
										height={1080}
										className="hidden h-auto w-full [html[data-theme='dark']_&]:block"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
								<div className="w-full">
									<Image
										src="/images/discover_search_example_2_light.webp"
										alt="Search page with copy as API query"
										width={1920}
										height={1080}
										className="h-auto w-full rounded-2xl [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/discover_search_Example_2_dark.webp"
										alt="Search page with copy as API query"
										width={1920}
										height={1080}
										className="hidden h-auto w-full rounded-2xl [html[data-theme='dark']_&]:block"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
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
			<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] bg-base-200">
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
									Maps are tailored to each part of the site and the level you are working at. Draw polygons, view
									search hits on the map, and filter by metadata such as taxonomy, temperature, salinity, or any other
									fields you have.
								</p>
								<ul className="space-y-3 mb-8">
									{[
										"Draw polygons for areas you care about",
										"Search hits on the map",
										"Filter by any metadata the data carries"
									].map((item, i) => (
										<li key={i} className="flex gap-3 items-start">
											<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													strokeWidth="2.5"
												>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</span>
											<span className="text-base text-base-content/80">{item}</span>
										</li>
									))}
								</ul>
								<Link
									href="/#dataSummary"
									className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
								>
									See the home page project map
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</Link>
							</div>
							<div className="flex flex-col gap-4 pb-6 sm:pb-8">
								<div className="w-full">
									<Image
										src="/images/discover_map_draw_shape.webp"
										alt="Map with drawn shape"
										width={1920}
										height={1080}
										className="h-auto w-full rounded-2xl"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
								<div className="relative w-full aspect-video overflow-hidden rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15">
									<Image
										src="/images/discover_map_ex_2_light.webp"
										alt="Map example"
										fill
										className="object-fill [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/discover_map_ex_2_dark.webp"
										alt="Map example"
										fill
										className="hidden object-fill [html[data-theme='dark']_&]:block"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
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
			<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] bg-base-100">
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
									Filter your input data with the search query builder, then open sample scatter plots or taxonomy bar
									charts. Pick axes, ranks, and absolute or relative abundance. Diversity metrics are computed on the
									backend from your filters. Pan, zoom, and copy the chart image.
								</p>
								<ul className="space-y-3 mb-8">
									{[
										"Scatter plots for dates, depth, numbers, and custom sample fields",
										"Taxon bars by rank, per library or grouped by sample fields",
										"All in the page, no coding required"
									].map((item, i) => (
										<li key={i} className="flex gap-3 items-start">
											<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													strokeWidth="2.5"
												>
													<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
												</svg>
											</span>
											<span className="text-base text-base-content/80">{item}</span>
										</li>
									))}
								</ul>
								<Link
									href="/visualize/metadata"
									className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
								>
									Go to Visualize
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</Link>
							</div>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col items-center justify-center gap-1 sm:gap-4 rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15 bg-base-200/50 aspect-video w-full min-h-50 px-4 py-6">
									<div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0">
										<Image
											src="/images/construction_octo.png"
											alt="Construction octopus"
											fill
											className="object-contain"
											sizes="144px"
										/>
									</div>
									<p className="text-lg sm:text-xl font-semibold text-primary text-center">Coming Soon!</p>
								</div>
								<div className="flex flex-col items-center justify-center gap-1 sm:gap-4 rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15 bg-base-200/50 aspect-video w-full min-h-40 px-4 py-6">
									<div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0">
										<Image
											src="/images/construction_octo.png"
											alt="Construction octopus"
											fill
											className="object-contain"
											sizes="144px"
										/>
									</div>
									<p className="text-lg sm:text-xl font-semibold text-primary text-center">Coming Soon!</p>
								</div>
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
	);
}
