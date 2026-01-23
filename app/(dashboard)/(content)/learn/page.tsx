"use client";

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
		<main className="min-h-screen bg-base-100 text-base-content">
			{/* Page Banner */}
			<section className="relative w-full mb-6 sm:mb-8">
				<div className="px-4 pt-8 sm:pt-10 md:pt-12 pb-4 text-center">
					<h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-primary">
						Learn
					</h1>
					<p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-base-content/90">
						Discover how environmental DNA data flows from ocean sampling to taxonomic discovery.
					</p>
				</div>
				{/* Decorative ocean wave illustration */}
				<div className="relative w-full mt-2 sm:mt-3 h-20 sm:h-24 md:h-28 lg:h-32">
					<Image
						src="/images/ocean_surface_abstract.svg"
						alt="Abstract ocean surface line illustration"
						fill
						sizes="100vw"
						className="object-cover"
						priority
					/>
				</div>
			</section>

			{/* Data Journey Content */}
			<DataJourney />
		</main>
	);
}
