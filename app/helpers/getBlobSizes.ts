import "server-only";
import { head } from "@vercel/blob";

/** reasonable limit */
const MAX_BLOB_SIZE_URLS = 96;

/** get byte sizes with blob SDK head() */
export async function getBlobSizes(urls: string[]): Promise<Record<string, number | null>> {
	const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_BLOB_SIZE_URLS);

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
