"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// [phrase, weight] — larger weight = bigger text in the cloud
const WORD_LIST: [string, number][] = [
	["Query the API", 90],
	["FAIR eDNA Data", 80],
	["Build complex Searches", 70],
	["Learn about eDNA", 65],
	["Build custom figures", 60],
	["Programmatic data access", 50],
	["Explore projects", 48],
	["Browse samples on the map", 46],
	["Drill into detections", 44],
	["Trace a detection to its feature", 42],
	["See taxonomic assignments instantly", 40],
	["Navigate the taxonomy tree", 40],
	["Explore analyses and pipelines", 38],
	["Compare target genes", 36],
	["Find assays by primers + targets", 36],
	["Filter and sort any data table", 34],
	["Search within columns", 32],
	["Open any record for full details", 32],
	["Visualize metadata patterns", 30],
	["Visualize taxonomy distributions", 30],
	["Compare projects side-by-side", 28],
	["Compare analyses across datasets", 28],
	["Explore sampling environments", 28],
	["Check temporal coverage", 26],
	["Explore depth coverage", 26],
	["Spot metadata gaps fast", 24],
	["Meet featured organisms", 24],
	["Discover Life Across ODE", 24],
	["Submit a new project", 22],
	["Submit a new analysis", 22],
	["Tag datasets for discovery", 22],
	["Choose dataset visibility", 20],
	["Edit metadata later", 20],
	["Use the API endpoints", 20],
	["Search and filter via API", 20],
	["Explore the database schema", 18],
	["Learn eDNA 101", 18],
	["Explore eDNA's impact", 18],
	["Use custom map tools", 18],
	["Taxonomies unlocked", 16],
	["Make your own discoveries", 16],
];

// Time (ms) spent revealing words in each cycle.
const REVEAL_DURATION_MS = 24_000;
// Keep the full cloud visible after reveal completes.
const HOLD_FULL_CLOUD_MS = 12_000;
// Words revealed per tick.
const BATCH_SIZE = 1;

const PALETTE = [
	"rgba(255,255,255,0.92)",
	"rgba(207,250,254,0.9)",
	"rgba(125,211,252,0.88)",
	"rgba(147,197,253,0.9)",
];

type WordCloudFn = ((el: HTMLElement, opts: object) => void) & {
	stop?: () => void;
};

export default function AmbientPage() {
	const cloudHostRef = useRef<HTMLDivElement | null>(null);
	const cloudWordsRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const host = cloudHostRef.current;
		const wordsEl = cloudWordsRef.current;
		if (!host || !wordsEl) return;

		let cancelled = false;
		let wordCloud: WordCloudFn | null = null;
		let revealTimer: number | null = null;
		let cycleTimer: number | null = null;
		let resizeTimer: number | null = null;
		let initTimer: number | null = null;

		const clearReveal = () => {
			if (revealTimer != null) {
				window.clearInterval(revealTimer);
				revealTimer = null;
			}
			if (cycleTimer != null) {
				window.clearTimeout(cycleTimer);
				cycleTimer = null;
			}
		};

		const startRevealCycle = (wordEls: HTMLElement[]) => {
			clearReveal();

			// Shuffle so the pop-in order varies each cycle.
			const shuffled = [...wordEls].sort(() => Math.random() - 0.5);
			let idx = 0;
			const steps = Math.ceil(shuffled.length / BATCH_SIZE);
			const stepMs = Math.max(240, Math.floor(REVEAL_DURATION_MS / steps));

			// Hide all words instantly (no transition so there's no visible flash).
			shuffled.forEach((el) => {
				el.style.transition = "none";
				el.style.opacity = "0";
			});

			// After the browser commits the hide, add the fade-in transition and begin revealing.
			window.requestAnimationFrame(() => {
				if (cancelled) return;
				shuffled.forEach((el) => {
					el.style.transition = "opacity 1.4s ease";
				});

				revealTimer = window.setInterval(() => {
					if (cancelled) return;
					for (let i = 0; i < BATCH_SIZE && idx < shuffled.length; i++, idx++) {
						shuffled[idx].style.opacity = "1";
					}
					if (idx >= shuffled.length && revealTimer != null) {
						// All words are visible — let the cycle timer handle the next reset.
						window.clearInterval(revealTimer);
						revealTimer = null;
					}
				}, stepMs);
			});

			// Restart after reveal window + full-cloud hold window.
			cycleTimer = window.setTimeout(() => {
				if (cancelled) return;
				startRevealCycle(wordEls);
			}, REVEAL_DURATION_MS + HOLD_FULL_CLOUD_MS);
		};

		const renderCloud = async () => {
			if (cancelled) return;

			// @ts-expect-error wordcloud2 has no bundled TS types.
			const module = await import("wordcloud");
			if (cancelled) return;
			wordCloud = (module.default ?? module) as WordCloudFn;

			clearReveal();
			wordCloud.stop?.();

			const width = Math.max(400, host.clientWidth);
			const height = Math.max(320, host.clientHeight || host.offsetHeight || 0);

			wordsEl.style.width = `${width}px`;
			wordsEl.style.height = `${height}px`;
			wordsEl.innerHTML = "";

			wordCloud(wordsEl, {
				list: WORD_LIST,
				weightFactor: (size: number) => Math.max(11, Math.round(size * (width / 900))),
				gridSize: Math.max(8, Math.round(width / 125)),
				backgroundColor: "rgba(0,0,0,0)",
				clearCanvas: true,
				rotateRatio: 0.2,
				minRotation: -Math.PI / 16,
				maxRotation: Math.PI / 16,
				rotationSteps: 2,
				shrinkToFit: true,
				drawOutOfBound: false,
				origin: [width / 2, height / 2],
				color: () => PALETTE[Math.floor(Math.random() * PALETTE.length)],
				fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
				shape: "circle",
				abortThreshold: 1500,
				minSize: 8,
			});

			// wordcloud2 renders asynchronously via internal setTimeout loops.
			// Wait long enough for all spans to be added to the DOM before we touch them.
			if (initTimer != null) window.clearTimeout(initTimer);
			initTimer = window.setTimeout(() => {
				if (cancelled) return;
				const wordEls = Array.from(wordsEl.querySelectorAll("span")).filter(
					(el): el is HTMLElement =>
						el instanceof HTMLElement && el.style.position === "absolute"
				);
				if (wordEls.length === 0) return;
				startRevealCycle(wordEls);
			}, 500);
		};

		const scheduleRender = () => {
			if (resizeTimer != null) window.clearTimeout(resizeTimer);
			clearReveal();
			resizeTimer = window.setTimeout(() => void renderCloud(), 220);
		};

		void renderCloud();

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(scheduleRender)
				: null;
		resizeObserver?.observe(host);
		window.addEventListener("resize", scheduleRender);

		return () => {
			cancelled = true;
			if (resizeTimer != null) window.clearTimeout(resizeTimer);
			if (initTimer != null) window.clearTimeout(initTimer);
			clearReveal();
			resizeObserver?.disconnect();
			wordCloud?.stop?.();
			window.removeEventListener("resize", scheduleRender);
		};
	}, []);

	return (
		<div className="tour-motion-bg relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-linear-to-br from-base-300 via-base-200 to-base-300 text-base-content [html[data-theme='dark']_&]:from-base-300 [html[data-theme='dark']_&]:via-base-300/90 [html[data-theme='dark']_&]:to-base-300">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_38%,oklch(var(--p)/0.2),transparent_45%),radial-gradient(ellipse_at_78%_44%,oklch(var(--s)/0.15),transparent_48%)]" />

			<section className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-1 flex-col items-center justify-center gap-12 px-[6vw] py-6 sm:gap-14 sm:py-8 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center lg:gap-x-[clamp(2rem,4vw,4rem)]">
				<div className="ambient-logo flex w-full max-w-xl shrink-0 flex-col justify-center lg:max-w-2xl lg:basis-[min(44%,620px)]">
					<div className="flex flex-col gap-5 sm:gap-6">
						<div className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-x-6">
							<Image
								src="/images/ode_logo_clean.svg"
								alt=""
								width={120}
								height={120}
								priority
								className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
							/>
							<h1 className="max-w-[16ch] text-[clamp(2rem,5.2vw,3.85rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white drop-shadow-[0_2px_24px_oklch(var(--p)/0.25)]">
								Ocean DNA Explorer
							</h1>
						</div>
						<p className="max-w-xl text-xl font-semibold leading-snug tracking-[-0.025em] text-base-content/92 sm:text-2xl xl:text-3xl">
							Unlock the potential of your eDNA data.
						</p>
						<p className="max-w-xl text-base leading-relaxed text-base-content/68 sm:text-lg xl:text-lg">
							Explore ocean biodiversity through projects, samples, taxonomies, metadata, and interactive visualizations.
						</p>
					</div>
				</div>

				<div className="ambient-cloud flex min-h-[min(72dvh,680px)] w-full min-w-0 flex-1 flex-col justify-center px-2 sm:min-h-[min(78dvh,760px)] lg:min-h-0">
					<div
						ref={cloudHostRef}
						className="flex h-[min(86dvh,920px)] w-full max-w-[min(100%,1100px)] items-center justify-center self-center lg:mx-auto"
					>
						<div
							ref={cloudWordsRef}
							className="ambient-wordcloud-vignette relative shrink-0"
							aria-label="Ambient features word cloud"
							role="img"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
