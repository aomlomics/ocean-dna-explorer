"use client";

import { fetcher } from "@/app/helpers/utils";
import { useState } from "react";
import useSWRImmutable from "swr/immutable";
import { ThemedSyntaxHighlighter } from "./CodeBlock";

export default function ApiCodeBlock({ language, url }: { language: string; url: string }) {
	const [copied, setCopied] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const { data, error, isLoading } = useSWRImmutable(url, fetcher);
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

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const lines = code.split("\n");
	//only clip the preview when there is more than the three lines we show
	const clipPreview = lines.length > 3;

	// Determine width class based on content
	const getWidthClass = () => {
		// Single line (like a count)
		if (lines.length === 1) {
			return "w-fit";
		}

		// Short multiline (like small JSON)
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
				<ThemedSyntaxHighlighter
					language={language}
					code={code}
					customStyle={{
						margin: 0,
						padding: "1rem",
						paddingTop: 0
					}}
					wrapLongLines={true}
				/>
			) : (
				<ThemedSyntaxHighlighter
					language={language}
					code={previewCode}
					customStyle={{
						margin: 0,
						padding: "1rem",
						paddingTop: 0,
						...(clipPreview ? { height: "100px", overflow: "hidden" } : {})
					}}
					wrapLongLines={false}
				/>
			)}
		</div>
	);
}
