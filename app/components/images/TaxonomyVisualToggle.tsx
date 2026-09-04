"use client";

import type { TaxonomyModel } from "@/app/generated/prisma/models/Taxonomy";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { TaxonomicRanks } from "@/types/objects";
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
	taxonomy: TaxonomyModel;
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
	/** When true, only the image toggle is shown (names render elsewhere on the page). */
	hideNamePanels?: boolean;
	/** Tighter image frame for explore taxonomy pages. */
	compact?: boolean;
	/** Optional content rendered to the right of the image (e.g. taxonomic ranks). */
	children?: ReactNode;
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
	commonName = null,
	hideNamePanels = false,
	compact = false,
	children
}: TaxonomyVisualToggleProps) {
	const [mode, setMode] = useState<Mode>("phylopic");
	const [skipWarn, setSkipWarn] = useState(true);
	const [gbifLayerMounted, setGbifLayerMounted] = useState(false);
	const [gbifPayload, setGbifPayload] = useState<GbifImagePayload | null>(null);
	const gbifWarningModalRef = useRef<HTMLDialogElement>(null);

	const gbifPhotoAllowed = rankAllowsGbifPhoto(databaseRankKey);

	if (!gbifPhotoAllowed && (mode !== "phylopic" || gbifLayerMounted || gbifPayload)) {
		setMode("phylopic");
		setGbifLayerMounted(false);
		setGbifPayload(null);
	}

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
		gbifWarningModalRef.current?.showModal();
	}, [activateGbifMode, gbifPhotoAllowed]);

	const confirmGbif = useCallback(() => {
		if (skipWarn && typeof window !== "undefined") {
			sessionStorage.setItem(SESSION_CONSENT_KEY, "1");
		}
		gbifWarningModalRef.current?.close();
		activateGbifMode();
	}, [skipWarn, activateGbifMode]);

	const rankTip = phyloRank ? `${phyloRank.charAt(0).toUpperCase() + phyloRank.slice(1)}: ${phyloTitle}` : phyloTitle;

	const showGbifToggle = mediaTaxonKey != null && gbifPhotoAllowed;
	const displayCommonName = commonName?.trim() ? commonName.trim() : "No common name found";

	const phylopicLayerClass =
		mode === "phylopic" || !showGbifToggle ? "opacity-100 z-[1]" : "pointer-events-none opacity-0 z-0";

	const gbifLayerClass = mode === "gbif" && showGbifToggle ? "opacity-100 z-[2]" : "pointer-events-none opacity-0 z-0";

	const hasAside = Boolean(children);
	const imageFrameClass = compact ? "max-w-44" : hasAside ? "w-64 sm:w-72 lg:w-80" : "max-w-xs";
	const toggleBtnClass = compact ? "min-h-8 h-8 text-xs" : "min-h-8 h-8 text-sm";

	return (
		<div className={`flex h-full min-h-0 w-full min-w-0 max-w-full flex-col ${hasAside ? "items-stretch" : "items-center"}`}>
			<div
				className={
					hasAside
						? "flex w-full min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-10 lg:gap-12"
						: "flex w-full min-w-0 flex-col items-center"
				}
			>
				{/* Square matches PhyloPic frame; GBIF uses the same fill + object-contain pattern as ThemeAwarePhyloPic inside GbifImage. */}
				<div
					className={`flex min-w-0 ${imageFrameClass} shrink-0 flex-col gap-2 ${hasAside ? "items-center sm:items-stretch" : "self-center"}`}
				>
					{mediaTaxonKey != null ? (
						<div className="flex justify-center sm:justify-start">
							<div className="join bg-base-100 p-0.5">
								<button
									type="button"
									className={`join-item btn rounded-btn ${toggleBtnClass} ${mode === "phylopic" ? "btn-primary" : "btn-ghost"}`}
									onClick={() => setMode("phylopic")}
								>
									PhyloPic Outline
								</button>
								<button
									type="button"
									className={`join-item btn rounded-btn ${toggleBtnClass} ${mode === "gbif" ? "btn-primary" : "btn-ghost"}`}
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
							<div className={`absolute inset-0 overflow-clip p-1 transition-opacity duration-150 ${gbifLayerClass}`}>
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
									? (formatGbifAttributionDisplay(gbifPayload) ??
										"GBIF image shown (no attribution provided by GBIF for this record).")
									: "\u00a0"
								: "\u00a0"}
						</p>
					) : null}
				</div>

				{hasAside ? <div className="flex w-max max-w-full shrink-0 flex-col justify-center">{children}</div> : null}
			</div>

			{hideNamePanels ? null : (
				<div className={`mt-5 w-full ${hasAside ? "" : "max-w-2xl"}`}>
					<div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
						<div className="min-w-0">
							<div className="text-[10px] font-medium uppercase tracking-widest text-base-content/70">Common name</div>
							<div className="mt-1 flex items-center gap-2">
								<div
									className="min-w-0 flex-1 wrap-break-word text-left text-xl font-semibold leading-tight text-base-content first-letter:uppercase"
									title={displayCommonName}
								>
									{displayCommonName}
								</div>
								<InfoButton text="Not stored in the database. Approximated from GBIF vernacularNames for the matched GBIF backbone taxon." />
							</div>
							<div className="mt-1 text-xs text-base-content/50">(GBIF, approximate)</div>
						</div>

						<div className="min-w-0">
							<div className="text-[10px] font-medium uppercase tracking-widest text-base-content/70">
								Scientific name
							</div>
							<div className="mt-1 flex items-center gap-2">
								<div
									className="min-w-0 flex-1 wrap-break-word text-left text-xl font-semibold italic leading-tight text-base-content"
									title={databaseScientificName}
								>
									{databaseScientificName}
								</div>
								<div className="dropdown dropdown-end shrink-0">
									<div tabIndex={0} role="button" aria-label="Taxonomic image attribution" className="shrink-0">
										<InfoButton text="Taxonomic outline image provided by PhyloPic, resolved on the GBIF backbone." />
									</div>
									<div
										tabIndex={0}
										className="dropdown-content z-50 w-80 rounded-box border border-base-300 bg-base-200 p-3 shadow-sm"
									>
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
											backbone taxonomy — the same GBIF species-suggest step as PhyloPic on the explore grid (
											<span className="whitespace-nowrap">matchGbifForPhylopic</span>). GBIF photo, English common name,
											and IUCN data on this page all use that match only. <strong>GBIF photo</strong> mode prefers
											occurrence still images (e.g. iNaturalist), then filtered checklist media, skipping obvious range
											maps when possible. Third‑party licenses apply; see the credit line under the GBIF photo when shown.
										</p>
									</div>
								</div>
							</div>
							<div className="mt-1 text-xs text-base-content/50">Assigned to: {databaseRankLabel}</div>
						</div>
					</div>
				</div>
			)}

			<dialog ref={gbifWarningModalRef} className="modal">
				<div className="modal-box max-w-md">
					<form method="dialog">
						<button
							type="submit"
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							aria-label="Close dialog"
						>
							✕
						</button>
					</form>
					<h3 id="gbif-photo-warn-title" className="text-lg font-semibold text-base-content">
						GBIF Occurrence Photos
					</h3>
					<p className="py-3 text-sm text-base-content/80">
						These images come from GBIF occurrence records and checklist media. They may show dead animals, strandings,
						museum specimens, dissections, or other sensitive content.
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
					<div className="modal-action mt-2">
						<form method="dialog">
							<button type="submit" className="btn btn-ghost btn-sm">
								Cancel
							</button>
						</form>
						<button type="button" className="btn btn-primary btn-sm" onClick={confirmGbif}>
							Show GBIF photo
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}
