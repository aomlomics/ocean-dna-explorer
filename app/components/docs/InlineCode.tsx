"use client";

import { useState } from "react";

interface InlineCodeProps {
	code: string;
}

export default function InlineCode({ code }: InlineCodeProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-base-200 px-2.5 py-1 text-sm font-mono align-middle">
			<span className="break-all">{code}</span>
			<button
				onClick={handleCopy}
				className="shrink-0 rounded p-1 hover:bg-base-300 transition-colors"
				aria-label="Copy code"
			>
				{copied ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
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
		</span>
	);
}
