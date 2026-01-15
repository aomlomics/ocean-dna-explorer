import AnalysisSubmit from "@/app/components/submit/AnalysisSubmit";
import SubmitMobileGate from "@/app/components/submit/SubmitMobileGate";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

export default async function Analysis() {
	const tags = await prisma.tag.findMany();

	return (
		<>
			<SubmitMobileGate />
			<main className="hidden lg:block container mx-auto px-4 py-4 space-y-6">
				{/* Breadcrumbs */}
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
						<li>Analysis</li>
					</ul>
				</div>

				{/* Header & Intro */}
				<header className="my-8 space-y-3">
					<h1 className="text-4xl font-normal text-primary">Submit a New Analysis</h1>
					<p className="text-base text-base-content/80">
						Want to contribute new analyses? You can upload analysis files to any existing Ocean DNA Explorer project
						where you're an authorized user. If you need access to a project, contact the project owner using the
						project's project_contact and institution information.
					</p>
					<p className="text-base text-base-content/80">
						Need help? Check out the{" "}
						<Link
							href="https://noaa-omics-dmg.readthedocs.io/en/latest/"
							className="text-primary hover:text-primary-focus"
						>
							NOAA 'Omics Data Management Guide
						</Link>
						. All files must be in TSV format and follow the template structure exactly.
					</p>
					<p className="text-base text-base-content/80">
						For help formatting your data, see the{" "}
						<Link href="/help#submit" className="text-primary hover:text-primary-focus">
							Submit section of the Ocean DNA Explorer Help page
						</Link>
						.
					</p>
				</header>

				{/* Form (handles left: project selection, right: files/progress) */}
				<AnalysisSubmit tags={tags} />
			</main>
		</>
	);
}
