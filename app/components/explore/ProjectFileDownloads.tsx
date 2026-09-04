"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import InfoButton from "@/app/components/InfoButton";
import { AnalysisIcon } from "@/app/components/icons";
import { exploreUrl } from "@/types/tableMetadata";
import type { Analysis } from "@/app/generated/prisma/client";

export type DownloadFile = {
	label: string;
	href: string;
};

export type AnalysisDownloadBundle = {
	analysis_run_name: string;
	files: DownloadFile[];
};

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
	return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

async function downloadUrls(urls: string[]) {
	const hrefs = urls.filter(Boolean);
	for (let i = 0; i < hrefs.length; i++) {
		const a = document.createElement("a");
		a.href = hrefs[i]!;
		a.rel = "noreferrer";
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		a.remove();
		if (i < hrefs.length - 1) {
			await new Promise((r) => setTimeout(r, 350));
		}
	}
}

function FileDownloadIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="h-8 w-8 shrink-0 text-primary"
			aria-hidden="true"
		>
			<path
				d="M9.59999 13.9105L11.9457 16.2426L14.4 13.8M11.9457 16.2426V10.2426M2.40093 17.541L2.40102 8.41673C2.40102 7.50281 2.40068 6.20108 2.40039 5.25853C2.40019 4.59561 2.93752 4.05884 3.60044 4.05884H9.31865L12.0837 7.01247H20.4C21.0627 7.01247 21.6 7.54976 21.6 8.21251L21.5997 17.5412C21.5996 18.8666 20.5251 19.9411 19.1997 19.9411L4.80092 19.9411C3.47543 19.9411 2.40091 18.8665 2.40093 17.541Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

const downloadBtnClass =
	"inline-flex items-center gap-3 bg-base-200 px-4 py-2 text-left transition-colors hover:bg-base-300 disabled:cursor-not-allowed";

function DownloadButtonLabel({ title, sizeLabel }: { title: string; sizeLabel: string | null }) {
	return (
		<span className="flex min-w-0 flex-col items-start gap-0.5 leading-tight">
			<span className="text-base font-normal text-base-content">{title}</span>
			{/* Reserve size row so buttons don’t jump if a size is missing */}
			<span className="flex min-h-5 min-w-19 items-center text-sm font-sans font-medium uppercase tracking-wider text-base-content/70 whitespace-nowrap">
				<span className={sizeLabel ? undefined : "invisible"}>{sizeLabel ?? "0 B"}</span>
			</span>
		</span>
	);
}

export default function ProjectFileDownloads({
	project_id,
	metadataFiles,
	analyses,
	sizeByUrl
}: {
	project_id: Analysis["project_id"];
	metadataFiles: DownloadFile[];
	analyses: AnalysisDownloadBundle[];
	sizeByUrl: Record<string, number | null>;
}) {
	const [metaBusy, setMetaBusy] = useState(false);
	const [analysisBusy, setAnalysisBusy] = useState(false);
	const [showAnalysisPicker, setShowAnalysisPicker] = useState(false);
	const [pickerStyle, setPickerStyle] = useState<CSSProperties | null>(null);
	const splitBtnRef = useRef<HTMLDivElement | null>(null);
	const pickerRef = useRef<HTMLDivElement | null>(null);
	const selectAllRef = useRef<HTMLInputElement | null>(null);
	const [selected, setSelected] = useState<Record<string, boolean>>(() =>
		Object.fromEntries(analyses.map((a) => [a.analysis_run_name, true]))
	);

	const metadataUrls = useMemo(() => metadataFiles.map((f) => f.href).filter(Boolean), [metadataFiles]);

	const selectedAnalyses = analyses.filter((a) => selected[a.analysis_run_name]);
	const selectedCount = selectedAnalyses.length;
	const selectedAnalysisUrls = selectedAnalyses.flatMap((a) => a.files.map((f) => f.href).filter(Boolean));
	const allSelected = analyses.length > 0 && selectedCount === analyses.length;
	const noneSelected = selectedCount === 0;

	function sizeLabel(urls: string[]) {
		let total = 0;
		let known = 0;
		for (const url of urls) {
			const n = sizeByUrl[url];
			if (typeof n === "number") {
				total += n;
				known += 1;
			}
		}
		if (known === 0) return null;
		const approx = known < urls.length ? "~" : "";
		return `${approx}${formatBytes(total)}`;
	}

	const metadataSizeLabel = sizeLabel(metadataUrls);
	const analysisSizeLabel = sizeLabel(selectedAnalysisUrls);
	const analysisButtonLabel = analysisBusy
		? "Downloading…"
		: selectedCount === 1
			? "Download 1 analysis"
			: `Download ${selectedCount} analyses`;

	const placePicker = () => {
		if (!splitBtnRef.current) return null;
		const rect = splitBtnRef.current.getBoundingClientRect();
		const rightBound = window.innerWidth - 16;
		const left = rect.left;
		return {
			position: "fixed" as const,
			top: rect.bottom - 1,
			left,
			width: Math.min(Math.max(rect.width + 140, 480), rightBound - left),
			zIndex: "var(--z-popover)"
		};
	};

	function togglePicker() {
		if (showAnalysisPicker) {
			setShowAnalysisPicker(false);
			setPickerStyle(null);
		} else {
			setPickerStyle(placePicker());
			setShowAnalysisPicker(true);
		}
	}

	useLayoutEffect(() => {
		if (selectAllRef.current) {
			selectAllRef.current.indeterminate = !allSelected && !noneSelected;
		}
	}, [allSelected, noneSelected, showAnalysisPicker]);

	useEffect(() => {
		if (!showAnalysisPicker) return;
		const update = () => setPickerStyle(placePicker());
		const onPointerDown = (e: MouseEvent) => {
			const t = e.target as Node;
			if (pickerRef.current?.contains(t) || splitBtnRef.current?.contains(t)) return;
			setShowAnalysisPicker(false);
			setPickerStyle(null);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setShowAnalysisPicker(false);
				setPickerStyle(null);
			}
		};
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [showAnalysisPicker]);

	async function onDownloadMetadata() {
		if (metaBusy || metadataUrls.length === 0) return;
		setMetaBusy(true);
		try {
			await downloadUrls(metadataUrls);
		} finally {
			setMetaBusy(false);
		}
	}

	async function onDownloadAnalysis() {
		if (analysisBusy || noneSelected) return;
		setAnalysisBusy(true);
		try {
			await downloadUrls(selectedAnalysisUrls);
		} finally {
			setAnalysisBusy(false);
		}
	}

	const downloadsInfo = (
		<div className="space-y-2">
			<div className="text-sm font-semibold text-base-content">What you can download</div>
			<p className="text-xs leading-relaxed text-base-content">
				<strong>Metadata:</strong> projectMetadata, sampleMetadata, and libraryMetadata.
			</p>
			<p className="text-xs leading-relaxed text-base-content">
				<strong>Analyses:</strong> for each selected analysis: analysisMetadata, ASV / taxa features, and the abundance
				table (3 files each). Use the chevron to choose analyses.
			</p>
		</div>
	);

	const picker =
		showAnalysisPicker && pickerStyle
			? createPortal(
					<div
						ref={pickerRef}
						id="analysis-download-picker"
						role="group"
						aria-label="Choose analyses to download"
						className="overflow-hidden rounded-b-xl rounded-t-none bg-base-300 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.45)]"
						style={pickerStyle}
					>
						<div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
							<label className="flex min-w-0 cursor-pointer items-center gap-3 text-base text-base-content/70">
								<input
									ref={selectAllRef}
									type="checkbox"
									className="checkbox checkbox-primary checkbox-sm"
									checked={allSelected}
									onChange={(e) =>
										setSelected(Object.fromEntries(analyses.map((a) => [a.analysis_run_name, e.target.checked])))
									}
								/>
								<span>Select all ({analyses.length})</span>
							</label>
							<span className="shrink-0 text-primary" aria-hidden>
								<AnalysisIcon className="h-9! w-9!" />
							</span>
						</div>
						<ul className="max-h-72 overflow-x-hidden overflow-y-auto overscroll-contain px-2 pb-2">
							{analyses.map((a) => {
								const inputId = `analysis-dl-${a.analysis_run_name}`;
								const rowSize = sizeLabel(a.files.map((f) => f.href));
								const isOn = Boolean(selected[a.analysis_run_name]);
								return (
									<li
										key={a.analysis_run_name}
										className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-base text-base-content/80 hover:bg-base-content/10"
										onClick={() =>
											setSelected((prev) => ({
												...prev,
												[a.analysis_run_name]: !prev[a.analysis_run_name]
											}))
										}
									>
										<input
											id={inputId}
											type="checkbox"
											className="checkbox checkbox-primary checkbox-sm mt-1"
											checked={isOn}
											// stopPropagation so the row onClick doesn’t double-toggle
											onClick={(e) => e.stopPropagation()}
											onChange={(e) =>
												setSelected((prev) => ({
													...prev,
													[a.analysis_run_name]: e.target.checked
												}))
											}
										/>
										<div className="min-w-0 flex-1">
											<div className="leading-snug wrap-break-word text-base-content/90">{a.analysis_run_name}</div>
											<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-base-content/70">
												<span className="inline-flex min-h-4 min-w-12 items-center">{rowSize ?? null}</span>
												<Link
													href={exploreUrl({
														table: "analysis",
														project_id,
														analysis_run_name: a.analysis_run_name
													})}
													className="text-primary hover:underline"
													onClick={(e) => e.stopPropagation()}
												>
													Open analysis page
												</Link>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					</div>,
					document.body
				)
			: null;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<button
				type="button"
				onClick={onDownloadMetadata}
				disabled={metaBusy || metadataUrls.length === 0}
				className={`${downloadBtnClass} rounded-lg`}
				aria-label="Download project, sample, and library metadata files"
			>
				<FileDownloadIcon />
				<DownloadButtonLabel title={metaBusy ? "Downloading…" : "Download Metadata"} sizeLabel={metadataSizeLabel} />
			</button>

			{analyses.length > 0 ? (
				<div
					ref={splitBtnRef}
					className={[
						"relative z-popover inline-flex items-stretch overflow-hidden transition-colors",
						showAnalysisPicker ? "rounded-t-lg rounded-b-none bg-base-300" : "rounded-lg bg-base-200"
					].join(" ")}
				>
					<button
						type="button"
						onClick={onDownloadAnalysis}
						disabled={analysisBusy || noneSelected}
						className={`${downloadBtnClass} rounded-none bg-transparent hover:bg-base-content/5`}
						aria-label={analysisButtonLabel}
					>
						<FileDownloadIcon />
						<DownloadButtonLabel title={analysisButtonLabel} sizeLabel={analysisSizeLabel} />
					</button>
					<button
						type="button"
						onClick={togglePicker}
						className={[
							"inline-flex items-center justify-center px-3 text-base-content transition-colors hover:bg-base-content/5 hover:text-primary",
							showAnalysisPicker ? "text-primary" : ""
						].join(" ")}
						aria-expanded={showAnalysisPicker}
						aria-haspopup="true"
						aria-controls="analysis-download-picker"
						aria-label={showAnalysisPicker ? "Hide analysis selector" : "Choose which analyses to download"}
						title="Choose analyses"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							className={`h-5 w-5 transition-transform ${showAnalysisPicker ? "rotate-180" : ""}`}
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			) : null}
			<InfoButton dir="tooltip-bottom">{downloadsInfo}</InfoButton>
			{picker}
		</div>
	);
}
