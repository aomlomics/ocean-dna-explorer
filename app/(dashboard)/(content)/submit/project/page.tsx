import ProjectSubmit from "@/app/components/submit/ProjectSubmit";
import SubmitMobileGate from "@/app/components/submit/SubmitMobileGate";
import Link from "next/link";

export default function Project() {
	return (
		<>
			<SubmitMobileGate />
			<main className="hidden lg:block container mx-auto px-4 py-8 space-y-6">
				{/* Breadcrumbs */}
				<div className="text-sm breadcrumbs">
					<ul>
						<li>
							<Link href="/submit" className="text-primary hover:text-primary-focus">
								Submit
							</Link>
						</li>
						<li>Project</li>
					</ul>
				</div>

				{/* Header & Intro */}
				<header className="space-y-3 mb-8">
					<h1 className="text-4xl font-normal text-primary">Submit a New Project</h1>
					<p className="text-base text-base-content/80">
						A project is the baseline record in the Ocean DNA Explorer (ODE). All other data types are linked to a project.
					</p>
					<p className="text-base text-base-content/80">
						If you want to contribute to an existing project, you can submit an
							{" "}
						<Link href="/submit/analysis" className="text-primary hover:text-primary-focus">
							analysis
						</Link>
						{" "}
						for it, provided you have been added to that project by its owner.
					</p>
					<p className="text-base text-base-content/80">
						For help formatting your data, see the
							{" "}
						<Link href="/help#submit" className="text-primary hover:text-primary-focus">
							Submit section of the ODE Help page
						</Link>
						. Submissions should follow the FAIR eDNA metadata format. You can review a filled example
						{" "}
						<a
							href="https://docs.google.com/spreadsheets/d/1mkjfUQW3gTn3ezhMQmFDQn4EBoQ2Xv4SZeSd9sqagoU/edit?gid=0#gid=0"
							className="text-primary hover:text-primary-focus"
							target="_blank"
							rel="noopener noreferrer"
						>
							FAIRe sheet
						</a>
						{" "}
						to see how to generate FAIRe metadata files (the files uploaded on this page). We provide a Python repository called
						{" "}
						<a
							href="https://github.com/aomlomics/FAIRe2ODE"
							className="text-primary hover:text-primary-focus"
							target="_blank"
							rel="noopener noreferrer"
						>
							FAIRe2ODE
						</a>
						{" "}
						to help generate those files on Google Sheets.
					</p>
				</header>

				{/* Form (handles left: people/privacy, right: files/progress) */}
				<ProjectSubmit />
			</main>
		</>
	);
}
