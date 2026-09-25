"use client";

import { type ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import { useTrusted } from "@/app/hooks/TrustedProvider";
import { TrustedIcon, UntrustedIcon } from "./icons";
import Modal from "./Modal";

function InfoIcon() {
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

	const stripTop = ih - 120;
	if (r.bottom <= stripTop) return 0;

	const effectiveTop = Math.max(r.top, stripTop);
	return ih - effectiveTop + gap;
}

export default function TrustedFab() {
	const { trusted, setTrusted } = useTrusted();

	const explainRef = useRef<HTMLDialogElement | null>(null);
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const fabOpenRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = wrapRef.current;
		if (!el) return;

		const updatePosition = () => {
			const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
			const visible = scrollTop > 100;
			el.hidden = !visible;
			if (!visible) return;

			const offset = getFooterOffset();
			el.style.bottom = offset > 0 ? `${offset}px` : "2rem";
		};

		window.addEventListener("scroll", updatePosition, { passive: true });
		window.addEventListener("resize", updatePosition);
		updatePosition();

		return () => {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
		};
	}, []);

	const fabStyles = "btn btn-xl btn-circle shadow-xl";
	const fabChildrenStyles = `tooltip before:text-base-content before:bg-base-200 before:border before:border-base-content/20 group relative ${fabStyles}`;

	return (
		<>
			{/* z level stays UNDERNEATH the loading screen */}
			<div ref={wrapRef} hidden className="fixed left-3 sm:left-8 z-popover" style={{ bottom: "2rem" }}>
				<div className="fab fab-flower fab-start">
					<div
						ref={fabOpenRef}
						tabIndex={0}
						role="button"
						className={`btn-primary ${fabStyles}`}
						aria-label={`Data filter, currently showing ${trusted ? "trusted data" : "all data"}. Open options.`}
						aria-haspopup="true"
					>
						{trusted ? <TrustedIcon className="size-8" /> : <UntrustedIcon className="size-8" />}
					</div>

					<div className="fab-close">
						<span className={`btn-primary ${fabStyles}`} aria-hidden>
							✕
						</span>
					</div>

					<button
						className={`z-50 ${fabChildrenStyles}`}
						data-tip="What is Trusted data?"
						aria-label="What is Trusted data?"
						onClick={() => explainRef.current?.showModal()}
					>
						<InfoIcon />
					</button>

					<Link
						className={`z-49 ${fabChildrenStyles}`}
						data-tip="Help Docs"
						aria-label="Help Docs"
						href="/docs/help/overview"
					>
						<DocsIcon />
					</Link>

					<button
						className={`z-48 ${fabChildrenStyles} ${trusted ? "btn-primary" : ""}`}
						data-tip="Show only trusted data"
						aria-label="Show only trusted data"
						onClick={() => {
							if (!trusted) {
								setTrusted(true);
								fabOpenRef.current?.focus();
								fabOpenRef.current?.blur();
							}
						}}
					>
						<TrustedIcon className="size-8" />
					</button>

					<button
						className={`z-47 ${fabChildrenStyles} ${trusted ? "" : "btn-primary"}`}
						data-tip="Show all data"
						aria-label="Show all data"
						onClick={() => {
							if (trusted) {
								setTrusted(false);
								fabOpenRef.current?.focus();
								fabOpenRef.current?.blur();
							}
						}}
					>
						<UntrustedIcon className="size-8" />
					</button>
				</div>
			</div>

			<Modal ref={explainRef}>
				<h2 className="mb-3 text-xl font-semibold text-primary">Trusted data</h2>
				<TrustedModeExplanation />
			</Modal>
		</>
	);
}

export function TrustedModeExplanation() {
	return (
		<div className="space-y-2">
			<p>
				Trusted data includes only analyses that have passed ODE review for standardized metadata and bioinformatics
				processing. All data (untrusted) adds unreviewed or experimental analyses.
			</p>
			<p>
				Switching this filter updates the data you see: points on maps, numbers in data cards, visualizations, search
				results, and rows on Explore pages.
			</p>
			<p>
				eDNA often picks up contamination, so unreviewed analyses can include false detections. Trusted mode hides those
				until they have been checked.
			</p>
		</div>
	);
}
