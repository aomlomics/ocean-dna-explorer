"use client";

import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";

export default function TitleHoverTooltip({
	tooltip,
	children
}: {
	tooltip: string;
	children: ReactNode;
}) {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const tipRef = useRef<HTMLDivElement | null>(null);
	const [hovering, setHovering] = useState(false);
	const [shiftX, setShiftX] = useState(0);

	const clampToViewport = useCallback(() => {
		const tip = tipRef.current;
		const wrap = wrapperRef.current;
		if (!tip || !wrap) return;
		const tipWidth = tip.offsetWidth;
		if (!tipWidth) return;
		const wrapRect = wrap.getBoundingClientRect();
		const pad = 8;
		const idealLeft = wrapRect.left + wrapRect.width / 2 - tipWidth / 2;
		const maxLeft = window.innerWidth - pad - tipWidth;
		const clampedLeft = Math.min(Math.max(idealLeft, pad), Math.max(pad, maxLeft));
		setShiftX(clampedLeft - idealLeft);
	}, []);

	useLayoutEffect(() => {
		if (!hovering) return;
		clampToViewport();
		const onResize = () => clampToViewport();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [hovering, clampToViewport, tooltip]);

	return (
		<div
			ref={wrapperRef}
			className="relative inline-flex"
			onMouseEnter={() => setHovering(true)}
			onMouseLeave={() => {
				setHovering(false);
				setShiftX(0);
			}}
			onFocus={() => setHovering(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setHovering(false);
					setShiftX(0);
				}
			}}
		>
			{children}
			<div
				ref={tipRef}
				className={`pointer-events-none absolute left-1/2 top-full z-tooltip mt-3 ${hovering ? "block" : "hidden"}`}
				style={{ transform: `translateX(calc(-50% + ${shiftX}px))` }}
			>
				<div className="relative rounded-md border border-base-content/20 bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content shadow-xl whitespace-nowrap">
					<span
						aria-hidden="true"
						className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-base-content/20 bg-base-200"
					/>
					{tooltip}
				</div>
			</div>
		</div>
	);
}
