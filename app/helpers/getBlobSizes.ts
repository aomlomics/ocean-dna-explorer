import "server-only";
import { head } from "@vercel/blob";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
/** Hard cap so one project page cannot fan out unbounded outbound HEAD calls. */
const MAX_BLOB_SIZE_URLS = 96;

function isAllowedBlobUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
	} catch {
		return false;
	}
}

/** Resolve byte sizes for public Vercel Blob URLs. Not a server action — call only from the server. */
export async function getBlobSizes(urls: string[]): Promise<Record<string, number | null>> {
	const unique = [...new Set(urls.filter(Boolean))].filter(isAllowedBlobUrl).slice(0, MAX_BLOB_SIZE_URLS);

	const entries = await Promise.all(
		unique.map(async (url) => {
			try {
				const meta = await head(url);
				return [url, meta.size] as const;
			} catch {
				return [url, null] as const;
			}
		})
	);

	return Object.fromEntries(entries);
}
