import ProjectSubmit from "@/app/components/submit/ProjectSubmit";
import SubmitMobileGate from "@/app/components/submit/SubmitMobileGate";
import { OBON_HREF, WORKSHOP_PLAYLIST_HREF } from "@/app/components/WorkshopVideoCallout";
import { prismaImages } from "@/app/helpers/prismaImages";
import Link from "next/link";

export default async function Project() {
	const attributions = await prismaImages.attribution.findMany();

	return (
		<>
			<SubmitMobileGate />
			<main className="hidden lg:block container mx-auto px-4 py-4">
				<div className="text-sm breadcrumbs">
					<ul>
						<li>
							<Link href="/" className="text-primary hover:text-primary-focus">
								Home
							</Link>
						</li>
						<li>
							<Link href="/submit" className="text-primary hover:text-primary-focus">
								Submit
							</Link>
						</li>
						<li>Project</li>
					</ul>
				</div>

				<header className="my-8">
					<h1 className="text-4xl font-normal text-primary">Submit a New Project</h1>
					<div className="mt-4 max-w-3xl space-y-4 text-base text-base-content/80 leading-relaxed">
						<p>
							A project is the baseline record in the Ocean DNA Explorer. Samples, libraries, and analyses all link to it.
							To add work to an existing project instead, submit an{" "}
							<Link href="/submit/analysis" className="text-primary hover:text-primary-focus">
								analysis
							</Link>{" "}
							once a project member has added your account to that project.
						</p>
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
							<Link href="/help#submit" className="text-primary hover:text-primary-focus">
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
					</div>
				</header>

				{/* Form (handles left: people/privacy, right: files/progress) */}
				<ProjectSubmit attributions={attributions} />
			</main>
		</>
	);
}
