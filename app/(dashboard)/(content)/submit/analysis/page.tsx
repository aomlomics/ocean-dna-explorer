import AnalysisSubmit from "@/app/components/submit/AnalysisSubmit";
import Link from "next/link";

export default function Analysis() {
	return (
		<main className="flex flex-col grow p-8 max-w-7xl mx-auto space-y-8">
			{/* Upload Intro Section */}
			<section className="text-center space-y-6">
				<h1 className="text-5xl font-semibold text-primary">Submit Analysis</h1>
				<div className="max-w-3xl mx-auto space-y-4 text-lg text-base-content">
					<p>
						Ready to contribute new insights? Upload your analysis files here. They must be for an existing NODE
						project. Need help? Check out the{" "}
						<Link href="https://noaa-omics-dmg.readthedocs.io/en/latest/" className="text-primary hover:underline">
							NOAA 'Omics Data Management Guide.
						</Link>
					</p>

					{/* Requirements Section */}
					<div className="flex items-center justify-center gap-2 text-base-content text-lg">
						<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>All files must be in TSV format and follow the template structure exactly</span>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<AnalysisSubmit />
		</main>
	);
}
