"use client";

import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrustedModeExplanation, TrustedShieldIcon } from "@/app/components/home/HomeTrustedIndicator";
import { unfocus } from "@/app/helpers/utils";
import { useTrusted } from "@/app/hooks/TrustedProvider";

/** Same lift as ScrollToTop so both corners clear the footer together. */
const BUTTON_ZONE_PX = 120;

/** Above Leaflet controls/popups (max ~1000) so the FAB stays clickable over maps. */
const BUTTON_Z_INDEX = 10050;

const CIRCLE_BASE = "btn btn-xl btn-circle shadow-xl";
const CIRCLE_CLASS = `${CIRCLE_BASE} bg-base-300 text-base-content hover:bg-base-content/10`;
const CIRCLE_ACTIVE_CLASS = `${CIRCLE_BASE} btn-primary`;
const FAB_TIP_CLASS =
	"pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md border border-base-content/20 bg-base-200 px-3 py-2 text-sm leading-snug text-base-content opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100";
const FAB_TIP_CARET_CLASS =
	"absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-l border-base-content/20 bg-base-200";

const DOCS_HREF = "/docs/help/overview";

function closeFab() {
	unfocus();
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
}

function FabAction({
	tip,
	active,
	href,
	onClick,
	children
}: {
	tip: string;
	active?: boolean;
	href?: string;
	onClick?: () => void;
	children: ReactNode;
}) {
	const className = active ? CIRCLE_ACTIVE_CLASS : CIRCLE_CLASS;

	const control = href ? (
		<Link href={href} className={className} aria-label={tip} onClick={onClick}>
			{children}
		</Link>
	) : (
		<button type="button" className={className} aria-label={tip} onClick={onClick}>
			{children}
		</button>
	);

	return (
		<div>
			<div className="group relative hover:z-50 focus-within:z-50">
				{control}
				<span className={FAB_TIP_CLASS}>
					<span aria-hidden="true" className={FAB_TIP_CARET_CLASS} />
					{tip}
				</span>
			</div>
		</div>
	);
}

function InfoIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="size-8 stroke-current" aria-hidden>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	);
}

function DocsIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			className="size-8 stroke-current"
			aria-hidden
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
			/>
		</svg>
	);
}

function getFooterOffset(): number {
	const footer = document.querySelector("footer");
	if (!footer) return 0;

	const r = footer.getBoundingClientRect();
	const ih = window.innerHeight;
	const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
	const gap = remPx * 1.5;

	if (r.bottom <= 0 || r.top >= ih) return 0;

	const stripTop = ih - BUTTON_ZONE_PX;
	if (r.bottom <= stripTop) return 0;

	const effectiveTop = Math.max(r.top, stripTop);
	return ih - effectiveTop + gap;
}

export default function TrustedFab() {
	const { trusted, setTrusted } = useTrusted();
	const explainRef = useRef<HTMLDialogElement | null>(null);
	const [footerOffset, setFooterOffset] = useState(0);

	useEffect(() => {
		const updatePosition = () => setFooterOffset(getFooterOffset());

		window.addEventListener("scroll", updatePosition, { passive: true });
		window.addEventListener("resize", updatePosition);
		updatePosition();

		return () => {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
		};
	}, []);

	const openExplanation = useCallback(() => {
		explainRef.current?.showModal();
	}, []);

	const setMode = useCallback(
		(value: boolean) => {
			if (trusted !== value) setTrusted(value);
			closeFab();
		},
		[setTrusted, trusted]
	);

	const onTriggerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === " " || event.key === "Enter") {
			event.preventDefault();
			event.currentTarget.focus();
		}
	}, []);

	const modeLabel = trusted ? "trusted data" : "all data";

	return (
		<>
			<div
				className="fab fab-flower fab-start left-3 sm:left-8 end-auto"
				style={{
					bottom: footerOffset > 0 ? `${footerOffset}px` : "2rem",
					zIndex: BUTTON_Z_INDEX
				}}
			>
				{/* daisyUI: div+tabindex, not <button> — Safari still will not focus a button. */}
				<div
					tabIndex={0}
					role="button"
					className={CIRCLE_ACTIVE_CLASS}
					aria-label={`Data filter, currently showing ${modeLabel}. Open options.`}
					aria-haspopup="true"
					onKeyDown={onTriggerKeyDown}
				>
					<TrustedShieldIcon trusted={trusted} className="size-8 fill-current" />
				</div>

				<div className="fab-close">
					<span className={CIRCLE_ACTIVE_CLASS} aria-hidden>
						✕
					</span>
				</div>

				<FabAction tip="What is trusted data?" onClick={openExplanation}>
					<InfoIcon />
				</FabAction>

				<FabAction tip="Help Docs" href={DOCS_HREF} onClick={closeFab}>
					<DocsIcon />
				</FabAction>

				<FabAction tip="Show only trusted data" active={trusted} onClick={() => setMode(true)}>
					<TrustedShieldIcon trusted className="size-8 fill-current" />
				</FabAction>

				<FabAction tip="Show all data" active={!trusted} onClick={() => setMode(false)}>
					<TrustedShieldIcon trusted={false} className="size-8 fill-current" />
				</FabAction>
			</div>

			<dialog ref={explainRef} className="modal" style={{ zIndex: BUTTON_Z_INDEX + 50 }}>
				<div className="modal-box">
					<button
						type="button"
						aria-label="Close dialog"
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={() => explainRef.current?.close()}
					>
						✕
					</button>
					<h2 className="mb-3 text-xl font-semibold text-primary">Trusted data</h2>
					<TrustedModeExplanation />
				</div>
				<form method="dialog" className="modal-backdrop">
					<button type="submit" aria-label="Close dialog">
						Close dialog
					</button>
				</form>
			</dialog>
		</>
	);
}
