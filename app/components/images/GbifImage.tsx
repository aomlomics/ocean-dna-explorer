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
	const [fetching, setFetching] = useState(true);
	const [payload, setPayload] = useState<GbifImagePayload | null>(null);
	const [activeSrc, setActiveSrc] = useState<string | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			setFetching(true);
			setPayload(null);
			setActiveSrc(null);
			setLoadFailed(false);
			setImageLoaded(false);
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
				if (!cancelled) setFetching(false);
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

	useEffect(() => {
		setImageLoaded(false);
	}, [activeSrc]);

	function handleImgError() {
		if (payload && activeSrc === payload.proxyUrl && payload.directUrl !== payload.proxyUrl) {
			setActiveSrc(payload.directUrl);
			return;
		}
		setLoadFailed(true);
		setActiveSrc(null);
	}

	function handleImgLoad() {
		setImageLoaded(true);
	}

	if (fetching) {
		return (
			<div className={`relative h-full w-full overflow-hidden ${className}`} aria-busy="true">
				<div className="absolute inset-0 flex items-center justify-center bg-base-200/85">
					<span className="loading loading-spinner loading-lg text-primary" />
				</div>
			</div>
		);
	}

	if (loadFailed || !payload || !activeSrc) {
		if (showPhylopicFallback) {
			return (
				<div className={`relative h-full w-full overflow-hidden ${className}`}>
					<PhyloPicClient taxonomy={taxonomy} />
				</div>
			);
		}
		return (
			<div
				className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-base-300/50 bg-base-200/50 px-2 text-center text-xs text-base-content/50 ${className}`}
			>
				No suitable GBIF photo found (occurrence or checklist media).
			</div>
		);
	}

	const attributionLine = payload ? formatGbifAttributionDisplay(payload) : null;
	const showImageSpinner = !imageLoaded && !loadFailed;
	const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";

	// Same stacking as PhyloPicClient: outer relative fill box, inner relative h-full w-full, bitmap absolute inset-0 h-full w-full + object-* (Next/Image fill + object-contain).
	const imageArea = (
		<div className="relative h-full w-full overflow-hidden">
			<div className="relative flex h-full w-full flex-col justify-center">
				<div className="relative h-full w-full">
					{showImageSpinner ? (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-base-200/85" aria-busy="true">
							<span className="loading loading-spinner loading-lg text-primary" />
						</div>
					) : null}
					<img
						src={activeSrc}
						alt={altText}
						width={480}
						height={480}
						onLoad={handleImgLoad}
						onError={handleImgError}
						className={`absolute inset-0 box-border h-full w-full max-h-full max-w-full ${fitClass}`}
						decoding="async"
					/>
				</div>
			</div>
		</div>
	);

	if (showAttribution && attributionLine) {
		return (
			<div className={`flex h-full w-full flex-col overflow-hidden ${className}`}>
				<div className="min-h-0 flex-1 overflow-hidden">{imageArea}</div>
				<p className="mt-1 line-clamp-2 text-center text-[10px] leading-snug text-base-content/50">
					{attributionLine}
				</p>
			</div>
		);
	}

	return <div className={`relative h-full w-full overflow-hidden ${className}`}>{imageArea}</div>;
}
