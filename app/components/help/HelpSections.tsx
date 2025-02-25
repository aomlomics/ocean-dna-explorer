import { ReactNode } from "react";

// Define types for our content structure
export type Subsection = {
	id: string; // Used for anchor links and React keys
	title: string; // Display text in navigation and headings
	content: ReactNode; // Allows JSX content
};

export type Section = {
	id: string;
	title: string;
	content: ReactNode;
	subsections?: Subsection[]; // Optional array of subsections
};

export const helpSections: Section[] = [
	{
		id: "getting-started",
		title: "Getting Started",
		content: (
			<>
				<p className="mb-4">
					Welcome to our help documentation! This guide will help you understand how to use our platform effectively.
				</p>
				<p className="mb-4">
					Before diving in, make sure you have created an account and logged in. If you haven't done so yet, check out
					our quick start guide below.
				</p>
			</>
		),
		subsections: [
			{
				id: "prerequisites",
				title: "Prerequisites",
				content: (
					<>
						<p className="mb-4">Before you begin, ensure you have the following:</p>
						<ul className="list-disc ml-6 mb-4">
							<li>Node.js installed (v18 or higher)</li>
							<li>A modern web browser</li>
						</ul>
					</>
				)
			},
			{
				id: "installation",
				title: "Installation",
				content: <p className="mb-4">Follow these steps to get started with our platform...</p>
			}
		]
	},
	{
		id: "occurrences",
		title: "Understanding Occurrences",
		content: (
			<>
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
			</>
		),
		subsections: [
			{
				id: "occurrence-types",
				title: "Types of Occurrences",
				content: <p className="mb-4">There are several types of occurrences you might encounter...</p>
			},
			{
				id: "occurrence-lifecycle",
				title: "Lifecycle",
				content: <p className="mb-4">Each occurrence goes through several stages...</p>
			}
		]
	},
	{
		id: "features",
		title: "Key Features",
		content: (
			<>
				<p className="mb-4">Our platform offers several key features to help you manage and track occurrences:</p>
				<ul className="list-disc ml-6 mb-4">
					<li>Real-time tracking</li>
					<li>Detailed analytics</li>
					<li>Custom notifications</li>
				</ul>
			</>
		)
	}
];
