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
		<div className="relative min-h-screen w-screen overflow-hidden bg-base-200 text-base-content [html[data-theme='dark']_&]:bg-base-300/50">
			<AnimatePresence mode="wait">
				<motion.div
					key={current.mode}
					className="absolute inset-0"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8, ease: PREMIUM_EASE }}
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
