"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";

const AMBIENT_PHRASES = [
	"Query the API",
	"Build complex Searches",
	"Build custom figures",
	"Programmatic data access",
	"Taxonomies unlocked",
	"Learn about eDNA",
	"Use custom map tools",
	"FAIR eDNA Data",
	"Explore projects",
	"Browse samples on the map",
	"Drill into detections",
	"Trace a detection to its feature",
	"See taxonomic assignments instantly",
	"Navigate the taxonomy tree",
	"Explore analyses and pipelines",
	"Compare target genes",
	"Find assays by primers + targets",
	"Filter and sort any data table",
	"Search within columns",
	"Open any record for full details",
	"Visualize metadata patterns",
	"Visualize taxonomy distributions",
	"Compare projects side-by-side",
	"Compare analyses across datasets",
	"Explore sampling environments",
	"Check temporal coverage",
	"Explore depth coverage",
	"Spot metadata gaps fast",
	"Meet featured organisms",
	"Discover Life Across ODE",
	"Submit a new project",
	"Submit a new analysis",
	"Tag datasets for discovery",
	"Choose dataset visibility",
	"Edit metadata later",
	"Use the API endpoints",
	"Search and filter via API",
	"Explore the database schema",
	"Learn eDNA 101",
	"Explore eDNA's impact",
	"Make your own discoveries"
];

type WordCloudRenderer = (
	element: HTMLCanvasElement | HTMLElement,
	options: {
		list: [string, number][];
		weightFactor: (size: number) => number;
		gridSize: number;
		backgroundColor: string;
		clearCanvas: boolean;
		rotateRatio: number;
		minRotation: number;
		maxRotation: number;
		rotationSteps: number;
		shrinkToFit: boolean;
		drawOutOfBound: boolean;
		origin: [number, number];
		color: () => string;
		fontFamily: string;
		shape?: string;
		abortThreshold?: number;
		minSize?: number;
	}
) => void;

type WordCloudModule = WordCloudRenderer & { stop?: () => void };

export default function AmbientPage() {
	const cloudHostRef = useRef<HTMLDivElement | null>(null);
	const cloudWordsRef = useRef<HTMLDivElement | null>(null);

	const weightedWords = useMemo<[string, number][]>(() => {
		// Wide weight gaps → visible size tiers; hero lines stay much larger than the long tail.
		const FEATURE_WEIGHTS: Record<string, number> = {
			"Query the API": 120,
			"FAIR eDNA Data": 98,
			"Build complex Searches": 82,
			"Learn about eDNA": 64,
			"Build custom figures": 62,
		};

		const n = AMBIENT_PHRASES.length;
		const seen = new Set<string>();
		const uniqueOnly: [string, number][] = [];

		for (let index = 0; index < n; index++) {
			const phrase = AMBIENT_PHRASES[index];
			const key = phrase.trim();
			if (!key || seen.has(key)) continue;
			seen.add(key);

			const featured = FEATURE_WEIGHTS[key];
			if (featured != null) {
				uniqueOnly.push([phrase, featured]);
				continue;
			}

			const t = index / Math.max(1, n - 1);
			const rankBias = Math.pow(1 - t, 0.62);
			const base = 5 + rankBias * 36;
			const jitter =
				((index * 47) % 14) * 1.35 +
				((index * 29) % 9) * 1.2 +
				((index * 13) % 7) * 0.85 +
				((index * 59) % 6);
			const weight = Math.min(52, base + jitter);
			uniqueOnly.push([phrase, Math.max(4, Math.round(weight * 10) / 10)]);
		}

		return uniqueOnly;
	}, []);

	useEffect(() => {
		const host = cloudHostRef.current;
		const wordsEl = cloudWordsRef.current;
		if (!host || !wordsEl) return;

		let cancelled = false;
		let resizeTimer: number | null = null;
		let wordCloud: WordCloudModule | null = null;

		const loadWordCloud = async () => {
			if (wordCloud) return wordCloud;
			// wordcloud2.js does not ship TypeScript types in this project.
			// @ts-expect-error runtime import is valid in the browser.
			const module = await import("wordcloud");
			wordCloud = (module.default ?? module) as unknown as WordCloudModule;
			return wordCloud;
		};

		const renderCloud = async () => {
			if (cancelled) return;
			const WordCloud = await loadWordCloud();
			if (cancelled) return;

			const width = Math.max(400, Math.floor(host.clientWidth));
			const availHeight = Math.max(
				320,
				Math.floor(host.clientHeight || host.offsetHeight || 0)
			);
			// Use the full host height so the cloud fills the right column (width-based caps made it feel tiny).
			const height = availHeight;

			wordsEl.style.width = `${width}px`;
			wordsEl.style.height = `${height}px`;
			wordsEl.innerHTML = "";

			WordCloud.stop?.();

			WordCloud(wordsEl, {
				list: weightedWords,
				weightFactor: (size) => Math.max(11, Math.round(size * (width / 900))),
				gridSize: Math.max(8, Math.round(width / 125)),
				backgroundColor: "rgba(0, 0, 0, 0)",
				clearCanvas: true,
				rotateRatio: 0.2,
				minRotation: -Math.PI / 16,
				maxRotation: Math.PI / 16,
				rotationSteps: 2,
				shrinkToFit: true,
				drawOutOfBound: false,
				origin: [width / 2, height / 2],
				color: () => {
					const palette = [
						"rgba(255,255,255,0.92)",
						"rgba(207,250,254,0.9)",
						"rgba(125,211,252,0.88)",
						"rgba(147,197,253,0.9)"
					];
					return palette[Math.floor(Math.random() * palette.length)];
				},
				fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
				// Circle keeps visual mass centered; cardioid skews toward one side inside the canvas.
				shape: "circle",
				abortThreshold: 1500,
				minSize: 8
			});

			const applyWordStyles = () => {
				if (cancelled) return;
				// wordcloud2 puts each phrase in a positioned span; nested spans can exist for wrapping.
				// Animating only `position: absolute` roots (or top-level spans as fallback) ensures every word gets one breath, not skipped inner/outer nodes.
				const candidates = Array.from(wordsEl.querySelectorAll("span")).filter(
					(n): n is HTMLElement => n instanceof HTMLElement
				);
				let wordEls = candidates.filter((n) => n.style.position === "absolute");
				if (wordEls.length === 0) {
					wordEls = Array.from(wordsEl.querySelectorAll(":scope > span")).filter(
						(n): n is HTMLElement => n instanceof HTMLElement
					);
				}
				if (wordEls.length === 0) {
					wordEls = candidates;
				}

				const wr = wordsEl.getBoundingClientRect();
				const cx = wr.width / 2;
				const cy = wr.height / 2;
				const maxR = Math.hypot(cx, cy) * 0.94;

				wordEls.forEach((el, index) => {
					el.classList.add("ambient-wordcloud-word");
					el.style.removeProperty("opacity");

					const duration = 2.35 + (((index * 19 + (index % 11) * 23) % 56) / 10); // ~2.35s–7.95s
					const delay =
						(((index * 0.618033988749895) % 1) +
							(index % 13) * 0.37 +
							((index * 7) % 5) * 0.21) %
						8.2;
					el.style.animationDuration = `${duration.toFixed(2)}s`;
					el.style.animationDelay = `-${delay.toFixed(2)}s`;

					const br = el.getBoundingClientRect();
					const sx = br.left - wr.left + br.width / 2;
					const sy = br.top - wr.top + br.height / 2;
					const d = Math.hypot(sx - cx, sy - cy);
					const t = Math.min(1, d / maxR);
					const radial = Math.max(0.3, 1 - t * 0.62);
					const baseNum = 0.45 + 0.55 * radial;
					const minBreath = 0.24;
					const lowNum = Math.max(0.14, baseNum - minBreath);

					el.style.setProperty("--ambient-op-base", baseNum.toFixed(3));
					el.style.setProperty("--ambient-op-low", lowNum.toFixed(3));
				});
			};

			window.requestAnimationFrame(() => {
				if (cancelled) return;
				window.requestAnimationFrame(applyWordStyles);
			});
		};

		const scheduleRender = () => {
			if (resizeTimer) window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(() => {
				void renderCloud();
			}, 220);
		};

		void renderCloud();

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => {
						scheduleRender();
				  })
				: null;
		resizeObserver?.observe(host);

		window.addEventListener("resize", scheduleRender);

		return () => {
			cancelled = true;
			if (resizeTimer) window.clearTimeout(resizeTimer);
			resizeObserver?.disconnect();
			wordCloud?.stop?.();
			window.removeEventListener("resize", scheduleRender);
		};
	}, [weightedWords]);

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
							<h1 className="max-w-[16ch] text-[clamp(2rem,5.2vw,3.85rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-primary drop-shadow-[0_2px_24px_oklch(var(--p)/0.25)]">
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
