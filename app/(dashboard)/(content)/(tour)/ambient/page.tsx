"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
	"Drill into detections (occurrences)",
	"Trace a detection to its feature (ASV)",
	"See taxonomic assignments instantly",
	"Navigate the taxonomy tree",
	"Explore analyses and pipelines",
	"Compare target genes (COI, 18S, 12S)",
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

type Placement = {
	top: string;
	left: string;
};

function mulberry32(seed: number) {
	return function () {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const PLACEMENTS: Placement[] = [
	{ top: "9%", left: "56%" },
	{ top: "14%", left: "74%" },
	{ top: "10%", left: "90%" },
	{ top: "27%", left: "63%" },
	{ top: "31%", left: "84%" },
	{ top: "43%", left: "56%" },
	{ top: "46%", left: "75%" },
	{ top: "52%", left: "92%" },
	{ top: "63%", left: "61%" },
	{ top: "68%", left: "80%" },
	{ top: "78%", left: "55%" },
	{ top: "84%", left: "74%" },
	{ top: "86%", left: "91%" }
];

const ACTIVE_WORD_COUNT = 10;
const ROTATE_MS = 1750;

type ActiveWord = {
	slotIndex: number;
	phraseIndex: number;
	nonce: number;
	duration: string;
};

export default function AmbientPage() {
	const [activeWords, setActiveWords] = useState<ActiveWord[]>([]);
	const seededRand = useMemo(() => mulberry32(20260424), []);

	useEffect(() => {
		const chosen = new Set<number>();
		const initial: ActiveWord[] = [];
		for (let slot = 0; slot < ACTIVE_WORD_COUNT; slot++) {
			let phraseIndex = Math.floor(seededRand() * AMBIENT_PHRASES.length);
			while (chosen.has(phraseIndex)) {
				phraseIndex = Math.floor(seededRand() * AMBIENT_PHRASES.length);
			}
			chosen.add(phraseIndex);
			initial.push({
				slotIndex: slot,
				phraseIndex,
				nonce: 0,
				duration: `${7.5 + seededRand() * 4.5}s`
			});
		}
		setActiveWords(initial);
	}, [seededRand]);

	useEffect(() => {
		if (!activeWords.length) return;
		const id = window.setInterval(() => {
			setActiveWords((current) => {
				if (!current.length) return current;
				const next = [...current];
				const target = Math.floor(Math.random() * next.length);
				const used = new Set(next.map((w) => w.phraseIndex));
				used.delete(next[target].phraseIndex);
				const candidates: number[] = [];
				for (let i = 0; i < AMBIENT_PHRASES.length; i++) {
					if (!used.has(i)) candidates.push(i);
				}
				if (!candidates.length) return current;
				const phraseIndex = candidates[Math.floor(Math.random() * candidates.length)];
				next[target] = {
					...next[target],
					phraseIndex,
					nonce: next[target].nonce + 1,
					duration: `${7.5 + Math.random() * 4.5}s`
				};
				return next;
			});
		}, ROTATE_MS);
		return () => window.clearInterval(id);
	}, [activeWords.length]);

	return (
		<div className="tour-motion-bg relative isolate min-h-screen w-full overflow-hidden bg-base-200 [html[data-theme='dark']_&]:bg-base-300/50">

			<div className="relative z-10 flex items-start pt-[8vh] pl-[5vw] md:pt-[10vh] md:pl-[8vw]">
				<div className="ambient-logo">
					<Image
						src="/images/node_logo_light_mode.svg"
						alt="Ocean DNA Explorer"
						width={530}
						height={184}
						priority
						className="h-auto w-[min(54vw,530px)] [html[data-theme='dark']_&]:hidden"
					/>
					<Image
						src="/images/node_logo_dark_mode.svg"
						alt="Ocean DNA Explorer"
						width={530}
						height={184}
						priority
						className="hidden h-auto w-[min(54vw,530px)] [html[data-theme='dark']_&]:block"
					/>
				</div>
			</div>

			<div className="pointer-events-none absolute inset-0 z-10">
				<div className="ambient-random-wrap">
					{activeWords.map((word) => {
						const slot = PLACEMENTS[word.slotIndex];
						const phrase = AMBIENT_PHRASES[word.phraseIndex];
						return (
							<span
								key={`${word.slotIndex}-${word.nonce}`}
								className="ambient-random-word text-[0.72rem] md:text-[0.83rem]"
								style={{
									top: slot.top,
									left: slot.left,
									animationDuration: word.duration
								}}
							>
								{phrase}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}
