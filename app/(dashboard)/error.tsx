"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const [showError, setShowError] = useState(true);
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center pb-16">
			<div className="max-w-md w-full">
				<div className="relative w-full h-64">
					<Image
						src="/images/construction_octo.png"
						alt="An octopus wearing a construction hat, looking determined."
						fill
						style={{ objectFit: "contain" }}
					/>
				</div>
				<div className="-mt-12">
					<h1 className="text-4xl font-normal text-primary mb-2">Something went wrong!</h1>
					<p className="text-base-content/80 mb-4">
						We&apos;ve encountered a unexpected issue. Please report the issue to the dev team at the{" "}
						<a href="https://github.com/aomlomics/ocean-dna-explorer/issues" className="text-primary">
							GitHub Issues tracker
						</a>
						.
					</p>
				</div>
				<div className="flex gap-3 justify-center">
					<button
						className="btn btn-primary"
						onClick={
							// Attempt to recover by trying to re-render the segment
							() => reset()
						}
					>
						Try Again
					</button>
					<a
						href="https://github.com/aomlomics/ocean-dna-explorer/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="btn btn-primary"
					>
						Report Issue
					</a>
					<button className="btn btn-primary" onClick={() => setShowError(!showError)}>
						{showError ? "Hide full error" : "View full error"}
					</button>
				</div>
				{showError && (
					<div className="mt-4 text-left p-2 bg-base-200 border border-error rounded-md">
						<pre className="text-error whitespace-pre-wrap">
							<code>{error.message}</code>
						</pre>
					</div>
				)}
			</div>
		</div>
	);
}
