"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Portaled to <body> to avoid clipping; sits at the popover layer (see z-index scale in globals.css). */
const PREVIEW_Z_INDEX = "var(--z-popover)";

/**
 * Project-header photo button; hover/focus opens a full-image preview portaled to document.body.
 */
export default function ProjectCoverPhotoPreview({ src, title }: { src: string; title: string }) {
	const anchorRef = useRef<HTMLButtonElement>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [pos, setPos] = useState({ top: 0, right: 0 });

	const clearCloseTimer = useCallback(() => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	}, []);

	const updatePosition = useCallback(() => {
		const el = anchorRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		setPos({
			top: rect.bottom + 8,
			right: Math.max(8, window.innerWidth - rect.right)
		});
	}, []);

	const scheduleClose = useCallback(() => {
		clearCloseTimer();
		closeTimerRef.current = setTimeout(() => setOpen(false), 200);
	}, [clearCloseTimer]);

	const openPreview = useCallback(() => {
		clearCloseTimer();
		updatePosition();
		setOpen(true);
	}, [clearCloseTimer, updatePosition]);

	useLayoutEffect(() => {
		setMounted(true);
	}, []);

	useLayoutEffect(() => {
		if (open) updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) return;
		const onScrollOrResize = () => updatePosition();
		window.addEventListener("scroll", onScrollOrResize, true);
		window.addEventListener("resize", onScrollOrResize);
		return () => {
			window.removeEventListener("scroll", onScrollOrResize, true);
			window.removeEventListener("resize", onScrollOrResize);
		};
	}, [open, updatePosition]);

	useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

	const preview =
		open && mounted ? (
			<div
				role="tooltip"
				className="fixed w-[min(92vw,40rem)] max-w-[min(92vw,40rem)] rounded-xl border border-base-300/80 bg-base-100 p-3 shadow-xl pointer-events-auto"
				style={{ top: pos.top, right: pos.right, zIndex: PREVIEW_Z_INDEX }}
				onMouseEnter={clearCloseTimer}
				onMouseLeave={scheduleClose}
			>
				<p className="mb-2 text-center text-sm font-medium text-base-content/80">Full project image</p>
				<div className="relative flex justify-center">
					<Image
						src={src}
						alt=""
						width={1920}
						height={1080}
						className="max-h-[min(75vh,900px)] w-auto max-w-full h-auto object-contain rounded-md"
					/>
				</div>
			</div>
		) : null;

	return (
		<>
			<button
				ref={anchorRef}
				type="button"
				className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-base-100/80 border border-base-300/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-base-100 hover:shadow-lg transition-shadow"
				aria-label={`Show full project photo for ${title}`}
				aria-expanded={open}
				onMouseEnter={openPreview}
				onMouseLeave={scheduleClose}
				onFocus={openPreview}
				onBlur={scheduleClose}
			>
				<span
					className="block w-5 h-5 bg-primary mask-[url('/images/icons/photo_icon.svg')] mask-contain mask-no-repeat mask-center [-webkit-mask-image:url('/images/icons/photo_icon.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]"
					aria-hidden
				/>
			</button>
			{mounted && preview ? createPortal(preview, document.body) : null}
		</>
	);
}
