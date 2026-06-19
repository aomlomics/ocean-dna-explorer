import React, { ReactNode } from "react";
import { SHARED_TOOLTIP_THEME_CLASS } from "./viewAsSearchTooltip";

export default function InfoButton({
	infoText,
	infoContent,
	dir = "tooltip-top",
	className,
	type
}: {
	infoText: string;
	infoContent?: ReactNode;
	dir?: "tooltip-top" | "tooltip-bottom" | "tooltip-left" | "tooltip-right";
	className?: string;
	type?: "warning" | "error";
}) {
	const iconColorClass =
		type === "warning"
			? "text-amber-500/85 hover:text-amber-500"
			: type === "error"
				? "text-rose-500/85 hover:text-rose-500"
				: "text-primary/85 hover:text-primary";
	const hoverAccentClass =
		type === "warning"
			? "hover:-translate-y-px"
			: type === "error"
				? "hover:-translate-y-px"
				: "hover:-translate-y-px";

	const richPanelPositionClass =
		dir === "tooltip-right"
			? "left-full top-1/2 ml-2 -translate-y-1/2"
			: dir === "tooltip-left"
				? "right-full top-1/2 mr-2 -translate-y-1/2"
				: dir === "tooltip-bottom"
					? "left-1/2 top-full mt-2 -translate-x-1/2"
					: "bottom-full left-1/2 mb-2 -translate-x-1/2";

	if (infoContent) {
		return (
			<div
				className={`group relative inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none translate-y-px ${className ?? ""}`}
			>
				<div
					className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-out ${hoverAccentClass}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						className={`h-[1.35rem] w-[1.35rem] shrink-0 stroke-current transition-colors duration-150 ${iconColorClass}`}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				</div>
				<div
					className={`pointer-events-none invisible absolute z-110001 w-max max-w-[min(90vw,24rem)] rounded-md bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${richPanelPositionClass}`}
				>
					{infoContent}
				</div>
			</div>
		);
	}

	return (
		<div
			className={`tooltip ${dir} relative z-5200 inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none translate-y-px before:z-5201 after:z-5201 ${SHARED_TOOLTIP_THEME_CLASS} ${className ?? ""}`}
			data-tip={infoText}
		>
			<div
				className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-out ${hoverAccentClass}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					className={`h-[1.35rem] w-[1.35rem] shrink-0 stroke-current transition-colors duration-150 ${iconColorClass}`}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			</div>
		</div>
	);
}
