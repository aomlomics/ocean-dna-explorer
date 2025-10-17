import Link from "next/link";

export default function SubmitMobileGate() {
	return (
		<div className="flex flex-col items-center justify-center py-6 text-center px-6 lg:hidden">
			<div className="max-w-lg w-full">
				{/* Desktop Icon SVG */}
				<svg
					className="mx-auto h-24 w-24 text-primary mb-6"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth="1.5"
					stroke="currentColor"
				>
					<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
					<line x1="8" y1="21" x2="16" y2="21"></line>
					<line x1="12" y1="17" x2="12" y2="21"></line>
				</svg>

				<h1 className="text-3xl font-normal text-base-content mb-4">Please make data submissions on a computer</h1>
				<p className="text-base-content/80 mb-8 max-w-md mx-auto">
					This ensures your large data files are handled correctly. Sign up is required.
				</p>

				<div className="space-y-6 text-left p-6 bg-base-200 rounded-lg border border-base-300">
					<h2 className="text-xl font-normal text-base-content mb-4 text-center">How to Submit?</h2>
					<div className="flex items-start gap-4">
						<span className="text-primary font-bold text-2xl mt-1">1</span>
						<div>
							<h3 className="font-normal text-base-content">Become a Contributor</h3>
							<p className="text-sm text-base-content/70 mt-1">
								You must first apply to be a contributor. This helps us maintain data quality and security.
							</p>
							<Link href="/contribute" className="btn btn-md btn-primary mt-3">
								Apply Now
							</Link>
						</div>
					</div>
					<div className="flex items-start gap-4">
						<span className="text-primary font-bold text-2xl mt-1">2</span>
						<div>
							<h3 className="font-normal text-base-content">Review the Documentation</h3>
							<p className="text-sm text-base-content/70 mt-1">
								Our documentation explains the required data formats and the submission process in detail.
							</p>
							<Link href="/help" className="btn btn-md btn-primary mt-3">
								Read the Docs
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 