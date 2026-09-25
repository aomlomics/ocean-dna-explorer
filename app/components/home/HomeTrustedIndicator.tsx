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
import { TrustedActionLabel } from "../header/TrustedToggle";

export function TrustedActionHover({ trusted, children }: { trusted: boolean; children: ReactNode }) {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);
	const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
	const [caretLeft, setCaretLeft] = useState<number | null>(null);

	const computePanelStyle = useCallback((): CSSProperties | null => {
		if (!wrapperRef.current) return null;
		const rect = wrapperRef.current.getBoundingClientRect();
		const gap = 8;
		return {
			position: "fixed",
			top: rect.bottom + gap,
			left: rect.left + rect.width / 2,
			transform: "translateX(-50%)"
		};
	}, []);

	const openPanel = useCallback(() => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
		if (!open) setPanelStyle(computePanelStyle());
		setOpen(true);
	}, [computePanelStyle, open]);

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

	useLayoutEffect(() => {
		if (!open || !panelRef.current || !wrapperRef.current) return;

		const panelEl = panelRef.current;
		const trigger = wrapperRef.current.getBoundingClientRect();
		const width = panelEl.offsetWidth;
		const pad = 16;
		const gap = 8;
		const viewWidth = document.documentElement.clientWidth;
		const triggerCenter = trigger.left + trigger.width / 2;
		const top = trigger.bottom + gap;
		const unclampedLeft = triggerCenter - width / 2;
		const left = Math.min(Math.max(unclampedLeft, pad), Math.max(pad, viewWidth - pad - width));
		const caret = Math.min(Math.max(triggerCenter - left, 8), Math.max(8, width - 8));

		setPanelStyle((prev) => {
			if (prev && prev.top === top && prev.left === left && prev.transform === "none") return prev;
			return { position: "fixed", top, left, transform: "none" };
		});
		setCaretLeft((prev) => (prev === caret ? prev : caret));
	}, [open, trusted]);

	const panel = useMemo(() => {
		if (!open || !panelStyle) return null;
		return createPortal(
			<div
				ref={panelRef}
				className="pointer-events-auto z-menu relative w-max whitespace-nowrap rounded-md border border-base-content/20 bg-base-200 px-3 py-2 text-sm leading-relaxed text-base-content shadow-xl"
				style={panelStyle}
				onMouseEnter={openPanel}
				onMouseLeave={scheduleClosePanel}
			>
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-base-content/20 bg-base-200"
					style={{ left: caretLeft ?? "50%" }}
				/>
				<TrustedActionLabel />
			</div>,
			document.body
		);
	}, [caretLeft, open, openPanel, panelStyle, scheduleClosePanel, trusted]);

	return (
		<div
			ref={wrapperRef}
			className="relative inline-flex"
			onMouseEnter={openPanel}
			onMouseLeave={scheduleClosePanel}
			onFocus={openPanel}
			onBlur={(event) => {
				const nextFocused = event.relatedTarget as Node | null;
				if (nextFocused && panelRef.current?.contains(nextFocused)) return;
				scheduleClosePanel();
			}}
		>
			{children}
			{panel}
		</div>
	);
}
