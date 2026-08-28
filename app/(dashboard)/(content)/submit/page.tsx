import { AnalysisIcon, ProjectIcon } from "@/app/components/icons";
import { OBON_HREF, WORKSHOP_PLAYLIST_HREF } from "@/app/components/WorkshopVideoCallout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Submit",
	description:
		"Submit projects and analyses to the Ocean DNA Explorer. Contribute FAIR eDNA data, metadata, sequencing results, and analyses."
};

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

			<header className="my-8 space-y-3 text-base text-base-content/80">
				<h1 className="text-4xl font-normal text-primary">Submit to the Ocean DNA Explorer</h1>
				<p>Choose a submission type below to contribute your data.</p>
				<SubmitDescription />
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="card bg-base-200 shadow-sm min-h-65 relative overflow-hidden">
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
				<div className="card bg-base-200 shadow-sm min-h-65 relative overflow-hidden">
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

export function SubmitDescription() {
	return (
		<p>
			Build your FAIR eDNA metadata templates with{" "}
			<a
				href="https://github.com/aomlomics/FAIReSheets"
				className="text-primary hover:text-primary-focus"
				target="_blank"
				rel="noopener noreferrer"
			>
				FAIReSheets
			</a>{" "}
			and compare against the{" "}
			<a
				href="https://github.com/aomlomics/ODE_testdata"
				className="text-primary hover:text-primary-focus"
				target="_blank"
				rel="noopener noreferrer"
			>
				example datasets
			</a>{" "}
			there. The{" "}
			<Link href="/docs/help#submit" className="text-primary hover:text-primary-focus">
				help page
			</Link>{" "}
			and the{" "}
			<a
				href={WORKSHOP_PLAYLIST_HREF}
				className="text-primary hover:text-primary-focus"
				target="_blank"
				rel="noopener noreferrer"
			>
				FAIR eDNA Workshop
			</a>{" "}
			video series from{" "}
			<a href={OBON_HREF} className="text-primary hover:text-primary-focus" target="_blank" rel="noopener noreferrer">
				OBON
			</a>{" "}
			cover the standard and filling in these templates.
		</p>
	);
}
