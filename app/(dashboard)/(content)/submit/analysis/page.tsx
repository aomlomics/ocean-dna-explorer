import AnalysisSubmit from "@/app/components/submit/AnalysisSubmit";
import SubmitMobileGate from "@/app/components/submit/SubmitMobileGate";
import { OBON_HREF, WORKSHOP_PLAYLIST_HREF } from "@/app/components/WorkshopVideoCallout";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { SubmitDescription } from "../page";

export default async function Analysis() {
	const tags = await prisma.tag.findMany();

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
						<li>Analysis</li>
					</ul>
				</div>

				<header className="my-8">
					<h1 className="text-4xl font-normal text-primary">Submit a New Analysis</h1>
					<div className="mt-4 max-w-3xl space-y-4 text-base text-base-content/80 leading-relaxed">
						<p>
							Upload analysis files to projects that list your account. If you need access, ask a project member to add
							you.
						</p>
						<SubmitDescription />
					</div>
				</header>

				<AnalysisSubmit tags={tags} />
			</main>
		</>
	);
}
