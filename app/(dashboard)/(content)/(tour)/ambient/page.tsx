"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
const REVEAL_DURATION_MS = 23_000;
// Keep the full cloud visible (gently breathing) after reveal completes.
const HOLD_FULL_CLOUD_MS = 13_000;
// Words revealed per tick.
const BATCH_SIZE = 1;

// Capping the font size keeps every getImageData() call small.
// potential memory leak if too large
const MAX_WORD_FONT_PX = 72;
// Hard ceiling on the canvas we hand to wordcloud2...same reasoning, this bounds
// the getImageData() allocation regardless of how large the screen gets.
const MAX_CLOUD_WIDTH_PX = 1480;
const MAX_CLOUD_HEIGHT_PX = 1050;

// The raw weights in WORD_LIST span a wide range (16–90). Feeding raw, unbounded
// weights straight into wordcloud2 is what provokes the crash above, so we first
// squash them into a narrow, predictable band. This is the "normalize the
// weights" workaround the library author and others recommend on the crash thread.
const NORMALIZED_MIN_WEIGHT = 12;
const NORMALIZED_MAX_WEIGHT = 50;
const RAW_WEIGHTS = WORD_LIST.map(([, weight]) => weight);
const RAW_MIN_WEIGHT = Math.min(...RAW_WEIGHTS);
const RAW_MAX_WEIGHT = Math.max(...RAW_WEIGHTS);

function normalizeWeight(raw: number): number {
	if (RAW_MAX_WEIGHT === RAW_MIN_WEIGHT) return NORMALIZED_MAX_WEIGHT;
	const t = (raw - RAW_MIN_WEIGHT) / (RAW_MAX_WEIGHT - RAW_MIN_WEIGHT);
	return NORMALIZED_MIN_WEIGHT + t * (NORMALIZED_MAX_WEIGHT - NORMALIZED_MIN_WEIGHT);
}

const NORMALIZED_WORD_LIST: [string, number][] = WORD_LIST.map(([word, weight]) => [word, normalizeWeight(weight)]);

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
		let introTimer: number | null = null;
		const typingTimers = new Set<number>();

		const clearTypingTimers = () => {
			typingTimers.forEach((id) => window.clearInterval(id));
			typingTimers.clear();
		};

		const clearReveal = () => {
			if (revealTimer != null) {
				window.clearInterval(revealTimer);
				revealTimer = null;
			}
			if (cycleTimer != null) {
				window.clearTimeout(cycleTimer);
				cycleTimer = null;
			}
			clearTypingTimers();
		};

		const typeInWord = (el: HTMLElement) => {
			const fullText = el.dataset.ambientFullText ?? (el.textContent ?? "");
			el.dataset.ambientFullText = fullText;
			el.textContent = "";
			el.style.transition = "none";
			el.style.opacity = "1";
			if (!fullText) return;

			const chars = Array.from(fullText);
			let charIdx = 0;
			const charMs = 55;
			const timer = window.setInterval(() => {
				if (cancelled) return;
				charIdx += 1;
				el.textContent = chars.slice(0, charIdx).join("");
				if (charIdx >= chars.length) {
					window.clearInterval(timer);
					typingTimers.delete(timer);
					// Once a word is fully typed, let it breathe. Randomized delay
					// and duration keep neighbouring words out-of-phase, so the
					// cloud feels alive instead of pulsing in unison. The animation
					// uses the independent `translate`/`scale` CSS properties (not
					// `transform`), so it composes with the `transform: rotate(...)`
					// wordcloud2 sets on some words rather than overriding it.
					el.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
					el.style.animationDuration = `${(5.5 + Math.random() * 3).toFixed(2)}s`;
					el.classList.add("ambient-word-breathe");
				}
			}, charMs);
			typingTimers.add(timer);
		};

		const startRevealCycle = (wordEls: HTMLElement[]) => {
			clearReveal();

			// Shuffle so the pop-in order varies each cycle.
			const shuffled = [...wordEls].sort(() => Math.random() - 0.5);
			let idx = 0;
			const steps = Math.ceil(shuffled.length / BATCH_SIZE);
			const stepMs = Math.max(1600, Math.floor(REVEAL_DURATION_MS / steps));

			// Hide all words instantly (no transition so there's no visible flash).
			shuffled.forEach((el) => {
				const fullText = el.dataset.ambientFullText ?? (el.textContent ?? "");
				el.dataset.ambientFullText = fullText;
				el.textContent = fullText;
				el.style.transition = "none";
				el.style.opacity = "0";
				// Drop any breathing animation from the previous cycle so words
				// don't keep drifting while they're hidden and waiting to retype.
				el.classList.remove("ambient-word-breathe");
				el.style.removeProperty("animation-delay");
				el.style.removeProperty("animation-duration");
			});

			// Every word is now hidden, so it's finally safe to reveal the
			// container without flashing the fully-assembled cloud.
			wordsEl.style.visibility = "visible";

			// After the browser commits the hide, begin typed reveals (no fade transition).
			window.requestAnimationFrame(() => {
				if (cancelled) return;

				revealTimer = window.setInterval(() => {
					if (cancelled) return;
					for (let i = 0; i < BATCH_SIZE && idx < shuffled.length; i++, idx++) {
						typeInWord(shuffled[idx]);
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

			const width = Math.min(MAX_CLOUD_WIDTH_PX, Math.max(400, host.clientWidth));
			const height = Math.min(MAX_CLOUD_HEIGHT_PX, Math.max(320, host.clientHeight || host.offsetHeight || 0));

			wordsEl.style.width = `${width}px`;
			wordsEl.style.height = `${height}px`;
			wordsEl.innerHTML = "";
			// Keep the freshly-laid-out cloud hidden until startRevealCycle has
			// hidden every individual word. Otherwise the fully-assembled cloud
			// flashes on screen for a moment before the typed reveal begins.
			wordsEl.style.visibility = "hidden";

			wordCloud(wordsEl, {
				list: NORMALIZED_WORD_LIST,
				weightFactor: (size: number) =>
					Math.max(11, Math.min(MAX_WORD_FONT_PX, Math.round(size * (width / 900)))),
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

		// Let the foreground intro motion complete before starting the word cloud
		// typing cycle so the sequence reads as: content slides in, then cloud animates.
		introTimer = window.setTimeout(() => void renderCloud(), 1700);

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
			if (introTimer != null) window.clearTimeout(introTimer);
			clearReveal();
			resizeObserver?.disconnect();
			wordCloud?.stop?.();
			window.removeEventListener("resize", scheduleRender);
		};
	}, []);

	return (
		<div className="tour-motion-bg relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-linear-to-br from-base-300 via-base-200 to-base-300 text-base-content [html[data-theme='dark']_&]:from-base-300 [html[data-theme='dark']_&]:via-base-300/90 [html[data-theme='dark']_&]:to-base-300">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_38%,oklch(var(--p)/0.2),transparent_45%),radial-gradient(ellipse_at_78%_44%,oklch(var(--s)/0.15),transparent_48%)]" />

			<motion.section
				className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-1 flex-col items-center justify-center gap-12 px-[6vw] py-6 sm:gap-14 sm:py-8 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center lg:gap-x-[clamp(2rem,4vw,4rem)]"
				initial={{ opacity: 0, x: 120, y: 20 }}
				animate={{ opacity: 1, x: 0, y: 0 }}
				transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
			>
				<div className="ambient-logo flex w-full max-w-xl shrink-0 flex-col justify-center lg:max-w-[560px] lg:basis-[min(34%,560px)]">
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

				<div className="ambient-cloud flex min-h-[min(82dvh,860px)] w-full min-w-0 flex-1 flex-col justify-center px-1 sm:min-h-[min(88dvh,980px)] lg:min-h-0">
					<div
						ref={cloudHostRef}
						className="flex h-[min(93dvh,1080px)] w-full max-w-[min(100%,1480px)] items-center justify-center self-center lg:mx-auto"
					>
						<div
							ref={cloudWordsRef}
							className="ambient-wordcloud-vignette relative shrink-0"
							aria-label="Ambient features word cloud"
							role="img"
						/>
					</div>
				</div>
			</motion.section>
		</div>
	);
}
