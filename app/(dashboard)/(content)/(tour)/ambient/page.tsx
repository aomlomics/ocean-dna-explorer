"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate, motion } from "framer-motion";

// [phrase, weight] — larger weight = bigger text in the cloud
const WORD_LIST: [string, number][] = [
	["Ocean eDNA exploration", 90],
	["Query the API", 84],
	["Complex search made easy", 80],
	["Visualization and analysis tools", 76],
	["Cross dataset analysis", 74],
	["Programmatic data access", 72],
	["Copy search as API query", 70],
	["FAIRe eDNA data standard", 68],
	["Darwin Core and MIxS aligned", 66],
	["Taxonomy sequence metadata connected", 64],
	["Search engine for ocean eDNA data", 62],
	["Build queries in the browser", 60],
	["Explore projects", 58],
	["Draw map shapes to filter eDNA data", 56],
	["Search results on the map", 54],
	["Compare fields across datasets", 52],
	["Alpha diversity plots", 51],
	["Taxonomy distribution plots", 50],
	["Metadata pattern plots", 49],
	["Featured organisms with real photos", 48],
	["Taxonomies with photos and profiles", 47],
	["IUCN status linked to taxonomy", 46],
	["Find assays by primers and targets", 45],
	["Filter and sort any data table", 44],
	["Search across related tables", 43],
	["Trace detections across linked data", 42],
	["Browse samples on the map", 41],
	["Compare projects", 40],
	["Compare analyses", 39],
	["Explore sampling environments", 38],
	["Environmental and sampling context", 37],
	["Taxonomic assignments in context", 36],
	["Metadata driven exploration", 34],
	["Multi table search engine", 33],
	["Advanced filtering workflows", 32],
	["API power without API friction", 30],
	["Direct API access in browser", 29],
	["No API key required", 28],
	["Query table relations", 27],
	["Explore database schema", 26],
	["Discover unique field values", 25],
	["Find values before querying", 25],
	["Project sample library and analysis linked", 24],
	["One project many analyses", 24],
	["Map filters converted to API", 24],
	["Complex OR and AND logic", 24],
	["Relation aware query building", 23],
	["From visual filter to JSON", 23],
	["Edit metadata later", 23],
	["Choose dataset visibility", 22],
	["Private first public when ready", 22],
	["Findable reusable metadata", 22],
	["Submit a new project", 21],
	["Submit a new analysis", 20],
	["Upload project sample metadata", 20],
	["Attach analyses to one project", 20],
	["Compare parameter choices", 20],
	["eDNA metabarcoding ready", 19],
	["ASV and taxonomy aware", 19],
	["Sample collection to bioinformatics", 19],
	["Control vocabularies supported", 19],
	["Upload explore transform eDNA data", 18],
	["Field level metadata guidance", 18],
	["User defined terms supported", 18],
	["TSV templates for submission", 18],
	["Explore data without sign in", 18],
	["Test API URLs in browser", 18],
	["Use Python and R examples", 18],
	["Open source support tooling", 17],
	["edna2obis workflow support", 17],
	["OBIS and GBIF compatible outputs", 16],
	["Shared structure across tools", 16],
	["Marine biodiversity data connections", 16],
	["Ocean data made easier to read", 16],
	["Supports faster eDNA research", 16],
	["Stakeholder friendly data views", 16],
	["Thoughtful UI for complex data", 16],
	["Explore detections by place and time", 16],
	["From field data to insight", 16],
];

// Time (ms) spent revealing words in each cycle.
const REVEAL_DURATION_MS = 23_000;
// Keep the full cloud visible (gently breathing) after reveal completes.
const HOLD_FULL_CLOUD_MS = 17_000;
// Words revealed per tick.
const BATCH_SIZE = 1;
// Keep typed reveal intentionally slow.
const TYPE_CHAR_MS = 85;
const MIN_REVEAL_STEP_MS = 1_100;
const CLOUD_FADE_OUT_MS = 900;

// Capping the font size keeps every getImageData() call small.
// potential memory leak if too large
const MAX_WORD_FONT_PX = 72;
// Hard ceiling on the canvas we hand to wordcloud2...same reasoning, this bounds
// the getImageData() allocation regardless of how large the screen gets.
const MAX_CLOUD_WIDTH_PX = 1240;
const MAX_CLOUD_HEIGHT_PX = 900;

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
		let initPollTimer: number | null = null;
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
			if (initPollTimer != null) {
				window.clearInterval(initPollTimer);
				initPollTimer = null;
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
			}, TYPE_CHAR_MS);
			typingTimers.add(timer);
		};

		const fadeOutCloud = async () => {
			if (cancelled) return;
			try {
				await animate(wordsEl, { opacity: [1, 0] }, { duration: CLOUD_FADE_OUT_MS / 1000, ease: [0.22, 1, 0.36, 1] }).finished;
			} catch {
				// Ignore animation cancellation during teardown.
			}
		};

		const startRevealCycle = (wordEls: HTMLElement[]) => {
			clearReveal();
			wordsEl.style.opacity = "1";

			// Shuffle so the pop-in order varies each cycle.
			const shuffled = [...wordEls].sort(() => Math.random() - 0.5);
			let idx = 0;
			const steps = Math.ceil(shuffled.length / BATCH_SIZE);
			const stepMs = Math.max(MIN_REVEAL_STEP_MS, Math.floor(REVEAL_DURATION_MS / steps));

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

			const longestWordChars = shuffled.reduce((maxChars, el) => {
				const fullText = el.dataset.ambientFullText ?? (el.textContent ?? "");
				return Math.max(maxChars, Array.from(fullText).length);
			}, 0);
			const revealDoneMs = stepMs * Math.max(1, steps) + longestWordChars * TYPE_CHAR_MS + 250;

			// Restart only after reveal has fully completed, then hold the full cloud.
			cycleTimer = window.setTimeout(() => {
				void (async () => {
					if (cancelled) return;
					await fadeOutCloud();
					if (cancelled) return;
					startRevealCycle(wordEls);
				})();
			}, revealDoneMs + HOLD_FULL_CLOUD_MS);
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
			// Wait for span count to stabilize so we do not start revealing before all
			// words are laid out.
			if (initTimer != null) window.clearTimeout(initTimer);
			if (initPollTimer != null) window.clearInterval(initPollTimer);
			initTimer = window.setTimeout(() => {
				if (cancelled) return;
				let previousCount = -1;
				let stableChecks = 0;
				const settleChecks = 5;
				const maxPollMs = 5_000;
				const pollStart = window.performance.now();

				initPollTimer = window.setInterval(() => {
					if (cancelled) return;
					const wordEls = Array.from(wordsEl.querySelectorAll("span")).filter(
						(el): el is HTMLElement =>
							el instanceof HTMLElement && el.style.position === "absolute"
					);
					const currentCount = wordEls.length;
					if (currentCount === 0) return;

					if (currentCount === previousCount) {
						stableChecks += 1;
					} else {
						previousCount = currentCount;
						stableChecks = 0;
					}

					const waitedMs = window.performance.now() - pollStart;
					if (stableChecks >= settleChecks || waitedMs >= maxPollMs) {
						if (initPollTimer != null) {
							window.clearInterval(initPollTimer);
							initPollTimer = null;
						}
						startRevealCycle(wordEls);
					}
				}, 140);
			}, 300);
		};

		const scheduleRender = () => {
			if (resizeTimer != null) window.clearTimeout(resizeTimer);
			clearReveal();
			resizeTimer = window.setTimeout(() => void renderCloud(), 220);
		};

		// Let the foreground intro motion complete before starting the word cloud
		// typing cycle so the sequence reads as: content slides in, then cloud animates.
		introTimer = window.setTimeout(() => void renderCloud(), 12_200);

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
			if (initPollTimer != null) window.clearInterval(initPollTimer);
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

			<section
				className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-1 flex-col items-center justify-center gap-12 px-[6vw] py-6 sm:gap-14 sm:py-8 lg:min-h-0 lg:flex-row lg:items-stretch lg:justify-center lg:gap-x-[clamp(2rem,4vw,4rem)]"
			>
				<motion.div
					className="ambient-logo flex w-full max-w-xl shrink-0 flex-col justify-center lg:max-w-[560px] lg:basis-[min(34%,560px)]"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
				>
					<div className="flex flex-col gap-5 sm:gap-6">
						<motion.div
							className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-x-6"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.1 }}
						>
							<motion.div
								initial={{ opacity: 0, x: -260, y: 42 }}
								animate={{ opacity: 1, x: 0, y: 0 }}
								transition={{ duration: 10.8, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
							>
								<Image
									src="/images/ode_logo_clean.svg"
									alt=""
									width={120}
									height={120}
									priority
									className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
								/>
							</motion.div>
							<motion.h1
								className="max-w-[16ch] text-[clamp(2rem,5.2vw,3.85rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white drop-shadow-[0_2px_24px_oklch(var(--p)/0.25)]"
								initial={{ opacity: 0, x: 250, y: -26 }}
								animate={{ opacity: 1, x: 0, y: 0 }}
								transition={{ duration: 12.2, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
							>
								Ocean DNA Explorer
							</motion.h1>
						</motion.div>
						<motion.div
							className="flex flex-col gap-5 sm:gap-6"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 1.2, delay: 0.2 }}
						>
							<motion.p
								className="max-w-xl text-xl font-semibold leading-snug tracking-[-0.025em] text-base-content/92 sm:text-2xl xl:text-3xl"
								initial={{ opacity: 0, x: -200, y: 56 }}
								animate={{ opacity: 1, x: 0, y: 0 }}
								transition={{ duration: 11.6, ease: [0.22, 1, 0.36, 1], delay: 0.72 }}
							>
								Unlock the potential of your eDNA data.
							</motion.p>
							<motion.p
								className="max-w-xl text-base leading-relaxed text-base-content/68 sm:text-lg xl:text-lg"
								initial={{ opacity: 0, x: 290, y: 38 }}
								animate={{ opacity: 1, x: 0, y: 0 }}
								transition={{ duration: 13.0, ease: [0.22, 1, 0.36, 1], delay: 1.05 }}
							>
								Explore ocean biodiversity through projects, samples, taxonomies, metadata, and interactive visualizations.
							</motion.p>
						</motion.div>
					</div>
				</motion.div>

				<div className="ambient-cloud flex min-h-[min(74dvh,760px)] w-full min-w-0 flex-1 flex-col justify-center px-1 sm:min-h-[min(80dvh,860px)] lg:min-h-0">
					<div
						ref={cloudHostRef}
						className="flex h-[min(84dvh,920px)] w-full max-w-[min(100%,1240px)] items-center justify-center self-center lg:mx-auto"
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
