import React from "react";

export default function InfoButton({
	infoText,
	dir = "tooltip-top",
	className,
	type
}: {
	infoText: string;
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

	return (
		<div
			className={`tooltip ${dir} inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none translate-y-px [--tt-bg:#0f172a] [--tt-text:#f1f5f9] [--tt-border:#334155] before:max-w-[min(90vw,24rem)] before:whitespace-pre-wrap before:rounded-md before:border before:border-(--tt-border) before:bg-(--tt-bg) before:px-3 before:py-2 before:text-sm before:leading-relaxed before:text-(--tt-text) before:shadow-xl ${className ?? ""}`}
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
