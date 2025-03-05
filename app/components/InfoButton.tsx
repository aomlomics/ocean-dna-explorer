import React from "react";

export default function InfoButton({ infoText }: { infoText: string }) {
	return (
		<div className="tooltip tooltip-secondary flex items-center" data-tip={infoText}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				className="stroke-current text-secondary shrink-0 w-4 h-4"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
		</div>
	);
}
