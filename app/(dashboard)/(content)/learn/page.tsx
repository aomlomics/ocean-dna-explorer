import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import for the DataJourney component to optimize loading
const DataJourney = dynamic(() => import("@/app/components/DataJourney"), {
	ssr: true,
	loading: () => (
		<div className="min-h-[400px] flex items-center justify-center">
			<div className="animate-pulse text-primary text-xl">Loading Data Journey...</div>
		</div>
	)
});

export default function LearnPage() {
	return (
		<main className="min-h-screen bg-base-100 text-base-content -mt-4">
			{/* Page Banner */}
			<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-6 sm:mb-8 bg-base-100">
				<div className="relative h-[400px]">
					<Image
						src="/images/learn_page_banner.jpg"
						alt="Learn page banner"
						fill
						sizes="100vw"
						className="object-cover opacity-20"
						priority
					/>
					<div className="relative z-10 h-full flex pt-28">
						<div className="w-full max-w-6xl mx-auto px-5 text-center">
							<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-primary">Learn</h1>
							<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
								Discover how environmental DNA is collected and analyzed, its impact on science, and how to make your own scientific discoveries on the Ocean DNA Explorer
							</p>
							<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
								Use the toggle below to switch between sections
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

			{/* Data Journey Content */}
			<DataJourney />
		</main>
	);
}
