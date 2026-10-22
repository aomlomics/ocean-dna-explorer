import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Make Discoveries",
	description:
		"Search, map, and chart ocean eDNA data. Explore taxonomy images, primer diagrams, linked records, and BLAST sequence search."
};

export default function DiscoveriesPage() {
	return (
		<div id="panel-discoveries" className="pb-8 sm:pb-12">
			{/* Title above first wave (same bg as first band: base-100) */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-14 pb-8 sm:pb-10">
				<h2 className="text-center text-2xl sm:text-3xl font-semibold text-base-content max-w-3xl mx-auto leading-snug">
					Tools that help you make discoveries
				</h2>
				<p className="mt-4 text-base sm:text-lg text-base-content/80 text-center max-w-2xl mx-auto leading-relaxed">
					Built to help you ask and answer questions with eDNA data, from a map pin to a DNA sequence.
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
										src="/images/learn/discoveries/discover_search_example_light.webp"
										alt="Search page with filters"
										width={1920}
										height={1080}
										className="h-auto w-full [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/learn/discoveries/discover_search_example_dark.webp"
										alt="Search page with filters"
										width={1920}
										height={1080}
										className="hidden h-auto w-full [html[data-theme='dark']_&]:block"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
								<div className="w-full">
									<Image
										src="/images/learn/discoveries/discover_search_example_2_light.webp"
										alt="Search page with copy as API query"
										width={1920}
										height={1080}
										className="h-auto w-full rounded-2xl [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/learn/discoveries/discover_search_Example_2_dark.webp"
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
										src="/images/learn/discoveries/discover_map_draw_shape.webp"
										alt="Map with drawn shape"
										width={1920}
										height={1080}
										className="h-auto w-full rounded-2xl"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
								</div>
								<div className="relative w-full aspect-video overflow-hidden rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15">
									<Image
										src="/images/learn/discoveries/discover_map_ex_2_light.webp"
										alt="Map example"
										fill
										className="object-fill [html[data-theme='dark']_&]:hidden"
										sizes="(max-width: 1024px) 100vw, 42vw"
									/>
									<Image
										src="/images/learn/discoveries/discover_map_ex_2_dark.webp"
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
						<div className="max-w-3xl mb-10 lg:mb-12">
							<p className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wider text-primary mb-3">
								Visualize
							</p>
							<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
								Build charts directly in your browser
							</h3>
							<p className="text-base text-base-content/80 leading-relaxed mb-6">
								Filter with the same query builder as Search, then chart the result. Sample Metadata is a scatter plot
								of sample fields. Taxonomy charts include abundance, treemaps, heatmaps, composition, and dark taxa.
								Alpha Diversity is a box plot of metrics computed on the server from your filters. Pan, zoom, and copy
								your chart as a PNG.
							</p>
							<ul className="space-y-3 mb-8">
								{[
									"Sample Metadata scatter plots for dates, depth, numbers, and custom fields",
									"Taxonomy charts by rank, per library or for the whole community",
									"Alpha diversity box plots, no coding required"
								].map((item) => (
									<CheckItem key={item}>{item}</CheckItem>
								))}
							</ul>
							<TextLink href="/visualize/metadata">Go to Visualize</TextLink>
						</div>
						<div className="grid sm:grid-cols-3 gap-4">
							<ImageSlot
								label="Sample Metadata"
								alt="Sample Metadata scatter plot"
								lightSrc="/images/learn/discoveries/discover_sample_viz_light.webp"
								darkSrc="/images/learn/discoveries/discover_sample_viz_dark.webp"
								sizes="(max-width: 640px) 100vw, 30vw"
							/>
							<ImageSlot
								label="Taxonomy treemap"
								alt="Taxonomy treemap chart"
								lightSrc="/images/learn/discoveries/discover_treemap_light.webp"
								darkSrc="/images/learn/discoveries/discover_treemap_dark.webp"
								sizes="(max-width: 640px) 100vw, 30vw"
							/>
							<ImageSlot
								label="Sample Heatmap"
								alt="Taxonomy sample heatmap"
								lightSrc="/images/learn/discoveries/discover_heatmap_light.webp"
								darkSrc="/images/learn/discoveries/discover_heatmap_dark.webp"
								sizes="(max-width: 640px) 100vw, 30vw"
							/>
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

			{/* Section 4: Displays built for eDNA */}
			<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] bg-base-200">
				<div className="pt-16 sm:pt-20 pb-24 sm:pb-32">
					<div className="max-w-7xl mx-auto px-4 sm:px-6">
						<div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
							<div>
								<p className="text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-wider text-primary mb-3">
									Built for <span className="normal-case">eDNA</span>
								</p>
								<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
									Custom built components for eDNA data
								</h3>
								<p className="text-base text-base-content/80 leading-relaxed mb-6">
									Explore pages for each table connect the parts of an eDNA project: sampling and environmental
									measurements, how taxonomy was determined, and which primers were used. Those pages are linked to one
									another, so you can move from a project to its samples, assays, and taxa, or open a count in Search.
									They also include components built for eDNA data, listed below.
								</p>
								<ul className="space-y-3 mb-8">
									{[
										"PhyloPic silhouettes on taxonomy pages, matched through GBIF",
										"GBIF photos and IUCN Red List status, with a warning before photos that may show specimens",
										"Primer diagram on each assay page for the forward and reverse primers",
										"Stat cards that open that slice in Search, so a project stays linked to its samples, taxa, and occurrences"
									].map((item) => (
										<CheckItem key={item}>{item}</CheckItem>
									))}
								</ul>
								<TextLink href="/explore">Browse Explore</TextLink>
							</div>
							<div className="flex flex-col gap-4">
								<div className="grid grid-cols-2 gap-4 items-end">
									<ImageSlot
										label="Taxonomy Explore page"
										alt="Taxonomy Explore page with PhyloPic silhouettes"
										aspect="square"
										lightSrc="/images/learn/discoveries/discover_taxonomy_explore_light.webp"
										darkSrc="/images/learn/discoveries/discover_taxonomy_explore_dark.webp"
										sizes="(max-width: 1024px) 50vw, 21vw"
									/>
									<ImageSlot
										label="Assay primer diagram"
										alt="Assay page primer diagram"
										lightSrc="/images/learn/discoveries/discover_primer_light.webp"
										darkSrc="/images/learn/discoveries/discover_primer_dark.webp"
										sizes="(max-width: 1024px) 50vw, 21vw"
									/>
								</div>
								<ImageSlot
									label="Project page"
									alt="Project page with View as Search stat cards"
									lightSrc="/images/learn/discoveries/discover_project_light.webp"
									darkSrc="/images/learn/discoveries/discover_project_dark.webp"
									sizes="(max-width: 1024px) 100vw, 42vw"
								/>
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

			{/* Wave section 5: BLAST */}
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
									BLAST
								</p>
								<h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-base-content mb-4">
									Start from a DNA sequence
								</h3>
								<p className="text-base text-base-content/80 leading-relaxed mb-6">
									Search is not only names and metadata. Paste a sequence and BLAST it against features already in ODE.
									Matches come back with identity and coverage, so a sequence you have can land on the samples and taxa
									in the archive.
								</p>
								<ul className="space-y-3 mb-8">
									{[
										"BLAST from the Search page on desktop",
										"Choose an assay database and set identity or coverage cutoffs",
										"Open matching features and keep exploring"
									].map((item) => (
										<CheckItem key={item}>{item}</CheckItem>
									))}
								</ul>
								<TextLink href="/search">Try BLAST on Search</TextLink>
							</div>
							<div className="flex flex-col gap-4 lg:order-1">
								<ImageSlot
									label="BLAST on Search"
									note="BLAST panel with a sequence pasted in. Light and dark."
								/>
								<ImageSlot
									label="BLAST results"
									note="Matching features after a BLAST run. Light and dark."
								/>
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

function CheckItem({ children }: { children: ReactNode }) {
	return (
		<li className="flex gap-3 items-start">
			<span className="shrink-0 mt-0.5 text-primary" aria-hidden>
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</span>
			<span className="text-base text-base-content/80">{children}</span>
		</li>
	);
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-1.5 text-base font-normal text-primary hover:underline transition-colors"
		>
			{children}
			<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				/>
			</svg>
		</Link>
	);
}

function ImageSlot({
	label,
	note,
	aspect = "video",
	lightSrc,
	darkSrc,
	alt,
	sizes = "(max-width: 1024px) 100vw, 42vw"
}: {
	label: string;
	note?: string;
	aspect?: "video" | "square";
	lightSrc?: string;
	darkSrc?: string;
	alt?: string;
	sizes?: string;
}) {
	const frameClass = aspect === "square" ? "aspect-square" : "aspect-video min-h-40";

	if (lightSrc && darkSrc) {
		return (
			<div
				className={`relative w-full overflow-hidden rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15 ${frameClass}`}
			>
				<Image
					src={lightSrc}
					alt={alt ?? label}
					fill
					sizes={sizes}
					className="object-cover [html[data-theme='dark']_&]:hidden"
				/>
				<Image
					src={darkSrc}
					alt={alt ?? label}
					fill
					sizes={sizes}
					className="hidden object-cover [html[data-theme='dark']_&]:block"
				/>
			</div>
		);
	}

	return (
		<figure
			className={`flex flex-col items-center justify-center gap-2 rounded-2xl ring-1 ring-base-300/80 [html[data-theme='dark']_&]:ring-base-content/15 bg-base-200/50 w-full px-4 py-6 ${frameClass}`}
		>
			<p className="text-base font-medium text-base-content/80 text-center">{label}</p>
			{note ? <p className="text-sm text-base-content/50 text-center max-w-sm">{note}</p> : null}
		</figure>
	);
}
