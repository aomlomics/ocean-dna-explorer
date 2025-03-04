import Link from "next/link";
import Image from "next/image";

export default function Submit() {
	return (
		<main className="max-w-7xl mx-auto p-6">
			{/* Hero Section with Quick Links */}
			<section className="py-8">
				<div className="max-w-[1400px] mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 lg:gap-12">
						<div className="w-full md:max-w-xl lg:max-w-2xl">
							<h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-primary mb-4 md:mb-6">
								Submit to NODE
							</h1>
							<p className="text-base md:text-lg text-base-content/80 leading-relaxed mb-4">
								Transform your eDNA data with NODE. Join our growing scientific community while making your research
								FAIR-compliant with powerful storage, sharing, and visualization tools.
							</p>
							<Link href="/help" className="text-base md:text-lg text-primary hover:underline">
								Need help? Visit our documentation →
							</Link>
						</div>

						{/* Quick Links Section - Improved Mobile First Design */}
						<div className="bg-base-100 rounded-lg p-3 md:p-4 w-full md:w-[400px] lg:w-[600px]">
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
								<Link
									href="/help"
									className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-base-200 transition-colors text-center group"
								>
									<svg
										className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary group-hover:scale-110 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									<span className="text-xs sm:text-sm lg:text-base text-base-content/80 leading-tight">
										Download Templates
									</span>
								</Link>
								<Link
									href="/help"
									className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-base-200 transition-colors text-center group"
								>
									<svg
										className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary group-hover:scale-110 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<span className="text-xs sm:text-sm lg:text-base text-base-content/80 leading-tight">
										Submission Guide
									</span>
								</Link>
								<Link
									href="/help"
									className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-base-200 transition-colors text-center group"
								>
									<svg
										className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary group-hover:scale-110 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
									<span className="text-xs sm:text-sm lg:text-base text-base-content/80 leading-tight">Tutorials</span>
								</Link>
								<Link
									href="/help"
									className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-base-200 transition-colors text-center group"
								>
									<svg
										className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary group-hover:scale-110 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span className="text-xs sm:text-sm lg:text-base text-base-content/80 leading-tight">FAQ</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Upload Options */}
			<section className="max-w-[1400px] mx-auto mt-6 md:mt-8 mb-12 md:mb-16">
				<div className="grid md:grid-cols-2 gap-6 md:gap-8">
					{/* Project Card */}
					<div className="card bg-base-200 shadow-xl min-h-[220px] sm:min-h-[260px] relative overflow-hidden hover:shadow-2xl transition-shadow">
						<div className="card-body">
							<div className="w-full h-full flex flex-col">
								<div>
									<h2 className="text-2xl text-primary mb-4">Project Submission</h2>
									<p className="text-base text-base-content/80 mb-6">
										Submit a complete eDNA dataset including sample metadata, environmental measurements, and sequencing
										data.
									</p>
								</div>
								<div className="mt-auto">
									<Link href="/submit/project" className="btn btn-primary">
										Start New Project
									</Link>
								</div>
							</div>
							<div className="absolute bottom-5 right-0 w-3/4 h-60 translate-x-1/3 translate-y-1/3">
								<Image
									src="/images/Catcher_Vessel4.svg"
									alt="Project Upload Illustration"
									fill
									className="object-contain"
								/>
							</div>
						</div>
					</div>

					{/* Analysis Card */}
					<div className="card bg-base-200 shadow-xl min-h-[220px] sm:min-h-[260px] relative overflow-hidden hover:shadow-2xl transition-shadow">
						<div className="card-body">
							<div className="w-full h-full flex flex-col">
								<div>
									<h2 className="text-2xl text-primary mb-4">Analysis Submission</h2>
									<p className="text-base text-base-content/80 mb-6">
										Share your analysis of existing NODE data, including methods, parameters, and interpretations.
									</p>
								</div>
								<div className="mt-auto">
									<Link href="/submit/analysis" className="btn btn-primary">
										Start New Analysis
									</Link>
								</div>
							</div>
							<div className="absolute bottom-6 right-6 w-1/2 h-48 translate-x-1/4 translate-y-1/4">
								<Image
									src="/images/analysis_outline_image.svg"
									alt="Analysis Upload Illustration"
									fill
									className="object-contain"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
