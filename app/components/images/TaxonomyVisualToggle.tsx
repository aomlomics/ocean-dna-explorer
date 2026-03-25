"use client";

import type { Taxonomy } from "@/app/generated/prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GbifImagePayload } from "./GbifClient";
import { formatGbifAttributionDisplay } from "./GbifClient";
import GbifImage from "./GbifImage";
import PhyloPicClient from "./PhyloPicClient";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";

const SESSION_CONSENT_KEY = "opal-gbif-photo-warning-ok";

type Mode = "phylopic" | "gbif";

type TaxonomyVisualToggleProps = {
	taxonomy: Taxonomy;
	/** When null, only PhyloPic is shown (no GBIF photo mode). */
	mediaTaxonKey: number | null;
	phyloPicUrl: string | null;
	/** Server-resolved PhyloPic objectID chain (same GBIF match as common name / GBIF photo). */
	phylopicObjectIds?: string | null;
	phyloRank: string;
	phyloTitle: string;
	altScientificName: string;
	databaseRankLabel: string;
	databaseScientificName: string;
	commonName?: string | null;
};

export default function TaxonomyVisualToggle({
	taxonomy,
	mediaTaxonKey,
	phyloPicUrl,
	phylopicObjectIds = null,
	phyloRank,
	phyloTitle,
	altScientificName,
	databaseRankLabel,
	databaseScientificName,
	commonName = null
}: TaxonomyVisualToggleProps) {
	const [mode, setMode] = useState<Mode>("phylopic");
	const [modalOpen, setModalOpen] = useState(false);
	const [skipWarn, setSkipWarn] = useState(true);
	const [gbifLayerMounted, setGbifLayerMounted] = useState(false);
	const [portalReady, setPortalReady] = useState(false);
	const [gbifPayload, setGbifPayload] = useState<GbifImagePayload | null>(null);

	useEffect(() => {
		setPortalReady(true);
	}, []);

	const activateGbifMode = useCallback(() => {
		setGbifLayerMounted(true);
		setMode("gbif");
	}, []);

	const openGbifOrWarn = useCallback(() => {
		if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_CONSENT_KEY) === "1") {
			activateGbifMode();
			return;
		}
		setModalOpen(true);
	}, [activateGbifMode]);

	const confirmGbif = useCallback(() => {
		if (skipWarn && typeof window !== "undefined") {
			sessionStorage.setItem(SESSION_CONSENT_KEY, "1");
		}
		setModalOpen(false);
		activateGbifMode();
	}, [skipWarn, activateGbifMode]);

	const rankTip = phyloRank
		? `${phyloRank[0].toUpperCase() + phyloRank.slice(1)}: ${phyloTitle}`
		: phyloTitle;

	const showGbifToggle = mediaTaxonKey != null;

	const phylopicLayerClass =
		mode === "phylopic" || !showGbifToggle
			? "opacity-100 z-[1]"
			: "pointer-events-none opacity-0 z-0";

	const gbifLayerClass =
		mode === "gbif" && showGbifToggle ? "opacity-100 z-[2]" : "pointer-events-none opacity-0 z-0";

	return (
		<div className="flex w-full max-w-sm flex-col items-center">
			{showGbifToggle ? (
				<div className="mb-2 flex flex-wrap items-center justify-center gap-2">
					<div className="join border border-base-300/80 bg-base-300/20 p-0.5">
						<button
							type="button"
							className={`join-item btn btn-xs rounded-btn sm:btn-sm ${mode === "phylopic" ? "btn-primary" : "btn-ghost"}`}
							onClick={() => setMode("phylopic")}
						>
							PhyloPic Outline
						</button>
						<button
							type="button"
							className={`join-item btn btn-xs rounded-btn sm:btn-sm ${mode === "gbif" ? "btn-primary" : "btn-ghost"}`}
							onClick={openGbifOrWarn}
						>
							GBIF photo
						</button>
					</div>
				</div>
			) : null}

			{/* Square holds only the image; GBIF credit line sits below so it is not squeezed inside aspect-square. */}
			<div className="flex w-full flex-col gap-2">
				<div className="relative aspect-square w-full rounded-lg">
					<div className={`absolute inset-0 overflow-hidden transition-opacity duration-150 ${phylopicLayerClass}`}>
						{phyloPicUrl ? (
							<div
								className="tooltip tooltip-bottom tooltip-primary h-full w-full before:max-w-[min(90vw,20rem)] before:bg-base-100 before:text-base-content before:border before:border-base-300"
								data-tip={rankTip}
							>
								<ThemeAwarePhyloPic
									src={phyloPicUrl}
									alt={`PhyloPic silhouette for ${altScientificName}`}
									priority
									fill
									className="object-contain"
								/>
							</div>
						) : (
							<div className="absolute inset-0 h-full w-full">
								<PhyloPicClient taxonomy={taxonomy} phylopicObjectIds={phylopicObjectIds} />
							</div>
						)}
					</div>

					{showGbifToggle && gbifLayerMounted ? (
						<div className={`absolute inset-0 flex flex-col p-1 transition-opacity duration-150 ${gbifLayerClass}`}>
							<GbifImage
								taxonKey={mediaTaxonKey!}
								taxonomy={taxonomy}
								altText={`GBIF occurrence or media photo — ${altScientificName}`}
								showPhylopicFallback={false}
								objectFit="contain"
								showAttribution={false}
								onPayloadChange={setGbifPayload}
								className="min-h-0 h-full flex-1"
							/>
						</div>
					) : null}
				</div>

				{mode === "gbif" && showGbifToggle && gbifLayerMounted ? (
					<p className="min-h-11 w-full px-1 text-center text-xs leading-snug text-base-content/60">
						{gbifPayload
							? formatGbifAttributionDisplay(gbifPayload) ?? "GBIF image shown (no attribution provided by GBIF for this record)."
							: "Loading image attribution…"}
					</p>
				) : null}
			</div>

			<div className="mt-4 w-full max-w-2xl">
				<div className="grid w-full grid-cols-2 items-start gap-x-12">
					<div className="text-center">
						<div className="text-[10px] font-medium uppercase tracking-widest text-base-content/50">
							Scientific name
						</div>
						<div className="mt-0.5 flex h-10 items-center justify-center gap-2 sm:h-12">
							<div
								className="whitespace-nowrap text-xl font-semibold italic leading-tight text-base-content sm:text-2xl"
								title={databaseScientificName}
							>
								{databaseScientificName}
							</div>
							<div className="dropdown dropdown-end shrink-0">
								<div
									tabIndex={0}
									role="button"
									aria-label="Taxonomic image attribution"
									className="btn btn-xs btn-circle btn-ghost tooltip tooltip-top before:bg-base-200 before:text-base-content before:border before:border-base-300"
									data-tip="Taxonomic outline image provided by PhyloPic, resolved on the GBIF backbone."
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										className="stroke-current text-primary h-5 w-5 shrink-0"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
								<div tabIndex={0} className="dropdown-content z-50 w-80 rounded-box border border-base-300 bg-base-200 p-3 shadow-sm">
									<h4 className="mb-1 text-sm font-semibold text-base-content/80">
										Taxonomic outline image provided by PhyloPic
									</h4>
									<p className="text-xs leading-relaxed text-base-content/60">
										The silhouette is from{" "}
										<Link href="https://www.phylopic.org/" className="text-primary hover:underline" target="_blank">
											PhyloPic
										</Link>
										, matched via the{" "}
										<Link href="https://www.gbif.org/" className="text-primary hover:underline" target="_blank">
											GBIF
										</Link>{" "}
										backbone taxonomy (resolved using the species suggest API). On this taxonomy page, GBIF photo and English
										common name use that same backbone match (one server request chain). <strong>GBIF photo</strong> mode
										prefers occurrence still images (e.g.
										iNaturalist), then filtered checklist media, skipping obvious range maps when possible. Third‑party
										licenses apply; see the credit line under the GBIF photo when shown.
									</p>
								</div>
							</div>
						</div>
						<div className="mt-0.5 text-xs text-base-content/50">Assigned to: {databaseRankLabel}</div>
					</div>

					{commonName ? (
						<div className="text-center">
							<div className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-base-content/50">
								Common name <span className="text-base-content/40">(GBIF, approximate)</span>
							</div>
							<div className="mt-0.5 flex h-10 items-center justify-center gap-2 sm:h-12">
								<div className="whitespace-nowrap text-lg font-semibold leading-tight text-base-content first-letter:uppercase sm:text-xl">
									{commonName}
								</div>
								<span
									className="tooltip tooltip-top before:bg-base-200 before:text-base-content before:border before:border-base-300"
									data-tip="Not stored in the database. Approximated from GBIF vernacularNames for the matched GBIF backbone taxon."
								>
									<button
										type="button"
										aria-label="About common name"
										className="btn btn-xs btn-circle btn-ghost"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="stroke-current text-primary h-5 w-5 shrink-0">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</button>
								</span>
							</div>
						</div>
					) : (
						<div className="text-center text-sm text-base-content/45 sm:text-left">
							No GBIF vernacular name returned for this taxon.
						</div>
					)}
				</div>

			</div>

			{portalReady && modalOpen
				? createPortal(
						<div
							className="fixed inset-0 z-10050 flex items-center justify-center bg-black/60 p-4"
							role="dialog"
							aria-modal="true"
							aria-labelledby="gbif-photo-warn-title"
						>
							<button
								type="button"
								className="absolute inset-0 z-0 cursor-default"
								aria-label="Close dialog"
								onClick={() => setModalOpen(false)}
							/>
							<div className="relative z-10 w-full max-w-md rounded-box border border-base-300 bg-base-200 p-5 shadow-xl">
								<h3 id="gbif-photo-warn-title" className="text-lg font-semibold text-base-content">
									GBIF occurrence photos
								</h3>
								<p className="py-3 text-sm text-base-content/80">
									These images come from GBIF <strong>occurrence</strong> records and checklist media. They may show{" "}
									<strong>dead animals</strong>, strandings, museum specimens, dissections, or other sensitive content — not
									only &quot;field guide&quot; style photos.
								</p>
								<label className="label cursor-pointer justify-start gap-2 py-1">
									<input
										type="checkbox"
										className="checkbox checkbox-sm checkbox-primary"
										checked={skipWarn}
										onChange={(e) => setSkipWarn(e.target.checked)}
									/>
									<span className="label-text text-xs">Don&apos;t show this again this session</span>
								</label>
								<div className="mt-2 flex justify-end gap-2">
									<button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>
										Cancel
									</button>
									<button type="button" className="btn btn-primary btn-sm" onClick={confirmGbif}>
										Show GBIF photo
									</button>
								</div>
							</div>
						</div>,
						document.body
					)
				: null}
		</div>
	);
}
