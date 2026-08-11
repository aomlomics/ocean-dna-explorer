export default function Loading() {
	return (
		<div className="min-h-screen bg-base-100 text-base-content -mt-4">
			<section className="relative w-screen left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] mb-6 sm:mb-8 bg-base-100">
				<div className="relative min-h-0">
					<div className="absolute inset-0 skeleton opacity-40 rounded-none" aria-hidden />
					<div className="relative z-10 w-full max-w-6xl mx-auto px-5 py-14 sm:py-20 text-center space-y-6">
						<div className="skeleton h-14 sm:h-16 md:h-20 max-w-xs mx-auto rounded-lg" />
						<div className="skeleton h-5 max-w-2xl mx-auto" />
						<div className="skeleton h-5 max-w-xl mx-auto" />
						<div className="flex flex-wrap justify-center gap-2 sm:gap-3">
							<div className="skeleton h-10 w-28 rounded-full" />
							<div className="skeleton h-10 w-28 rounded-full" />
							<div className="skeleton h-10 w-36 rounded-full" />
						</div>
					</div>
					<svg
						className="absolute -bottom-px left-0 w-full h-14 sm:h-20 text-base-100"
						viewBox="0 0 1440 160"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<path fill="currentColor" d="M0,80 C240,160 480,160 720,104 C960,48 1200,48 1440,104 L1440,160 L0,160 Z" />
					</svg>
				</div>
			</section>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-8">
				<div className="skeleton min-h-100 w-full rounded-xl" />
				<div className="skeleton h-48 w-full rounded-xl" />
			</div>

			<div className="flex justify-center pb-8 sm:pt-5 sm:pb-10">
				<div className="flex flex-wrap justify-center gap-2 sm:gap-3">
					<div className="skeleton h-10 w-28 rounded-full" />
					<div className="skeleton h-10 w-28 rounded-full" />
					<div className="skeleton h-10 w-36 rounded-full" />
				</div>
			</div>
		</div>
	);
}
