"use client";

import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from "react";
import { createPortal } from "react-dom";

export default function InfoButton({
	text,
	children,
	dir = "tooltip-top",
	className,
	type
}: {
	dir?: "tooltip-top" | "tooltip-bottom" | "tooltip-left" | "tooltip-right";
	className?: string;
	type?: "warning" | "error";
} & ({ text: string; children?: undefined } | { text?: undefined; children: ReactNode })) {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);
	const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

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

	// Keep the panel inside the viewport horizontally after it has laid out.
	useLayoutEffect(() => {
		if (!open || !panelRef.current || !panelStyle) return;
		const panel = panelRef.current.getBoundingClientRect();
		const pad = 16;
		const overflowLeft = pad - panel.left;
		const overflowRight = panel.right - (window.innerWidth - pad);
		const dx = overflowLeft > 0 ? overflowLeft : overflowRight > 0 ? -overflowRight : 0;
		if (dx === 0) return;
		setPanelStyle((prev) => {
			if (!prev || typeof prev.left !== "number") return prev;
			return { ...prev, left: prev.left + dx };
		});
	}, [open, panelStyle]);

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
		if (!open || !panelStyle) return null;
		const tooltipBody = children ?? <span>{text}</span>;
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
				{tooltipBody}
			</div>,
			document.body
		);
	}, [children, text, open, openPanel, panelStyle, richCaretClass, scheduleClosePanel]);

	return (
		<div
			ref={wrapperRef}
			className={`relative inline-flex shrink-0 cursor-help items-center self-center align-middle leading-none ${className ?? ""}`}
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
