import Link from "next/link";
import HelpQuickNav from "../components/docs/HelpQuickNav";
import DocsSections, { type DocsPage } from "@/types/docsSections";

//TODO: add content
export default function DocsPage() {
	const firstPage = Object.keys(DocsSections)[0] as DocsPage;

	return (
		<div>
			<header className="mb-8">
				<h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-normal leading-[0.95] text-primary">
					ODE Documentation
				</h1>
			</header>

			<HelpQuickNav />

			<p className="mb-6 max-w-2xl text-base leading-relaxed">
				The docs are split into two sections: Help is about the website itself, and API is strictly for API reference.
				Click Get Started, or use the table of contents to open a specific section.
			</p>

			<Link className="btn btn-primary" href={`/docs/${firstPage}/${Object.keys(DocsSections[firstPage])[0]}`}>
				Get Started
			</Link>
		</div>
	);
}
