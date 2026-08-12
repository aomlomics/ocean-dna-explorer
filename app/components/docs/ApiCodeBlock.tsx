"use client";

import { fetcher } from "@/app/helpers/utils";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import useSWR from "swr";

export default function ApiCodeBlock({ language, url }: { language: string; url: string }) {
	const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "dark");
	const [copied, setCopied] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const { data, error, isLoading } = useSWR(url, fetcher);
	let code;
	if (error) {
		code = JSON.stringify(error, null, 2);
	} else if (isLoading || !data) {
		code = "Loading...";
	} else if (data.statusMessage === "error") {
		code = data.error;
	} else if (data.statusMessage === "success") {
		code = JSON.stringify(data.result, undefined, 2);
	} else {
		code = "Unexpected error occurred";
	}

	useEffect(() => {
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

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const previewCode = code.split("\n").slice(0, 3).join("\n") + (code.split("\n").length > 3 ? "\n..." : "");

	return (
		<div className={`bg-base-200 rounded-md overflow-hidden relative ${getWidthClass()}`}>
			<div className="flex justify-between items-center p-2 cursor-pointer" onClick={toggleOpen}>
				<span className="font-mono text-sm">{isOpen ? "Hide Response" : "Show Response"}</span>
				<div className="flex items-center">
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleCopy();
						}}
						className="p-2 rounded hover:bg-base-300 transition-colors"
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
					<svg
						className={`w-5 h-5 transition-transform transform ${isOpen ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</div>
			</div>
			{isOpen ? (
				<SyntaxHighlighter
					language={language}
					style={theme === "dark" ? darkTheme : lightTheme}
					customStyle={{
						margin: 0,
						padding: "1rem",
						paddingTop: 0
					}}
					wrapLongLines={true}
				>
					{code}
				</SyntaxHighlighter>
			) : (
				<SyntaxHighlighter
					language={language}
					style={theme === "dark" ? darkTheme : lightTheme}
					customStyle={{
						margin: 0,
						padding: "1rem",
						paddingTop: 0,
						height: "100px", // Limit height of the preview
						overflow: "hidden"
					}}
					wrapLongLines={false}
				>
					{previewCode}
				</SyntaxHighlighter>
			)}
		</div>
	);
}
