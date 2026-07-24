import { getApiSections } from "@/app/components/help/ApiSections";
import { docContentProseClassName } from "@/app/components/help/docContentProse";
import { ActiveSectionTracker } from "@/app/components/help/ActiveSectionTracker";
import MobileTOC from "@/app/components/help/MobileTOC";

export default async function API() {
	const apiSections = await getApiSections();

	return (
		<div className="flex min-h-screen items-start">
			{/* Invisible component that handles scroll tracking */}
			<ActiveSectionTracker />

			{/* Sidebar navigation - Hidden on mobile */}
			<aside className="hidden lg:block w-64 min-w-[16rem] border-r border-base-300 pt-9 p-6 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
				<nav>
					<h2 className="text-xl mb-6 px-2">Contents</h2>
					<ul className="space-y-5">
						{apiSections.map((section, index) => {
							const hasSubs = Boolean(section.subsections?.length);
							return (
								<li key={section.id}>
									<div className={`flex flex-col ${hasSubs ? "gap-2.5" : "gap-0"}`}>
										<a
											href={`#${section.id}`}
											className="block px-2 py-1 hover:text-primary transition-colors main-section-link"
											data-section-index={index}
										>
											{section.title}
										</a>
										{hasSubs && section.subsections && (
											<ul className="ml-2 space-y-1 border-l border-base-300 pl-2">
												{section.subsections.map((subsection) => (
													<li key={subsection.id}>
														<a
															href={`#${subsection.id}`}
															data-toc-target={subsection.id}
															className="block py-1 px-2 text-sm hover:text-primary transition-colors"
														>
															{subsection.title}
														</a>
													</li>
												))}
											</ul>
										)}
									</div>
								</li>
							);
						})}
					</ul>
				</nav>
			</aside>

			{/* Main content area - Full width on mobile */}
			<main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
				<header className="mb-8">
					<h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-normal leading-[0.95] text-primary">API Docs</h1>
				</header>

				{/* Mobile Table of Contents */}
				<MobileTOC sections={apiSections} />

				{/* Map through sections to generate content */}
				{apiSections.map((section, index) => (
					<section
						key={section.id}
						id={section.id}
						data-section-index={index}
						className="doc-toc-anchor mb-48 scroll-mt-24"
					>
						<h2 className="text-4xl font-semibold tracking-tight text-primary mb-3">{section.title}</h2>
						<div className={docContentProseClassName}>{section.content}</div>

						{/* Render subsections if they exist */}
						{section.subsections && section.subsections.length > 0 && (
							<div className="mt-12 space-y-24">
								{section.subsections.map((subsection) => (
									<div key={subsection.id} id={subsection.id} className="doc-toc-anchor scroll-mt-24">
										<h3 className="text-3xl font-semibold tracking-tight text-base-content mb-2">{subsection.title}</h3>
										<div className={docContentProseClassName}>{subsection.content}</div>
									</div>
								))}
							</div>
						)}
					</section>
				))}
			</main>
		</div>
	);
}
