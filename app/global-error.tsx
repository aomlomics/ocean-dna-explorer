"use client";

import "@/styles/globals.css";
import { Source_Sans_3 } from "next/font/google";
import ErrorBoundary from "./components/ErrorBoundary";

const sourceSans = Source_Sans_3({
	weight: ["300", "400", "500", "600", "700", "800"],
	subsets: ["latin"],
	display: "swap"
});

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="en">
			<body className={`${sourceSans.className} bg-base-100 text-base-content`}>
				<main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
					<ErrorBoundary error={error} reset={reset} />
				</main>
			</body>
		</html>
	);
}
