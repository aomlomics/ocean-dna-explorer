"use client";

import type { Taxonomy } from "@/app/generated/prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TaxonomicRanks } from "@/types/objects";
import { createPortal } from "react-dom";
import InfoButton from "@/app/components/InfoButton";
import type { GbifImagePayload } from "./GbifClient";
import { formatGbifAttributionDisplay } from "./GbifClient";
import GbifImage from "./GbifImage";
import PhyloPicClient from "./PhyloPicClient";
import ThemeAwarePhyloPic from "./ThemeAwarePhyloPic";

const SESSION_CONSENT_KEY = "opal-gbif-photo-warning-ok";

type Mode = "phylopic" | "gbif";

function rankAllowsGbifPhoto(rankKey: (typeof TaxonomicRanks)[number] | null | undefined): boolean {
	if (rankKey == null) return false;
	const idx = TaxonomicRanks.indexOf(rankKey);
	const familyIdx = TaxonomicRanks.indexOf("family");
	if (idx < 0 || familyIdx < 0) return false;
	return idx >= familyIdx;
}

type TaxonomyVisualToggleProps = {
	taxonomy: Taxonomy;
	/** When null, only PhyloPic is shown (no GBIF photo mode). */
	mediaTaxonKey: number | null;
	/** Finest populated rank key on the taxonomy row; GBIF photo is disabled above family. */
	databaseRankKey: (typeof TaxonomicRanks)[number] | null;
	phyloPicUrl: string | null;
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
	databaseRankKey,
	phyloPicUrl,
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

	const gbifPhotoAllowed = rankAllowsGbifPhoto(databaseRankKey);

	useEffect(() => {
		if (!gbifPhotoAllowed) {
			setMode("phylopic");
			setGbifLayerMounted(false);
			setGbifPayload(null);
		}
	}, [gbifPhotoAllowed]);

	const activateGbifMode = useCallback(() => {
		setGbifLayerMounted(true);
		setMode("gbif");
	}, []);

	const openGbifOrWarn = useCallback(() => {
		if (!gbifPhotoAllowed) return;
		if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_CONSENT_KEY) === "1") {
			activateGbifMode();
			return;
		}
		setModalOpen(true);
	}, [activateGbifMode, gbifPhotoAllowed]);

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

	const showGbifToggle = mediaTaxonKey != null && gbifPhotoAllowed;

	const phylopicLayerClass =
		mode === "phylopic" || !showGbifToggle
			? "opacity-100 z-[1]"
			: "pointer-events-none opacity-0 z-0";

	const gbifLayerClass =
		mode === "gbif" && showGbifToggle ? "opacity-100 z-[2]" : "pointer-events-none opacity-0 z-0";

	return (
		<div className="flex w-full min-w-0 max-w-full flex-col items-center">
			{mediaTaxonKey != null ? (
				<div className="mb-2 flex flex-wrap items-center justify-center gap-2">
					<div className="join bg-base-100 p-0.5">
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
							disabled={!gbifPhotoAllowed}
							onClick={openGbifOrWarn}
							title={
								gbifPhotoAllowed
									? undefined
									: "GBIF occurrence photos are only available for ranks at family or below (family, genus, species)."
							}
						>
							GBIF photo
						</button>
					</div>
				</div>
			) : null}

			{/* Square matches PhyloPic frame; GBIF uses the same fill + object-contain pattern as ThemeAwarePhyloPic inside GbifImage. */}
			<div className="flex w-full min-w-0 max-w-xs shrink-0 flex-col gap-2 self-center">
				<div className="relative isolate aspect-square w-full max-w-full shrink-0 overflow-clip rounded-lg">
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
								<PhyloPicClient taxonomy={taxonomy} />
							</div>
						)}
					</div>

					{showGbifToggle && gbifLayerMounted ? (
						<div
							className={`absolute inset-0 overflow-clip p-1 transition-opacity duration-150 ${gbifLayerClass}`}
						>
							<GbifImage
								taxonKey={mediaTaxonKey!}
								taxonomy={taxonomy}
								altText={`GBIF occurrence or media photo — ${altScientificName}`}
								showPhylopicFallback={false}
								objectFit="contain"
								showAttribution={false}
								onPayloadChange={setGbifPayload}
								className="h-full w-full"
							/>
						</div>
					) : null}
				</div>

				{showGbifToggle ? (
					<p
						className={`line-clamp-2 h-11 w-full shrink-0 overflow-hidden px-1 text-center text-xs leading-snug text-base-content/60 ${
							mode === "gbif" && gbifLayerMounted ? "" : "invisible"
						}`}
						aria-hidden={!(mode === "gbif" && gbifLayerMounted)}
					>
						{mode === "gbif" && gbifLayerMounted
							? gbifPayload
								? formatGbifAttributionDisplay(gbifPayload) ??
									"GBIF image shown (no attribution provided by GBIF for this record)."
								: "\u00a0"
							: "\u00a0"}
					</p>
				) : null}
			</div>

			<div className="mt-4 w-full max-w-2xl px-2">
				<div className="mx-auto grid w-full min-w-0 grid-cols-1 gap-y-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-2">
					<div className="min-w-0 text-center sm:text-left">
						<div className="text-[10px] font-medium uppercase tracking-widest text-base-content/50">Scientific name</div>
						<div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
							<div
								className="min-w-0 flex-1 truncate text-left text-xl font-semibold italic leading-tight text-base-content sm:text-2xl"
								title={databaseScientificName}
							>
								{databaseScientificName}
							</div>
							<div className="dropdown dropdown-end shrink-0">
								<div
									tabIndex={0}
									role="button"
									aria-label="Taxonomic image attribution"
									className="shrink-0"
								>
									<InfoButton infoText="Taxonomic outline image provided by PhyloPic, resolved on the GBIF backbone." />
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
										backbone taxonomy — the same GBIF species-suggest step as PhyloPic on the explore grid (<span className="whitespace-nowrap">matchGbifForPhylopic</span>).
										GBIF photo, English common name, and IUCN data on this page all use that match only. <strong>GBIF photo</strong> mode
										prefers occurrence still images (e.g.
										iNaturalist), then filtered checklist media, skipping obvious range maps when possible. Third‑party
										licenses apply; see the credit line under the GBIF photo when shown.
									</p>
								</div>
							</div>
						</div>
						<div className="mt-1.5 text-xs text-base-content/50">Assigned to: {databaseRankLabel}</div>
					</div>

					{commonName ? (
						<div className="min-w-0 text-center sm:text-left">
							<div className="text-[10px] font-medium uppercase tracking-widest text-base-content/50">
								Common name <span className="text-base-content/40">(GBIF, approximate)</span>
							</div>
							<div className="mt-1 flex items-start justify-center gap-2 sm:justify-start">
								<div className="wrap-break-word text-lg font-semibold leading-snug text-base-content first-letter:uppercase sm:text-xl">
									{commonName}
								</div>
								<InfoButton
									infoText="Not stored in the database. Approximated from GBIF vernacularNames for the matched GBIF backbone taxon."
								/>
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
									GBIF Occurrence Photos
								</h3>
								<p className="py-3 text-sm text-base-content/80">
									These images come from GBIF occurrence records and checklist media. They may show{" "}
									dead animals, strandings, museum specimens, dissections, or other sensitive content.
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
