"use client";

import { RefObject, useState } from "react";
import { Chart as ChartJS } from "chart.js";

export default function ChartCopyButton({
	ref,
	disabled
}: {
	ref: RefObject<ChartJS<any> | null>;
	disabled?: boolean;
}) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			className={`btn mt-7 relative flex justify-center${copied ? " btn-success" : ""}`}
			onClick={() => {
				if (ref.current) {
					try {
						ref.current.canvas.toBlob(async (blob) => {
							if (blob) {
								const item = new ClipboardItem({ "image/png": blob });
								await navigator.clipboard.write([item]);
								setCopied(true);
								setTimeout(() => setCopied(false), 2000);
							}
						});
					} catch (error) {
						console.error("Failed to copy chart:", error);
					}
				}
			}}
			disabled={disabled}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				{copied ? (
					<polyline points="20 6 9 17 4 12"></polyline>
				) : (
					<>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</>
				)}
			</svg>
			<span className={copied ? "invisible" : ""}>Copy Chart</span>
			<span className={`absolute${copied ? "" : " hidden"}`}>Copied</span>
		</button>
	);
}
