import React from "react";

export default function InfoButton({
	infoText,
	dir
}: {
	infoText: string;
	dir?: "tooltip-bottom" | "tooltip-left" | "tooltip-right";
}) {
	return (
		<div className={`tooltip ${dir ? dir : ""} flex items-center before:!bg-base-200 before:!text-base-content before:!border-base-300 pb-0.5`} data-tip={infoText}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				className="stroke-current text-primary shrink-0 w-5 h-5"
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
