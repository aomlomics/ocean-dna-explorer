export type FeaturedOrganismGroup =
	| "Fish"
	| "Invertebrate animals"
	| "Invertebrate organisms"
	| "Protists and Microbial Eukaryotes"
	| "Other";

export type FeaturedOrganism = {
	/** Stable internal id (used as React key). */
	id: string;
	group: FeaturedOrganismGroup;

	/** Display name (usually italicized scientific name). */
	taxonomyName: string;

	/**
	 * GBIF taxonKey (backbone / species key). When present, we can fetch:
	 * - common name (GBIF vernacularNames)
	 * - IUCN-ish category (from GBIF threatStatus distributions)
	 */
	gbifTaxonKey?: number;

	/**
	 * Optional future hook: a canonical taxonomy string that matches your DB taxonomy row.
	 * Not used for routing yet (for now, "View taxonomy" always goes to `/explore/taxonomy` list).
	 */
	taxonomyString?: string;

	/** Local public asset under `/public/images/featured_organisms/`. */
	imageSrc?: string;
	/** Optional credit line for the image (shown via a small photo icon). */
	imageAttribution?: string;

	description: string;
};

export const FEATURED_ORGANISM_GROUPS: { id: FeaturedOrganismGroup; label: string }[] = [
	{ id: "Fish", label: "Fish" },
	{ id: "Invertebrate animals", label: "Invertebrate animals" },
	{ id: "Invertebrate organisms", label: "Invertebrate organisms" },
	{ id: "Protists and Microbial Eukaryotes", label: "Protists and Microbial Eukaryotes" },
	{ id: "Other", label: "Other" }
];

/**
 * Bones-only data registry.
 * Next step: fill each group with up to 6 organisms (≈30 total).
 */
export const FEATURED_ORGANISMS: FeaturedOrganism[] = [
	{
		id: "diaphus-dumerilii",
		group: "Fish",
		taxonomyName: "Diaphus dumerilii",
		taxonomyString: "Eukaryota;Chordata;Actinopteri;Myctophiformes;Myctophidae;Diaphus;Diaphus dumerilii",
		imageSrc: "/images/featured_organisms/lanternfish.webp",
		imageAttribution: "Taken by NOAA Fisheries.",
		description:
			"Belonging to the family Myctophidae, lanternfish are literally the most abundant fish in the entire world! Their bodies are studded with special light organs called photophores. These glowing spots act like biological multitools. The fish flash these lights for signaling species identity, attracting mates via sexual selection, hunting down prey, and blending perfectly into the glowing ocean water to hide."
	}
];

