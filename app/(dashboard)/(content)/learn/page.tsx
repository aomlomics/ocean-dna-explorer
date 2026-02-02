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
			<section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-10 sm:mb-12 bg-base-100">
				<div className="relative h-[400px]">
					<Image
						src="/images/rov_boat_learn_page_light.jpg"
						alt="ROV on research vessel deck"
						fill
						sizes="100vw"
						className="object-cover opacity-10 [html[data-theme='dark']_&]:hidden"
						priority
					/>
					<Image
						src="/images/rov_deep_learn_page_dark.jpg"
						alt="ROV exploring deep ocean"
						fill
						sizes="100vw"
						className="object-cover opacity-50 hidden [html[data-theme='dark']_&]:block"
						priority
					/>
					<div className="relative z-10 h-full flex pt-28">
						<div className="w-full max-w-5xl mx-auto px-6 text-center">
							<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-primary [html[data-theme='dark']_&]:text-white">Learn</h1>
							<p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-base-content [html[data-theme='dark']_&]:text-base-content/90">
								Discover how environmental DNA data flows from ocean sampling to taxonomic discovery.
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
