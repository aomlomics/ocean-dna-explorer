import { getNextDocsSection } from "@/types/docsSections";
import Link from "next/link";
import HelpQuickNav from "../components/docs/HelpQuickNav";

//TODO: add content
export default function DocsPage() {
	const start = getNextDocsSection()!;

	return (
		<div>
			<header className="mb-8">
				<h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-normal leading-[0.95] text-primary">Docs</h1>
			</header>

			<HelpQuickNav />

			<Link className="btn btn-success" href={`/docs/${start.page}/${start.section}`}>
				Get Started
			</Link>
		</div>
	);
}
