import HelpQuickNav from "../components/docs/HelpQuickNav";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	description:
		"Ocean DNA Explorer documentation. Help covers using the site. The API section covers the API and how the data is structured."
};

const sectionHeading = "mb-2 text-3xl font-semibold tracking-tight text-base-content";
const body = "space-y-4 text-base leading-relaxed";

export default function DocsPage() {
	return (
		<div>
			<h1 className="mb-6 text-4xl font-semibold tracking-tight text-primary">Documentation</h1>

			<HelpQuickNav />

			<section className="mt-12">
				<h2 className={sectionHeading}>What is Ocean DNA Explorer</h2>
				<div className={body}>
					<p>
						Ocean DNA Explorer is a data portal, search engine, and visualization tool for ocean environmental DNA
						(eDNA) data. Datasets on the site follow standardized protocols, so studies can be compared and searched
						together. The records come from NOAA Omics, NOAA Ocean Exploration, and partner organizations.
					</p>
					<p>
						The{" "}
						<Link href="/about" className="link link-primary">
							About
						</Link>{" "}
						page is where the project itself is described: what it is for, who builds it, and who supports it.
					</p>
				</div>
			</section>

			<section className="mt-12">
				<h2 className={sectionHeading}>Help Docs</h2>
				<div className={body}>
					<p>
						Help is for using the website. It covers browsing, how the main pages fit together, and how to submit a
						dataset.
					</p>
					<p>
						Read it when you are in the site and trying to get something done: finding a project, running a search, or
						preparing data to upload. It is not a reference for writing API requests.{" "}
						<Link href="/docs/help" className="link link-primary">
							Open Help
						</Link>
						.
					</p>
					<p>
						Browsing and querying do not require a role. Submitting a dataset does. You need the Contributor role
						first.{" "}
						<Link href="/contribute" className="link link-primary">
							Apply to contribute
						</Link>
						. After the role is granted, Help covers how to submit the dataset.
					</p>
				</div>
				<Link className="btn btn-primary mt-6" href="/docs/help">
					Get Started
				</Link>
			</section>

			<section className="mt-12">
				<h2 className={sectionHeading}>API Docs</h2>
				<div className={body}>
					<p>
						The API section is only about the API and the way the data is structured. It covers how the records are
						organized and how a query is put together, so you can request the data yourself.
					</p>
					<p>
						Use it when a page is the wrong tool: a script, a notebook, or a URL you want to call directly. Public data
						can be read this way with no account.{" "}
						<Link href="/docs/api" className="link link-primary">
							Open the API docs
						</Link>
						.
					</p>
				</div>
				<Link className="btn btn-primary mt-6" href="/docs/api">
					Get Started
				</Link>
			</section>
		</div>
	);
}
