"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const INFO_TOOLTIP_THEME_CLASS =
	"[--tt-bg:var(--color-base-200)] [--tt-color:var(--color-base-content)] before:max-w-[min(90vw,24rem)] before:whitespace-pre-wrap before:rounded-md before:border before:border-base-content/20 before:bg-[var(--tt-bg)] before:px-3 before:py-2 before:text-sm before:leading-relaxed before:text-[var(--tt-color)] before:shadow-xl after:outline after:outline-1 after:outline-base-content/20";

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
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const computePanelStyle = useCallback((): CSSProperties | null => {
		if (!wrapperRef.current) return null;
		const rect = wrapperRef.current.getBoundingClientRect();
		const gap = 8;
		const headerBottom = document.querySelector("header.navbar")?.getBoundingClientRect().bottom ?? 0;
		const minTop = headerBottom + gap;

		if (dir === "tooltip-right") {
			return {
				position: "fixed",
				top: Math.max(rect.top, minTop),
				left: rect.right + gap,
				transform: "none"
			};
		}
		if (dir === "tooltip-left") {
			return {
				position: "fixed",
				top: Math.max(rect.top, minTop),
				left: rect.left - gap,
				transform: "translateX(-100%)"
			};
		}
		if (dir === "tooltip-bottom") {
			return {
				position: "fixed",
				top: Math.max(rect.bottom + gap, minTop),
				left: rect.left + rect.width / 2,
				transform: "translateX(-50%)"
			};
		}
		if (rect.top - gap < minTop) {
			return {
				position: "fixed",
				top: Math.max(rect.bottom + gap, minTop),
				left: rect.left + rect.width / 2,
				transform: "translateX(-50%)"
			};
		}
		return {
			position: "fixed",
			top: rect.top - gap,
			left: rect.left + rect.width / 2,
			transform: "translate(-50%, -100%)"
		};
	}, [dir]);

	const openPanel = useCallback(() => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
		setPanelStyle(computePanelStyle());
		setOpen(true);
	}, [computePanelStyle]);

	const closePanel = useCallback(() => {
		setOpen(false);
	}, []);

	const scheduleClosePanel = useCallback(() => {
		if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		closeTimerRef.current = setTimeout(() => {
			setOpen(false);
		}, 90);
	}, []);

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
		};
	}, []);

	useEffect(() => {
		if (!open) return;
		const update = () => setPanelStyle(computePanelStyle());
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [computePanelStyle, open]);

	const iconColorClass =
		type === "warning"
			? "text-amber-500/85 hover:text-amber-500"
			: type === "error"
				? "text-rose-500/85 hover:text-rose-500"
				: "text-primary/85 hover:text-primary";
	const hoverAccentClass =
		type === "warning" ? "hover:-translate-y-px" : type === "error" ? "hover:-translate-y-px" : "hover:-translate-y-px";
	const richCaretClass =
		dir === "tooltip-right"
			? "left-0 top-3 -translate-x-1/2 rotate-45 border-l border-b"
			: dir === "tooltip-left"
				? "right-0 top-3 translate-x-1/2 rotate-45 border-r border-t"
				: dir === "tooltip-bottom"
					? "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t"
					: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b";

	const richPanel = useMemo(() => {
		if (!mounted || !open || !panelStyle || !infoContent) return null;
		return createPortal(
			<div
				ref={panelRef}
				className="pointer-events-auto z-tooltip relative w-max max-w-[min(90vw,24rem)] rounded-md border border-base-content/20 bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content opacity-100 shadow-xl"
				style={panelStyle}
				onMouseEnter={openPanel}
				onMouseLeave={scheduleClosePanel}
			>
				<span
					aria-hidden="true"
					className={`pointer-events-none absolute h-3 w-3 border-base-content/20 bg-base-200 ${richCaretClass}`}
				/>
				{infoContent}
			</div>,
			document.body
		);
	}, [dir, infoContent, mounted, open, openPanel, panelStyle, richCaretClass, scheduleClosePanel]);

	if (infoContent) {
		return (
			<div
				ref={wrapperRef}
				className={`relative inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none translate-y-px ${className ?? ""}`}
				onMouseEnter={openPanel}
				onMouseLeave={scheduleClosePanel}
				onFocus={openPanel}
				onBlur={(event) => {
					const nextFocused = event.relatedTarget as Node | null;
					if (nextFocused && panelRef.current?.contains(nextFocused)) return;
					scheduleClosePanel();
				}}
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
				{richPanel}
			</div>
		);
	}

	return (
		<div
			className={`tooltip ${dir} relative z-tooltip inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none translate-y-px before:z-tooltip after:z-tooltip ${INFO_TOOLTIP_THEME_CLASS} ${className ?? ""}`}
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
