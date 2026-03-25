"use client";

import type { Taxonomy } from "@/app/generated/prisma/client";
import { useEffect, useState } from "react";
import type { GbifImagePayload } from "./GbifClient";
import { formatGbifAttributionDisplay, getGbifStillImagePayload } from "./GbifClient";
import PhyloPicClient from "./PhyloPicClient";

type GbifImageProps = {
	taxonKey: number | string;
	taxonomy: Taxonomy;
	altText: string;
	className?: string;
	/** When false, no PhyloPic duplicate if GBIF has no photo (parent already shows PhyloPic). Default true (e.g. explore grid). */
	showPhylopicFallback?: boolean;
	/** `contain` avoids cropping portrait photos; `cover` fills the box. */
	objectFit?: "cover" | "contain";
	/** Show rights / creator under the image when available */
	showAttribution?: boolean;
	/** Fires when the loaded payload changes (same fetch); use to render attribution outside a fixed aspect box. */
	onPayloadChange?: (payload: GbifImagePayload | null) => void;
};

export default function GbifImage({
	taxonKey,
	taxonomy,
	altText,
	className = "",
	showPhylopicFallback = true,
	objectFit = "cover",
	showAttribution = false,
	onPayloadChange
}: GbifImageProps) {
	const [loading, setLoading] = useState(true);
	const [payload, setPayload] = useState<GbifImagePayload | null>(null);
	const [activeSrc, setActiveSrc] = useState<string | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			setLoading(true);
			setPayload(null);
			setActiveSrc(null);
			setLoadFailed(false);
			try {
				const p = await getGbifStillImagePayload(taxonKey);
				if (!cancelled) {
					setPayload(p);
					if (p) setActiveSrc(p.proxyUrl);
					else setLoadFailed(true);
				}
			} catch {
				if (!cancelled) {
					setPayload(null);
					setLoadFailed(true);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [taxonKey]);

	useEffect(() => {
		onPayloadChange?.(payload);
	}, [payload, onPayloadChange]);

	function handleImgError() {
		if (payload && activeSrc === payload.proxyUrl && payload.directUrl !== payload.proxyUrl) {
			setActiveSrc(payload.directUrl);
			return;
		}
		setLoadFailed(true);
		setActiveSrc(null);
	}

	if (loading) {
		return (
			<div
				className={`flex h-full w-full min-h-32 flex-col items-center justify-center gap-2 ${className}`}
				aria-busy="true"
			>
				<span className="loading loading-spinner loading-lg text-primary" />
				<span className="text-center text-xs font-medium text-primary">Loading GBIF photo…</span>
			</div>
		);
	}

	if (loadFailed || !payload || !activeSrc) {
		if (showPhylopicFallback) {
			return (
				<div className={`relative h-full w-full min-h-32 ${className}`}>
					<PhyloPicClient taxonomy={taxonomy} />
				</div>
			);
		}
		return (
			<div
				className={`flex h-full min-h-32 w-full items-center justify-center rounded-lg border border-base-300/50 bg-base-200/50 px-2 text-center text-xs text-base-content/50 ${className}`}
			>
				No suitable GBIF photo found (occurrence or checklist media).
			</div>
		);
	}

	const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";
	const attributionLine = payload ? formatGbifAttributionDisplay(payload) : null;

	return (
		<div className={`flex h-full w-full flex-col ${className}`}>
			<div className="relative min-h-0 flex-1">
				<img
					src={activeSrc}
					alt={altText}
					onError={handleImgError}
					className={`h-full w-full ${fitClass}`}
				/>
			</div>
			{showAttribution && attributionLine ? (
				<p className="mt-1 line-clamp-2 text-center text-[10px] leading-snug text-base-content/50">
					{attributionLine}
				</p>
			) : null}
		</div>
	);
}
