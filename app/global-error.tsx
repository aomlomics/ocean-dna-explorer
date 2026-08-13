"use client";

import "@/styles/globals.css";
import { Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import { useEffect } from "react";

const sourceSans = Source_Sans_3({
	weight: ["300", "400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap"
});

export default function GlobalError({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body className={`${sourceSans.className} bg-base-100 text-base-content`}>
				<main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
					<h1 className="mb-2 text-4xl font-normal text-primary">Something went wrong</h1>
					<p className="mb-6 max-w-md text-base-content/80">
						We&apos;ve encountered an unexpected issue. You can try again, or report it on our{" "}
						<a
							href="https://github.com/aomlomics/ocean-dna-explorer/issues"
							className="text-primary underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub Issues tracker
						</a>
						.
					</p>
					<div className="flex flex-wrap justify-center gap-3">
						<button className="btn btn-primary" onClick={() => reset()}>
							Try again
						</button>
						<Link href="/" className="btn btn-primary">
							Home
						</Link>
					</div>
				</main>
			</body>
		</html>
	);
}
