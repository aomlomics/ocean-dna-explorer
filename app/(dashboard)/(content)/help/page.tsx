import { helpSections } from "@/app/components/help/HelpSections";
import { ActiveSectionTracker } from "@/app/components/help/ActiveSectionTracker";

export default function Help() {
	return (
		<div className="flex min-h-screen">
			{/* Invisible component that handles scroll tracking */}
			<ActiveSectionTracker />

			{/* Sidebar navigation */}
			<aside className="w-64 border-r border-base-300 p-6 sticky top-0 h-screen overflow-y-auto">
				<nav>
					<h2 className="text-xl font-bold mb-4 pt-3">Contents</h2>
					<ul className="space-y-4">
						{/* Map through sections to generate navigation */}
						{helpSections.map((section) => (
							<li key={section.id}>
								<a href={`#${section.id}`} className="block mb-2 hover:text-primary">
									{section.title}
								</a>
								{/* Render subsection navigation if they exist */}
								{section.subsections && (
									<ul className="border-l border-base-300 ml-2 space-y-2">
										{section.subsections.map((subsection) => (
											<li key={subsection.id} className="pl-4">
												<a href={`#${subsection.id}`} className="text-sm hover:text-primary">
													{subsection.title}
												</a>
											</li>
										))}
									</ul>
								)}
							</li>
						))}
					</ul>
				</nav>
			</aside>

			{/* Main content area */}
			<main className="flex-1 p-8 max-w-4xl">
				{/* Map through sections to generate content */}
				{helpSections.map((section) => (
					<section key={section.id} id={section.id} className="mt-12 first:mt-0">
						<h2 className="text-3xl font-bold mb-6">{section.title}</h2>
						<div>{section.content}</div>

						{/* Render subsections if they exist */}
						{section.subsections && section.subsections.length > 0 && (
							<div className="border-l-2 border-base-300 pl-6 mt-8">
								{section.subsections.map((subsection) => (
									<section key={subsection.id} id={subsection.id} className="mt-8 first:mt-0">
										<h3 className="text-2xl font-semibold mb-4">{subsection.title}</h3>
										<div>{subsection.content}</div>
									</section>
								))}
							</div>
						)}
					</section>
				))}
			</main>
		</div>
	);
}
