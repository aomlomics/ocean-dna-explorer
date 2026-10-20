"use client";

import DashCard from "@/app/components/dataSummary/DashCard";
import { AnalysisIcon, ProjectIcon } from "@/app/components/icons";
import { useRef, useState, type ReactNode } from "react";

export type SubmissionEntry = {
	kind: "project" | "analysis";
	dateLabel: string;
	dateTime: string;
	card: ReactNode;
};

export default function SubmissionPager({
	initial,
	total,
	loadAt
}: {
	initial: SubmissionEntry;
	total: number;
	loadAt: (offset: number) => Promise<SubmissionEntry | null>;
}) {
	const [index, setIndex] = useState(0);
	const [entries, setEntries] = useState<SubmissionEntry[]>([initial]);
	const [count, setCount] = useState(total);
	const [pending, setPending] = useState(false);
	const pendingRef = useRef(false);
	const entry = entries[index] ?? initial;
	const label = entry.kind === "project" ? "Projects" : "Analyses";

	async function showOffset(nextIndex: number) {
		if (pendingRef.current || nextIndex < 0 || nextIndex >= count) return;
		const cached = entries[nextIndex];
		if (cached) {
			setIndex(nextIndex);
			return;
		}

		pendingRef.current = true;
		setPending(true);
		try {
			const loaded = await loadAt(nextIndex);
			if (!loaded) {
				setCount(nextIndex);
				return;
			}
			setEntries((current) => {
				const copy = current.slice();
				copy[nextIndex] = loaded;
				return copy;
			});
			setIndex(nextIndex);
		} finally {
			pendingRef.current = false;
			setPending(false);
		}
	}

	return (
		<div className="flex h-full w-full flex-col">
			<div className="mb-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
				<span className="inline-flex size-8 shrink-0 items-center justify-center text-primary" aria-hidden="true">
					{entry.kind === "project" ? (
						<ProjectIcon className="size-8! h-8! w-8!" />
					) : (
						<AnalysisIcon className="size-8! h-8! w-8!" />
					)}
				</span>
				<span className="inline-flex items-baseline gap-2 whitespace-nowrap">
					<h3 className="m-0 text-xl font-semibold leading-none text-base-content">{label}</h3>
					<time
						dateTime={entry.dateTime}
						title={`Submitted ${entry.dateLabel}`}
						className="text-xl font-semibold leading-none text-base-content tabular-nums whitespace-nowrap"
					>
						{entry.dateLabel}
					</time>
				</span>
				{count > 1 ? (
					<PagerControls index={index} count={count} kind={entry.kind} pending={pending} onOffset={showOffset} />
				) : null}
			</div>
			<DashCard padding="none" className="h-full flex-1" bodyClassName="flex flex-col">
				<div key={index} className="flex h-full flex-1 flex-col">
					{entry.card}
				</div>
			</DashCard>
		</div>
	);
}

function PagerControls({
	index,
	count,
	kind,
	pending,
	onOffset
}: {
	index: number;
	count: number;
	kind: SubmissionEntry["kind"];
	pending: boolean;
	onOffset: (offset: number) => void;
}) {
	const noun = kind === "project" ? "project" : "analysis";

	return (
		<div className="inline-flex items-center" role="group" aria-label={`Recent ${noun} submissions`} aria-busy={pending}>
			<button
				type="button"
				onClick={() => onOffset(index - 1)}
				disabled={index === 0 || pending}
				aria-label={`Newer ${noun}`}
				className="inline-flex items-center justify-center p-0.5 text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:text-base-content/25"
			>
				<Chevron direction="left" />
			</button>
			<span className="px-0.5 text-sm font-semibold leading-none tabular-nums text-base-content" aria-live="polite">
				{pending ? (
					<span className="loading loading-spinner loading-xs text-primary" aria-label="Loading submission" />
				) : (
					`${index + 1}/${count}`
				)}
			</span>
			<button
				type="button"
				onClick={() => onOffset(index + 1)}
				disabled={index >= count - 1 || pending}
				aria-label={`Older ${noun}`}
				className="inline-flex items-center justify-center p-0.5 text-primary transition-colors hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:text-base-content/25"
			>
				<Chevron direction="right" />
			</button>
		</div>
	);
}

function Chevron({ direction }: { direction: "left" | "right" }) {
	return (
		<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
			/>
		</svg>
	);
}

