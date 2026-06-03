"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AmbientPage from "./ambient/page";
import SponsorsPage from "./sponsors/page";
import ShowcaseClient from "./showcase/ShowcaseClient";
import type { ProjectBundle } from "./showcase/data";

type TourMode = "ambient" | "sponsors" | "showcase";

const TOUR_SEQUENCE: { mode: TourMode; durationMs?: number }[] = [
	{ mode: "ambient", durationMs: 18000 },
	{ mode: "sponsors", durationMs: 12000 },
	{ mode: "showcase" }
];

const PREMIUM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function TourController({
	projects,
	projectDurationMs
}: {
	projects: ProjectBundle[];
	projectDurationMs: number;
}) {
	const [sequenceIndex, setSequenceIndex] = useState(0);
	const current = TOUR_SEQUENCE[sequenceIndex];
	const currentDurationMs =
		current.durationMs ?? projectDurationMs * Math.max(1, Math.min(projects.length, 3));

	useEffect(() => {
		const id = window.setTimeout(() => {
			setSequenceIndex((i) => (i + 1) % TOUR_SEQUENCE.length);
		}, currentDurationMs);
		return () => window.clearTimeout(id);
	}, [currentDurationMs]);

	return (
		<div className="tour-motion-bg relative min-h-screen w-screen overflow-hidden bg-linear-to-b from-base-300 via-base-200 to-base-300 text-base-content [html[data-theme='dark']_&]:from-base-300 [html[data-theme='dark']_&]:via-base-300/90 [html[data-theme='dark']_&]:to-base-300">
			{/* Persistent ambiance that lives behind every tour page. Because this
			    layer never unmounts, the brief moment where one page has faded out
			    and the next has not yet faded in shows this shared background
			    instead of a bare base color — which is what used to read as a
			    "flash"/glitch when switching between tour pages. */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,oklch(var(--p)/0.16),transparent_46%),radial-gradient(ellipse_at_80%_46%,oklch(var(--s)/0.13),transparent_48%)]" />

			<AnimatePresence mode="wait">
				<motion.div
					key={current.mode}
					className="absolute inset-0"
					initial={{ opacity: 0, x: 80, scale: 0.985, filter: "blur(8px)" }}
					animate={{
						opacity: 1,
						x: 0,
						scale: 1,
						filter: "blur(0px)",
						transition: { duration: 1, ease: PREMIUM_EASE }
					}}
					exit={{
						opacity: 0,
						x: -80,
						scale: 1.01,
						filter: "blur(7px)",
						transition: { duration: 0.78, ease: PREMIUM_EASE }
					}}
				>
					{current.mode === "ambient" ? (
						<AmbientPage />
					) : current.mode === "sponsors" ? (
						<SponsorsPage />
					) : (
						<ShowcaseClient projects={projects} projectDurationMs={projectDurationMs} />
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
