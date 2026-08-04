const GBIF_FETCH_TIMEOUT_MS = 3200;

export type GbifImagePayload = {
	proxyUrl: string;
	directUrl: string;
	/** Short rights / creator line for display */
	attribution?: string;
	source: "occurrence" | "species_media";
};

/** Full credit line for under-image display; null when there is no rights/creator text from GBIF. */
export function formatGbifAttributionDisplay(payload: GbifImagePayload): string | null {
	const a = payload.attribution?.trim();
	if (!a) return null;
	const suffix = payload.source === "occurrence" ? " · via GBIF occurrence record" : " · GBIF checklist media";
	return `${a}${suffix}`;
}

function makePayload(
	directUrl: string,
	attribution: string | undefined,
	source: GbifImagePayload["source"]
): GbifImagePayload {
	return {
		directUrl,
		proxyUrl: `https://wsrv.nl/?url=${directUrl}&w=480&output=webp`,
		attribution,
		source
	};
}

/** Skip range maps, diagrams, and typical non-field-photo checklist figures. */
const SKIP_MEDIA_TEXT =
	/range\s*map|distribution\s*map|\bmap\s+of\b|\bdistribution\b.*\bmap|plate.*map|x-?ray|radiograph|skeleton(ized)?|histolog|ct\s+scan|micrograph|drawing\s+of|diagram\s+of|figure\s*\d+.*\bmap/i;

type OccRecord = {
	basisOfRecord?: string;
	media?: {
		type?: string;
		format?: string;
		identifier?: string;
		references?: string;
		creator?: string;
		rightsHolder?: string;
		license?: string;
		publisher?: string;
	}[];
};

function scoreOccurrenceMedia(rec: OccRecord, m: NonNullable<OccRecord["media"]>[0]): number {
	if (m.type !== "StillImage") return -Infinity;
	const id = m.identifier?.trim();
	if (!id || !/^https?:\/\//i.test(id)) return -Infinity;
	const blob = `${m.references ?? ""} ${id} ${m.publisher ?? ""}`;
	if (SKIP_MEDIA_TEXT.test(blob)) return -Infinity;

	let s = 0;
	if (rec.basisOfRecord === "HUMAN_OBSERVATION") s += 60;
	if ((m.format ?? "").toLowerCase().includes("jpeg")) s += 15;
	if ((m.publisher ?? "").toLowerCase() === "inaturalist") s += 12;
	if (/inaturalist|observations\/|\/photos\//i.test(blob)) s += 8;
	if (id.includes("zenodo.org")) s -= 25;
	return s;
}

type SpeciesMediaItem = {
	type?: string;
	format?: string;
	identifier?: string;
	title?: string;
	description?: string;
	source?: string;
};

function scoreSpeciesMediaItem(item: SpeciesMediaItem): number {
	if (item.type !== "StillImage") return -Infinity;
	const id = item.identifier?.trim();
	if (!id || !/^https?:\/\//i.test(id)) return -Infinity;
	const blob = `${item.title ?? ""} ${item.description ?? ""} ${item.source ?? ""} ${id}`;
	if (SKIP_MEDIA_TEXT.test(blob)) return -Infinity;
	let s = 5;
	if ((item.format ?? "").toLowerCase().includes("jpeg")) s += 10;
	if (/photo|field|live|underwater|camera trap/i.test(blob)) s += 15;
	if (id.includes("zenodo.org") && /figure|plate|map/i.test(blob)) s -= 40;
	return s;
}

/**
 * Prefer occurrence still images (e.g. iNaturalist) over checklist /species/media (often range maps).
 */
export async function getGbifStillImagePayload(taxonKey: number | string): Promise<GbifImagePayload | null> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), GBIF_FETCH_TIMEOUT_MS);

	try {
		const occRes = await fetch(
			`https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&mediaType=StillImage&limit=50`,
			{ signal: controller.signal }
		);
		if (occRes.ok) {
			const occData = (await occRes.json()) as { results?: OccRecord[] };
			let bestScore = -Infinity;
			let best: { id: string; rights?: string; creator?: string } | null = null;
			for (const rec of occData.results ?? []) {
				for (const m of rec.media ?? []) {
					const sc = scoreOccurrenceMedia(rec, m);
					if (sc > bestScore && m.identifier) {
						bestScore = sc;
						best = {
							id: m.identifier.trim(),
							rights: m.rightsHolder,
							creator: m.creator
						};
					}
				}
			}
			if (best && bestScore > 0) {
				const attr = [best.rights, best.creator].filter(Boolean).join(" · ");
				return makePayload(best.id, attr || undefined, "occurrence");
			}
		}

		const smRes = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/media`, {
			signal: controller.signal
		});
		if (!smRes.ok) return null;
		const smData = (await smRes.json()) as { results?: SpeciesMediaItem[] };
		const results = Array.isArray(smData?.results) ? smData.results : [];
		let bestS = -Infinity;
		let bestItem: SpeciesMediaItem | null = null;
		for (const item of results) {
			const sc = scoreSpeciesMediaItem(item);
			if (sc > bestS) {
				bestS = sc;
				bestItem = item;
			}
		}
		if (bestItem?.identifier && bestS > 0) {
			const blob = `${bestItem.title ?? ""} · ${bestItem.source ?? ""}`.trim();
			return makePayload(bestItem.identifier.trim(), blob || undefined, "species_media");
		}
		return null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
}
