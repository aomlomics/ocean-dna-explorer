import Link from "next/link";
import HelpQuickNav from "../components/docs/HelpQuickNav";
import DocsSections, { DocsPage as DocsPageType } from "@/types/docsSections";

//TODO: add content
export default function DocsPage() {
	const firstPage = Object.keys(DocsSections)[0] as DocsPageType;

	return (
		<div>
			<header className="mb-8">
				<h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-normal leading-[0.95] text-primary">
					Ocean DNA Explorer Documentation
				</h1>
			</header>

			<HelpQuickNav />

			<Link className="btn btn-success" href={`/docs/${firstPage}/${Object.keys(DocsSections[firstPage])[0]}`}>
				Get Started
			</Link>
		</div>
	);
}
