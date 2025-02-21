export default function Help() {
	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="w-64 border-r border-base-300 p-6 sticky top-0 h-screen overflow-y-auto">
				<nav>
					<h2 className="text-xl font-bold mb-4 pt-3">Contents</h2>
					<ul className="space-y-4">
						<li>
							<a href="#getting-started" className="block mb-2 hover:text-primary">
								Getting Started
							</a>
							<ul className="border-l border-base-300 ml-2 space-y-2">
								<li className="pl-4">
									<a href="#prerequisites" className="text-sm hover:text-primary">
										Prerequisites
									</a>
								</li>
								<li className="pl-4">
									<a href="#installation" className="text-sm hover:text-primary">
										Installation
									</a>
								</li>
							</ul>
						</li>
						<li>
							<a href="#occurrences" className="block mb-2 hover:text-primary">
								Understanding Occurrences
							</a>
							<ul className="border-l border-base-300 ml-2 space-y-2">
								<li className="pl-4">
									<a href="#occurrence-types" className="text-sm hover:text-primary">
										Types of Occurrences
									</a>
								</li>
								<li className="pl-4">
									<a href="#occurrence-lifecycle" className="text-sm hover:text-primary">
										Lifecycle
									</a>
								</li>
							</ul>
						</li>
						<li>
							<a href="#features" className="hover:text-primary">
								Key Features
							</a>
						</li>
					</ul>
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex-1 p-8 max-w-4xl">
				<section id="getting-started">
					<h2 className="text-3xl font-bold mb-6">Getting Started</h2>
					<p className="mb-4">
						Welcome to our help documentation! This guide will help you understand how to use our platform effectively.
					</p>
					<p className="mb-4">
						Before diving in, make sure you have created an account and logged in. If you haven't done so yet, check out
						our quick start guide below.
					</p>

					<div className="border-l-2 border-base-300 pl-6 mt-8">
						<section id="prerequisites">
							<h3 className="text-2xl font-semibold mb-4">Prerequisites</h3>
							<p className="mb-4">Before you begin, ensure you have the following:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Node.js installed (v18 or higher)</li>
								<li>A modern web browser</li>
							</ul>
						</section>

						<section id="installation" className="mt-8">
							<h3 className="text-2xl font-semibold mb-4">Installation</h3>
							<p className="mb-4">Follow these steps to get started with our platform...</p>
						</section>
					</div>
				</section>

				<section id="occurrences" className="mt-12">
					<h2 className="text-3xl font-bold mb-6">Understanding Occurrences</h2>
					<p className="mb-4">
						An occurrence represents a specific event or instance in our system. Think of it as a snapshot of something
						that happened at a particular moment.
					</p>
					<div className="bg-base-200 p-4 rounded-md mb-4 text-base-content">
						<pre>
							<code>
								{`{
  "occurrenceId": "123",
  "timestamp": "2024-03-20T10:30:00Z",
  "type": "user_action"
}`}
							</code>
						</pre>
					</div>

					<div className="border-l-2 border-base-300 pl-6 mt-8">
						<section id="occurrence-types">
							<h3 className="text-2xl font-semibold mb-4">Types of Occurrences</h3>
							<p className="mb-4">There are several types of occurrences you might encounter...</p>
						</section>

						<section id="occurrence-lifecycle" className="mt-8">
							<h3 className="text-2xl font-semibold mb-4">Lifecycle</h3>
							<p className="mb-4">Each occurrence goes through several stages...</p>
						</section>
					</div>
				</section>

				<section id="features" className="mt-12">
					<h2 className="text-3xl font-bold mb-6">Key Features</h2>
					<p className="mb-4">Our platform offers several key features to help you manage and track occurrences:</p>
					<ul className="list-disc ml-6 mb-4">
						<li>Real-time tracking</li>
						<li>Detailed analytics</li>
						<li>Custom notifications</li>
					</ul>
				</section>
			</main>
		</div>
	);
}
