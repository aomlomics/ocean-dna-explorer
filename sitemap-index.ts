import { promises as fs } from "fs";
import path from "path";

//env variables don't seem to be loadable in postbuild scripts, have to hardcode the url instead
const SITE_URL = "https://www.oceandnaexplorer.org";

/**
 * 🗺️ Generates the main sitemap index file.
 *
 * This function creates a sitemap index file by discovering and aggregating
 * sitemap files generated across the project. It is temporary until Next.js
 * offers native support for sitemap indexing.
 */

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, "app");

async function main() {
	try {
		const sitemaps = await findSitemapFiles(APP_DIR);
		const SITEMAP_INDEX_PATH = path.join(ROOT_DIR, "public", "/sitemap.xml");

		const createSitemap = (url: string) => /* XML */ `
      <sitemap>
        <loc>${url}</loc>
      </sitemap>`;

		const createSitemapIndex = (urls: string[]) => /* XML */ `
      <?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
		${createSitemap(`${SITE_URL}/static-sitemap.xml`)}
        ${urls.map(createSitemap).join("")}
      </sitemapindex>`;

		const xml = createSitemapIndex(sitemaps);
		await fs.mkdir(path.dirname(SITEMAP_INDEX_PATH), { recursive: true });
		await fs.writeFile(SITEMAP_INDEX_PATH, xml.trim());

		console.log(`Sitemap index generated with ${sitemaps.length} entries.`);
	} catch (error) {
		console.error("Error generating sitemap:", error);
	}
}

/**
 * 🔎 Recursively finds 'sitemap.ts' files and extracts sitemap URLs.
 *
 * Traverses directories from the specified start point, looking for 'sitemap.ts' files.
 * If a file contains a `generateSitemaps` function, the function is invoked
 * to retrieve sitemap URLs. If absent, a default sitemap URL is constructed.
 *
 * Known Limitations:
 * - While this does consider Next.js conventions for folders like route groups, do not place
 *   'sitemap.ts' under folders like route groups untill the following seperate issue is resolved:
 *    https://github.com/vercel/next.js/issues/68403
 *
 * @param {string} dir - The base directory to begin searching for sitemap files.
 * @returns {Promise<string[]>} A promise that resolves to an array of sitemap URLs.
 */
async function findSitemapFiles(dir: string): Promise<string[]> {
	let sitemaps: string[] = [];
	try {
		const files = await fs.readdir(dir, { withFileTypes: true });
		for (const file of files) {
			const fullPath = path.join(dir, file.name);
			if (file.isDirectory()) {
				// ingore private folders since all its child segments are opted out of routing
				// https://nextjs.org/docs/app/getting-started/project-structure#route-groups-and-private-folders
				if (!file.name.startsWith("_")) {
					const nestedSitemaps = await findSitemapFiles(fullPath);
					sitemaps = sitemaps.concat(nestedSitemaps);
				}
			} else if (file.isFile() && file.name === "sitemap.ts") {
				const relativePath = path
					.relative(APP_DIR, dir)
					.split(path.sep)
					.filter(
						(segment) =>
							// Exclude specific Next.js folder conventions that should not be part of the resolved path
							// https://nextjs.org/docs/app/getting-started/project-structure#route-groups-and-private-folders
							// https://nextjs.org/docs/app/getting-started/project-structure#parallel-and-intercepted-routes
							// https://nextjs.org/docs/app/getting-started/project-structure#dynamic-routes
							!/^[(\[@]/.test(segment)
					)
					.join("/");
				const sitemapFile = await import(fullPath);
				if (sitemapFile.generateSitemaps) {
					const result = await sitemapFile.generateSitemaps();
					result.forEach((item: { id: number }) => {
						sitemaps.push(`${SITE_URL}/${relativePath}/sitemap/${item.id}.xml`);
					});
				} else {
					sitemaps.push(`${SITE_URL}/${relativePath}/sitemap.xml`);
				}
			}
		}
	} catch (error) {
		console.error("Error finding sitemaps:", error);
	}
	return sitemaps;
}

main();
