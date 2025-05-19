"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ApiCodeBlock({ language, url }: { language: string; url: string }) {
	const [theme, setTheme] = useState("dark");
	const [copied, setCopied] = useState(false);
	const [code, setCode] = useState("Loading...");

	useEffect(() => {
		async function doFetch() {
			const response = await fetch(url);
			if (!response.ok) {
				setCode(response.statusText);
			} else {
				setCode(JSON.stringify(await response.json(), null, 2));
			}
		}
		doFetch();

		const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
		setTheme(currentTheme);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === "data-theme") {
					const newTheme = document.documentElement.getAttribute("data-theme") || "dark";
					setTheme(newTheme);
				}
			});
		});

		observer.observe(document.documentElement, { attributes: true });
		return () => observer.disconnect();
	}, []);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Need to override theme / background color of the library I useds
	const darkTheme = {
		...oneDark,
		'pre[class*="language-"]': {
			...oneDark['pre[class*="language-"]'],
			background: "transparent"
		},
		'code[class*="language-"]': {
			...oneDark['code[class*="language-"]'],
			background: "transparent"
		}
	};

	const lightTheme = {
		...oneLight,
		'pre[class*="language-"]': {
			...oneLight['pre[class*="language-"]'],
			background: "transparent"
		},
		'code[class*="language-"]': {
			...oneLight['code[class*="language-"]'],
			background: "transparent"
		}
	};

	// Determine width class based on content
	const getWidthClass = () => {
		// Single line (like URLs)
		if (!code.includes("\n")) {
			return "w-fit min-w-[300px]";
		}

		// Short multiline (like small JSON)
		const lines = code.split("\n");
		const maxLineLength = Math.max(...lines.map((line) => line.length));
		if (maxLineLength < 50 && lines.length < 8) {
			return "w-fit max-w-xl";
		}

		// Long code (Python, R examples, large JSON)
		return "w-full max-w-3xl";
	};

	return (
		<div className={`bg-base-200 rounded-md overflow-hidden relative ${getWidthClass()}`}>
			<button
				onClick={handleCopy}
				className="absolute right-2 top-2 p-2 rounded hover:bg-base-300 transition-colors"
				aria-label="Copy code"
			>
				{copied ? (
					// Checkmark icon when copied
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
				) : (
					// Copy icon
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
				)}
			</button>
			<SyntaxHighlighter
				language={language}
				style={theme === "dark" ? darkTheme : lightTheme}
				customStyle={{
					margin: 0,
					padding: "1rem"
				}}
				wrapLongLines={true}
			>
				{code}
			</SyntaxHighlighter>
		</div>
	);
}
