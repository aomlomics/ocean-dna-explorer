import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"

function SectionTitle({
	title,
	subtitle
}: {
	title: string
	subtitle?: string
}) {
	return (
		<header className="text-center max-w-3xl mx-auto">
			<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary">{title}</h2>
			{subtitle ? <p className="mt-4 text-base sm:text-lg text-base-content/80 leading-relaxed">{subtitle}</p> : null}
		</header>
	)
}

function WaveSection({
	children,
	tinted = true,
	size = "md"
}: {
	children: ReactNode
	tinted?: boolean
	size?: "md" | "lg"
}) {
	const bgClass = tinted ? "bg-base-200/60 [html[data-theme='dark']_&]:bg-base-300/50" : "bg-base-100"
	const padClass = size === "lg" ? "pt-24 sm:pt-32 pb-24 sm:pb-32" : "pt-12 sm:pt-16 pb-12 sm:pb-16"

	return (
		<section className={`relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] ${bgClass}`}>
			<svg
				className="absolute -top-px left-0 w-full h-14 sm:h-20 text-base-100 rotate-180"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
			</svg>

			<div className={padClass}>{children}</div>

			<svg
				className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100"
				viewBox="0 0 1440 160"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
			</svg>
		</section>
	)
}

function InfoCard({
	title,
	children,
	className = ""
}: {
	title: string
	children: ReactNode
	className?: string
}) {
	return (
		<div className={`rounded-2xl bg-base-200 p-6 shadow-sm border border-base-300/60 ${className}`}>
			<h3 className="text-xl font-semibold text-base-content">{title}</h3>
			<div className="mt-3 text-base text-base-content/80 leading-relaxed">{children}</div>
		</div>
	)
}

function MediaFrame({
	label,
	src,
	alt,
	fit = "cover",
	priority = false,
	aspect = "16/10",
	sizes = "(max-width: 1024px) 100vw, 640px"
}: {
	label: string
	src?: string
	alt?: string
	fit?: "cover" | "contain"
	priority?: boolean
	aspect?: "16/10" | "video" | "square"
	sizes?: string
}) {
	const aspectClass = aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "aspect-16/10"
	return (
		<div className={`relative overflow-hidden rounded-2xl ${aspectClass} w-full bg-base-200/40`}>
			{src ? (
				<Image
					src={src}
					alt={alt ?? label}
					fill
					sizes={sizes}
					priority={priority}
					className={`${fit === "contain" ? "object-contain" : "object-cover"} opacity-95`}
				/>
			) : (
				<>
					<div className="absolute -top-12 -right-14 h-44 w-44 rounded-full bg-primary/18 blur-2xl" aria-hidden />
					<div className="absolute -bottom-16 -left-14 h-52 w-52 rounded-full bg-secondary/10 blur-2xl" aria-hidden />
					<div
						className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.18),transparent_55%)] [html[data-theme='dark']_&]:opacity-25"
						aria-hidden
					/>
					<div className="absolute inset-0 flex items-end p-4 sm:p-5">
						<div className="rounded-2xl bg-base-100/70 [html[data-theme='dark']_&]:bg-base-100/50 border border-base-300/60 px-3.5 py-2 backdrop-blur-sm">
							<span className="text-sm text-base-content/70">{label}</span>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

function FaqItem({ q, children }: { q: string; children: ReactNode }) {
	return (
		<details className="rounded-2xl border border-base-300/60 bg-base-100 [html[data-theme='dark']_&]:bg-base-200 open:[&>summary]:border-b open:[&>summary]:border-base-300/50 open:[&_summary_svg]:rotate-180">
			<summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-transparent px-4 py-4 text-base sm:text-lg font-normal text-base-content [&::-webkit-details-marker]:hidden">
				<span className="min-w-0 pr-2">{q}</span>
				<svg
					className="h-5 w-5 shrink-0 rotate-0 text-primary transition-transform duration-200"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					strokeWidth={2}
					aria-hidden
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</summary>
			<div className="px-4 pb-4 pt-3 text-base leading-relaxed text-base-content/80">
				{children}
			</div>
		</details>
	)
}

function CompareCard({
	title,
	mediaLabel,
	mediaSrc,
	mediaAlt,
	mediaFit,
	pros,
	cons
}: {
	title: string
	mediaLabel: string
	mediaSrc: string
	mediaAlt: string
	mediaFit?: "cover" | "contain"
	pros: string[]
	cons: string[]
}) {
	return (
		<div className="rounded-3xl p-0">
			<h3 className="text-2xl font-semibold text-base-content">{title}</h3>

			<div className="mt-6 max-w-[520px] mx-auto">
				<MediaFrame
					label={mediaLabel}
					src={mediaSrc}
					alt={mediaAlt}
					fit={mediaFit}
					aspect="video"
					sizes="(max-width: 1024px) 100vw, 520px"
				/>
			</div>

			<div className="mt-7 grid sm:grid-cols-2 gap-6">
				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-base-content/70">
						<span className="text-primary" aria-hidden>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</span>
						<span>Pros</span>
					</div>
					<ul className="mt-3 space-y-2.5 text-base text-base-content/80">
						{pros.map((p) => (
							<li key={p} className="flex gap-3">
								<span className="mt-0.5 text-primary" aria-hidden>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</span>
								<span>{p}</span>
							</li>
						))}
					</ul>
				</div>

				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-base-content/70">
						<span className="text-error" aria-hidden>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</span>
						<span>Cons</span>
					</div>
					<ul className="mt-3 space-y-2.5 text-base text-base-content/80">
						{cons.map((c) => (
							<li key={c} className="flex gap-3">
								<span className="mt-0.5 text-error" aria-hidden>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</span>
								<span>{c}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}

function ExampleRow({
	title,
	body,
	mediaLabel,
	mediaSrc,
	mediaAlt,
	mediaFit,
	reverse = false,
	mediaComment
}: {
	title: string
	body: ReactNode
	mediaLabel: string
	mediaSrc: string
	mediaAlt: string
	mediaFit?: "cover" | "contain"
	reverse?: boolean
	mediaComment?: string
}) {
	return (
		<div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
			<div className={`${reverse ? "lg:order-2" : ""} space-y-4`}>
				<h3 className="text-2xl font-semibold text-base-content">{title}</h3>
				<div className="text-base text-base-content/80 leading-relaxed space-y-4">{body}</div>
			</div>

			<div className={`${reverse ? "lg:order-1" : ""}`}>
				<div className={`max-w-[640px] ${reverse ? "lg:mr-auto" : "lg:ml-auto"} mx-auto`}>
					<MediaFrame label={mediaLabel} src={mediaSrc} alt={mediaAlt} fit={mediaFit} />
				</div>
			</div>
		</div>
	)
}

function SplitMediaCard({
	title,
	body,
	imageSrc,
	imageAlt,
	secondaryImageSrc,
	secondaryImageAlt,
	secondaryAspect = "square",
	primaryMaxWidthClass = "",
	secondaryMaxWidthClass = "",
	reverse = false,
	imageFit = "cover"
}: {
	title: string
	body: ReactNode
	imageSrc: string
	imageAlt: string
	secondaryImageSrc?: string
	secondaryImageAlt?: string
	secondaryAspect?: "square" | "16/10" | "video"
	primaryMaxWidthClass?: string
	secondaryMaxWidthClass?: string
	reverse?: boolean
	imageFit?: "cover" | "contain"
}) {
	const alignPrimary = reverse ? "lg:mr-auto" : "lg:ml-auto"
	return (
		<div className="rounded-3xl p-0 grid lg:grid-cols-12 gap-8 items-center">
			<div className={`lg:col-span-7 space-y-4 ${reverse ? "lg:order-2" : ""}`}>
				<h3 className="text-2xl font-semibold text-base-content">{title}</h3>
				<div className="text-base text-base-content/80 leading-relaxed space-y-4">{body}</div>
			</div>
			<div className={`lg:col-span-5 ${reverse ? "lg:order-1" : ""}`}>
				<div className="space-y-4">
					<div className={`${alignPrimary} ${primaryMaxWidthClass} mx-auto lg:mx-0`}>
						<MediaFrame label={title} src={imageSrc} alt={imageAlt} fit={imageFit} />
					</div>
					{secondaryImageSrc ? (
						<div className={`${alignPrimary} ${secondaryMaxWidthClass} mx-auto lg:mx-0`}>
							<MediaFrame
								label={`${title} (secondary)`}
								src={secondaryImageSrc}
								alt={secondaryImageAlt ?? `${title} secondary image`}
								aspect={secondaryAspect}
								sizes="(max-width: 1024px) 100vw, 360px"
							/>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

function DifferenceCard({
	title,
	body,
	imageSrc,
	imageAlt,
	imageMaxWidthClass = "max-w-[420px]",
	imageAspect = "video"
}: {
	title: string
	body: ReactNode
	imageSrc: string
	imageAlt: string
	imageMaxWidthClass?: string
	imageAspect?: "video" | "16/10" | "square"
}) {
	return (
		<div className="rounded-3xl p-0">
			<div className="grid sm:grid-cols-[1fr_auto] gap-5 items-start">
				<div className="space-y-3">
					<h3 className="text-xl sm:text-2xl font-semibold text-base-content">{title}</h3>
					<div className="text-base text-base-content/80 leading-relaxed">{body}</div>
				</div>
				<div className={`w-full sm:w-auto ${imageMaxWidthClass} mx-auto sm:mx-0`}>
					<MediaFrame
						label={title}
						src={imageSrc}
						alt={imageAlt}
						aspect={imageAspect}
						sizes="(max-width: 1024px) 100vw, 420px"
					/>
				</div>
			</div>
		</div>
	)
}

export default function ImpactLearnPage() {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 space-y-28">
			<section className="max-w-6xl mx-auto py-6 sm:py-10">
				<div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-14 items-center">
					<div className="text-center lg:text-left">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary">Why do we study eDNA?</h1>
						<p className="mt-5 text-base sm:text-lg text-base-content/80 leading-relaxed">
							eDNA is a flexible,low impact method to measure life in the ocean. It works best alongside other methods, helping scientists decide
							where to look, what to monitor, and how ecosystems change over time.
						</p>
						<p className="mt-4 text-base sm:text-lg text-base-content/80 leading-relaxed">
							Learn more below about why eDNA is changing how we study the sea.
						</p>
					</div>

					<div className="space-y-4">
						<MediaFrame
							label="Hero image (why eDNA matters)"
							src="/images/learn_page/biodiversity.jpeg"
							alt="A diver or researcher collecting environmental DNA samples in the ocean"
							priority
						/>
					</div>
				</div>
			</section>

			<WaveSection tinted size="lg">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">
					<SectionTitle
						title="eDNA and other survey methods"
						subtitle="eDNA is most useful when it is paired with other tools. A simple way to think about it is disturbance, coverage, and repeatability."
					/>

					<div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
						<CompareCard
							title="Traditional surveys"
							mediaLabel="Photo placeholder (fish trawl, net tow, or ROV observation)"
							mediaSrc="/images/learn_page/other_sampling_method_compare.jpeg"
							mediaAlt="Traditional sampling methods on a vessel deck"
							pros={[
								"Direct observations and physical samples",
								"Good for behavior, habitat, and size context",
								"Can estimate abundance in the right design"
							]}
							cons={[
								"Disturbs ecosystems and can change animal behavior",
								"Avoidance can bias what you see or catch",
								"Nets can injure or kill organisms",
								"Fixed cameras only see a small area at a time"
							]}
						/>

						<CompareCard
							title="eDNA"
							mediaLabel="Photo placeholder (water sampling bottle, filtration, or lab bench)"
							mediaSrc="/images/learn_page/eDNA_sampling_method_compare.jpeg"
							mediaAlt="Collecting water samples for environmental DNA analysis"
							pros={[
								"Low impact sampling",
								"Scales across many sites and repeated time points",
								"Can detect 'avoidant' species that avoid gear or stay hidden"
							]}
							cons={[
								"Only lasts a limited time in the water",
								"Not a direct headcount or biomass measure",
								"Names depend on reference databases",
								"Protocol and controls matter a lot"
							]}
						/>
					</div>
				</div>
			</WaveSection>

			<section className="space-y-16 py-8 sm:py-12">
				<SectionTitle
					title="How eDNA is used"
					subtitle="In practice, eDNA is most valuable when it makes monitoring easier to repeat and easier to scale."
				/>

				<div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
					<div className="rounded-3xl p-0 space-y-4">
						<MediaFrame
							label="Biodiversity monitoring"
							src="/images/learn_page/why_we_care.jpeg"
							alt="Underwater ecosystem biodiversity"
						/>
						<h3 className="text-xl font-semibold text-base-content">Biodiversity</h3>
						<p className="text-base text-base-content/80 leading-relaxed">
							With consistent sampling, eDNA can show how communities change across sites, depths, and seasons.
						</p>
					</div>

					<div className="rounded-3xl p-0 space-y-4">
						<MediaFrame
							label="Invasive species detection"
							src="/images/learn_page/invasive_species.jpeg"
							alt="Lionfish, an example of an invasive species in some regions"
						/>
						<h3 className="text-xl font-semibold text-base-content">Invasive species</h3>
						<p className="text-base text-base-content/80 leading-relaxed">
							eDNA can detect invasive species early, including life stages that are hard to identify visually.
						</p>
					</div>

					<div className="rounded-3xl p-0 space-y-4">
						<MediaFrame
							label="Species mapping"
							src="/images/learn_page/map_learn_page.png"
							alt="Map showing sampling locations"
							fit="contain"
						/>
						<h3 className="text-xl font-semibold text-base-content">Mapping</h3>
						<p className="text-base text-base-content/80 leading-relaxed">
							Mapping detections across geography can help prioritize follow up surveys, especially for rare and cryptic species.
						</p>
					</div>
				</div>

				<div className="max-w-6xl mx-auto">
					<div className="rounded-3xl p-0 grid lg:grid-cols-12 gap-8 items-center">
						<div className="lg:col-span-7 space-y-4">
							<h3 className="text-2xl font-semibold text-base-content">Evidence for better decisions</h3>
							<p className="text-base text-base-content/80 leading-relaxed">
								eDNA can add biodiversity evidence to planning and monitoring in places where direct observation is difficult and expensive.
							</p>
							<p className="text-base text-base-content/80 leading-relaxed">
								In deep sea exploration and mineral mining, repeated sampling can help track change over time when combined with other measurements.
							</p>
						</div>
						<div className="lg:col-span-5">
							<MediaFrame
								label="Evidence for better decisions"
								src="/images/learn_page/better_decisions.jpeg"
								alt="Environmental monitoring in an industrial or coastal setting"
							/>
						</div>
					</div>
				</div>
			</section>

			<WaveSection tinted size="lg">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
					<SectionTitle
						title="Where it makes a difference"
						subtitle="These are situations where eDNA is especially useful because life is hard to observe directly or monitoring needs to be low impact."
					/>

					<div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
						<div className="lg:col-span-5 space-y-10 text-left">
							<div className="space-y-4">
								<MediaFrame
									label="Dark taxa"
									src="/images/learn_page/dark_taxa.jpeg"
									alt="A school of fish in open water"
									aspect="video"
									sizes="(max-width: 1024px) 100vw, 360px"
								/>
								<h3 className="text-xl sm:text-2xl font-semibold text-base-content">Dark taxa</h3>
								<p className="text-base text-base-content/80 leading-relaxed">
									Some sequences do not match a named species in reference databases. Those detections can still be useful because they show patterns across
									sites and highlight where reference libraries are missing coverage.
								</p>
							</div>

							<div className="space-y-4">
								<MediaFrame
									label="Deep sea signals"
									src="/images/learn_page/rov_deep_learn_page_dark.jpg"
									alt="ROV exploring the deep sea"
									aspect="video"
									sizes="(max-width: 1024px) 100vw, 420px"
								/>
								<h3 className="text-xl sm:text-2xl font-semibold text-base-content">Deep sea signals</h3>
								<p className="text-base text-base-content/80 leading-relaxed">
									If you can collect water at depth, eDNA can reveal patterns without needing to visually spot every organism, especially when paired with
									careful controls and follow up tools for confirmation.
								</p>
							</div>
						</div>

						<div className="lg:col-span-7 space-y-4">
							<div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
								<div className="w-full">
									<MediaFrame
										label="More frequent monitoring"
										src="/images/learn_page/more_eDNA_sampling.jpg"
										alt="Collecting water samples from a boat for environmental DNA monitoring"
										aspect="16/10"
										sizes="(max-width: 1024px) 100vw, 520px"
									/>
								</div>
								<div className="w-full sm:w-[240px]">
									<MediaFrame
										label="More frequent monitoring (secondary)"
										src="/images/learn_page/why_eDNA_matters.jpg"
										alt="Environmental DNA sampling"
										aspect="square"
										sizes="(max-width: 1024px) 60vw, 240px"
									/>
								</div>
							</div>
							<h3 className="text-2xl font-semibold text-base-content">More frequent monitoring</h3>
							<p className="text-base text-base-content/80 leading-relaxed">
								Because sampling is relatively simple, eDNA can be repeated more often, providing earlier signals of ecosystem change and helping separate
								real shifts from one off noise when paired with ocean conditions.
							</p>
						</div>
					</div>
				</div>
			</WaveSection>

			<section className="space-y-12">
				<div className="max-w-7xl mx-auto px-0 sm:px-0 space-y-12">
					<SectionTitle
						title="eDNA FAQs"
						subtitle="Short answers to common questions. Context matters, especially sampling depth, timing, and lab methods."
					/>

					<div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 sm:gap-5 items-start">
						<FaqItem q="How useful is eDNA at finding deep sea creatures">
							It can be very useful if you can collect water at depth. The biggest constraint is access to deep samples. Mixing and transport still matter,
							so studies often use multiple depths and repeated sampling to improve confidence.
						</FaqItem>

						<FaqItem q="Does eDNA help us know where to look for something new">
							eDNA can show signals that do not match reference databases. That does not automatically mean a new species, but it can reveal reference gaps
							or unexpected distributions. Those signals are useful for prioritizing follow up work with cameras, nets, or targeted sampling.
						</FaqItem>

						<FaqItem q="What are scientists actually using eDNA for">
							The most common uses are biodiversity monitoring, invasive species surveillance, mapping detections across space and time, and tracking change
							before and after events. In many projects, eDNA complements surveys rather than replacing them.
						</FaqItem>

						<FaqItem q="If currents move DNA, how can we pin down location">
							You usually cannot pinpoint a single animal. A detection is best interpreted as presence within a local area and recent time window. Researchers
							improve location confidence by sampling many sites and depths and combining results with oceanography such as currents and stratification.
						</FaqItem>

						<FaqItem q="What is dark taxa">
							Dark taxa is a common label for sequences that are real and repeatable but cannot be confidently assigned to a named species using current
							reference databases. They can still be useful for tracking patterns and for highlighting where reference libraries need improvement.
						</FaqItem>

						<FaqItem q="Is it true that most sea life is yet to be described">
							It depends on the group. For microbes and many small invertebrates, a large fraction of diversity is not formally described, especially in the
							deep sea. Big percentages vary widely by region and organism, so treat them as a sign of uncertainty rather than a precise number.
						</FaqItem>

						<FaqItem q="Can eDNA help fill those gaps">
							It can help by showing where unknown lineages are common and by expanding reference databases when sequences are linked to confirmed specimens.
							eDNA works best as part of a loop that includes sampling, sequencing, building references, and returning with better tools.
						</FaqItem>

						<FaqItem q="How does barcoding work">
							Barcoding targets a short genetic marker that tends to differ between species. In eDNA metabarcoding, you amplify one or more markers from a mixed
							sample, sequence them, and match sequences to a reference database. Marker choice affects which groups are detected and how specific IDs can be.
						</FaqItem>

						<FaqItem q="How is eDNA improving our understanding of ocean ecosystems">
							It increases how often and how broadly communities can be measured. That makes it easier to connect biodiversity patterns to temperature, depth,
							and seasonality, and to detect change early enough that management can respond.
						</FaqItem>

						<FaqItem q="Is eDNA better than other methods">
							It is different. Traditional surveys provide direct observations, behavior, and specimens. eDNA is efficient for broad screening and for detecting
							hard to observe species. The strongest work often combines both.
						</FaqItem>
					</div>
				</div>
			</section>
		</div>
	)
}
