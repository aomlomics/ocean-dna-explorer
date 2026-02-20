import { AnalysisIcon, ProjectIcon } from "@/app/components/icons";
import Link from "next/link";

export default function Submit() {
	return (
		<div className="container mx-auto px-4 py-4">
			<div className="text-sm breadcrumbs">
				<ul>
					<li>
						<Link href="/" className="text-primary hover:text-primary-focus">
							Home
						</Link>
					</li>
					<li>Submit</li>
				</ul>
			</div>

			<header className="my-8">
				<h1 className="text-4xl font-normal text-primary">Submit to the Ocean DNA Explorer</h1>
				<p className="mt-2 text-base text-base-content/80">
					Choose a submission type below to contribute your data to the Ocean DNA Explorer database.
				</p>
				<p className="text-base text-base-content/80">
					For more information on the submission requirements and data format, please see the{" "}
					<a href="/help#submit" className="text-primary hover:text-primary-focus">
						Submit Data
					</a>{" "}
					section of our Help page, or the{" "}
					<a
						href="https://noaa-omics-dmg.readthedocs.io/en/latest/metadata-guidelines.html"
						className="text-primary hover:text-primary-focus"
					>
						NOAA Omics Data Management Guide
					</a>
					.
				</p>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="card bg-base-200 shadow-sm min-h-[260px] relative overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col" style={{ zIndex: 1 }}>
							<div>
								<h2 className="text-2xl text-primary mb-4 font-normal">Project Submission</h2>
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
						<div className="absolute -bottom-10 right-5 w-2/5 h-4/5 text-primary pointer-events-none">
							<ProjectIcon className="w-full h-full" />
						</div>
					</div>
				</div>
				<div className="card bg-base-200 shadow-sm min-h-[260px] relative overflow-hidden">
					<div className="card-body">
						<div className="w-full h-full flex flex-col" style={{ zIndex: 1 }}>
							<div>
								<h2 className="text-2xl text-primary mb-4 font-normal">Analysis Submission</h2>
								<p className="text-base text-base-content/80 mb-6">
									Share your analysis of existing Ocean DNA Explorer data, including methods, parameters, and
									interpretations.
								</p>
							</div>
							<div className="mt-auto">
								<Link href="/submit/analysis" className="btn btn-primary">
									Start New Analysis
								</Link>
							</div>
						</div>
						<div className="absolute -bottom-2 right-0 w-2/5 h-3/5 text-primary pointer-events-none">
							<AnalysisIcon className="w-full h-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
