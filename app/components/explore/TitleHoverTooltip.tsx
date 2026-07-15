"use client";

import { type ReactNode } from "react";

export default function TitleHoverTooltip({
	tooltip,
	children
}: {
	tooltip: string;
	children: ReactNode;
}) {
	return (
		<div className="group/title-tip relative inline-flex">
			{children}
			<div className="pointer-events-none absolute left-full top-1/2 z-tooltip ml-3 hidden -translate-y-1/2 group-hover/title-tip:block group-focus-within/title-tip:block">
				<div className="relative rounded-md border border-base-content/20 bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content shadow-xl whitespace-nowrap">
					<span
						aria-hidden="true"
						className="absolute right-full top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-b border-base-content/20 bg-base-200"
					/>
					{tooltip}
				</div>
			</div>
		</div>
	);
}
