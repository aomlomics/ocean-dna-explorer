"use client";

import Image from "next/image";
import Link from "next/link";
import { PhotoIcon } from "@/app/components/icons";
import { exploreUrl } from "@/app/helpers/utils";
import { useEffect, useMemo, useState } from "react";
import { MasonryPhotoAlbum, type Photo, type RenderImageContext, type RenderImageProps } from "react-photo-album";
import "react-photo-album/masonry.css";
import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import type { AttributionModel, ImageModel } from "@/app/generated/prismaImages/models";

export type SpotlightWithImage = TaxonomySpotlightModel & {
	Image?: ImageModel & { Attribution: AttributionModel | null };
};

export type FeaturedOrganismGroup =
	| "Fish"
	| "Invertebrate animals"
	| "Invertebrate organisms"
	| "Protists and Microbial Eukaryotes"
	| "Marine Mammals"
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
	 * Must be a single taxonomy path (never a list of taxonomy strings).
	 */
	taxonomyString?: string;
	commonName?: string;
	iucnStatus?: string;

	/** Local public asset under `/public/images/featured_organisms/`. */
	imageSrc?: string;
	imageUrl?: string;

	/** Optional image display/credit metadata mirroring the Image table fields. */
	imageName?: string;
	imageSourceUrl?: string;
	attributionTitle?: string;
	attributionNames?: string;
	attributionInstitution?: string;
	attributionUrl?: string;
	licenseName?: string;
	licenseUrl?: string;
	location?: string;
	/** Optional credit line for the image (shown via a small photo icon). */
	imageAttribution?: string;

	description: string;
};

type FeaturedImageAttribution = {
	commonName?: string;
	imageName?: string;
	imageSourceUrl?: string;
	attributionTitle?: string;
	attributionNames?: string;
	attributionInstitution?: string;
	attributionUrl?: string;
	licenseName?: string;
	licenseUrl?: string;
	location?: string;
};

const FEATURED_IMAGE_ATTRIBUTIONS: Record<string, FeaturedImageAttribution> = {
	"mola_mola.png": {
		commonName: "Ocean sunfish",
		attributionTitle: "iNaturalist - Brandon Huelga",
		attributionNames: "Brandon Heulga",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/bahuelga",
		imageName: "Mola mola",
		imageSourceUrl: "https://www.gbif.org/occurrence/6147292914",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"pacific_viperfish.jpg": {
		commonName: "Pacific viperfish",
		attributionTitle: "iNaturalist - Alex Bairstow",
		attributionNames: "Alex Bairstow",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/alex_bairstow",
		imageName: "Pacific Viperfish",
		imageSourceUrl: "https://www.gbif.org/occurrence/2013692220",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"barreleye_fish.jpg": {
		commonName: "Barreleye fish",
		attributionTitle: "Flickr - GreenAnswers",
		attributionNames: "GreenAnswers",
		attributionInstitution: "GreenAnswers",
		attributionUrl: "https://www.flickr.com/photos/40199468@N07/",
		imageName: "Barreleye Fish",
		imageSourceUrl:
			"https://www.flickr.com/photos/40199468@N07/4046660963/in/photolist-63yA5q-ptvw1n-655adh-7aAcjB-aNd4Ut-63zmuc-2j23GA3-p2JXXs-2j23GE6-7eu8Zy-7U3aa5-23FtZeK-63pAMv-dik8jQ-2rrx62D-ppg1ie-p7CN2K-2ok1KYc-qBQxaV-2eYsGEc-fk4s7H-cBoD5C-oH5LqU-2jNorTJ-f5ixPd-26MRxJV-fkiytQ-fk4pve-63bnen-6ehzAC-6SgfJL-dy4Jzt-63fCDC-7pRDQK-9hmExY-2opGdVo",
		licenseName: "CC BY-NC-SA 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/2.0/deed.en"
	},
	"snailfish.jpg": {
		commonName: "Blacktail snailfish",
		attributionTitle: "WHERE DID WE GET THIS PHOTO?"
	},
	"lanternfish.jpg": {
		commonName: "Lanternfish",
		attributionTitle: "NOAA Fisheries - Mike Jech",
		attributionNames: "Mike Jech",
		attributionInstitution: "NOAA Fisheries",
		attributionUrl: "https://www.fisheries.noaa.gov/science-blog/deep-see-cruise-explores-ocean-twilight-zone",
		imageName: "Lanternfish",
		imageSourceUrl: "https://www.fisheries.noaa.gov/science-blog/deep-see-cruise-explores-ocean-twilight-zone"
	},
	"ghost_shark.png": {
		commonName: "Ghost shark",
		attributionTitle: "iNaturalist - Nick Horniblow",
		attributionNames: "Nick Horniblow",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/nickhorniblow",
		imageName: "Ghost Shark",
		imageSourceUrl: "https://www.gbif.org/occurrence/5076978201",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
		location: "Tasman Sea, Blackmans Bay, TAS, AU"
	},
	"longicauda.jpg": {
		commonName: "Deep Sea Cucumber",
		attributionTitle: "NOAA Ocean Exploration",
		attributionInstitution: "NOAA Ocean Exploration",
		attributionUrl: "https://oceanexplorer.noaa.gov/multimedia/",
		imageName: "Deep Sea Cucumber",
		imageSourceUrl: "https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210201/"
	},
	"atolla.jpg": {
		commonName: "Coronate jellyfish",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageName: "expn3533",
		imageSourceUrl: "https://www.flickr.com/photos/noaaphotolib/27907473986/in/photolist-Jw66JA",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"spirobranchus.png": {
		commonName: "Christmas Tree Worms",
		attributionTitle: "iNaturalist - tallomd",
		attributionNames: "tallomd",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/tallomd",
		imageSourceUrl: "https://www.gbif.org/occurrence/5908873905",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"nereis.png": {
		commonName: "Marine polychaete worm",
		attributionTitle: "iNaturalist - interstitial_human",
		attributionNames: "interstitial_human",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/interstitial_human",
		imageSourceUrl: "https://www.gbif.org/occurrence/5166998946",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"strongylocentrotus_sea_urchin.png": {
		commonName: "Purple Sea Urchin",
		attributionTitle: "iNaturalist - Orenda Randuch",
		attributionNames: "Orenda Randuch",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/orenda3",
		imageSourceUrl: "https://www.gbif.org/occurrence/5938357558",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"ptychogastria_polaris.png": {
		commonName: "Benthic hydrozoan jelly",
		attributionTitle: "iNaturalist - Justin Hofman",
		attributionNames: "Justin Hofman",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/justinhofman13",
		imageSourceUrl: "https://www.gbif.org/occurrence/5237738684",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"green_bomber_worm.png": {
		commonName: "Bombardier Worm",
		attributionTitle: "iNaturalist - Warren R. Francis",
		attributionNames: "Warren R. Francis",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/wrfbiolum",
		imageSourceUrl: "https://www.gbif.org/occurrence/4909263464",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"cystisoma.jpg": {
		commonName: "Crystal amphipod",
		attributionTitle: "NOAA Ocean Exploration - David Shale",
		attributionNames: "David Shale",
		attributionInstitution: "NOAA Ocean Exploration",
		attributionUrl: "https://oceanexplorer.noaa.gov/multimedia/",
		imageSourceUrl:
			"https://oceanexplorer.noaa.gov/multimedia/okeanos-explorations-22voyage-to-the-ridge-features-cg-fracture-zone-media-cystisoma/"
	},
	"actinoptychus_splendens.png": {
		commonName: "Marine diatom",
		attributionTitle: "iNaturalist - Peter Kamen",
		attributionNames: "Peter Kamen",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/peterkamen",
		imageSourceUrl: "https://www.gbif.org/occurrence/6147209171",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"dysidea_sponge.png": {
		commonName: "Lavender-grey web sponge",
		attributionTitle: "iNaturalist - uwkwaj",
		attributionNames: "Jeanette Johnson, Scott Johnson",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/uwkwaj",
		imageSourceUrl: "https://www.gbif.org/occurrence/5237731357",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"capitella.png": {
		commonName: "Gallery worm",
		attributionTitle: "iNaturalist - Chris Isaacs",
		attributionNames: "Chris Isaacs",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/sacisaacs",
		imageSourceUrl: "https://www.gbif.org/occurrence/5007921585",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"calanus.jpg": {
		commonName: "Calanus copepod",
		attributionTitle: "Flickr - Frost Museum",
		attributionInstitution: "Frost Museum",
		attributionUrl: "https://flickr.com/photos/93467196@N02/",
		imageName: "Copepod",
		imageSourceUrl: "https://flickr.com/photos/93467196@N02/14086012413",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"acartia.png": {
		commonName: "Acartia copepod",
		attributionTitle: "iNaturalist - scienceco_fn",
		attributionNames: "scienceco_fn",
		attributionUrl: "https://www.inaturalist.org/people/scienceco_fn",
		imageSourceUrl: "https://www.gbif.org/occurrence/5139927686",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"daphnia.png": {
		commonName: "Water flea",
		attributionTitle: "iNaturalist - rdegeer",
		attributionNames: "rdegeer",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/rdegeer",
		imageSourceUrl: "https://www.gbif.org/occurrence/4599871558",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"mytilus_blue_mussel.png": {
		commonName: "Mussel",
		attributionTitle: "iNaturalist - Alexander Summers",
		attributionNames: "Alexander Summers",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/alexander4615",
		imageSourceUrl: "https://www.gbif.org/occurrence/5938121031",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"crassostrea.png": {
		commonName: "True oyster",
		attributionTitle: "iNaturalist - thesnailwhisperer",
		attributionNames: "thesnailwhisperer",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/thesnailwhisperer",
		imageSourceUrl: "https://www.gbif.org/occurrence/6131617266",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"aplysia.png": {
		commonName: "California sea hare",
		attributionTitle: "iNaturalist - phelsumas4life",
		attributionNames: "phelsumas4life",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/phelsumas4life",
		imageSourceUrl: "https://www.gbif.org/occurrence/6130572876",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"aurelia.jpg": {
		commonName: "Moon jellyfish",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageName: "reef2547",
		imageSourceUrl: "https://www.flickr.com/photos/noaaphotolib/",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"strombidium.png": {
		commonName: "Oligotrich ciliates",
		attributionTitle: "GBIF Occurrence - Collections of Bioclass, School #179, Moscow",
		attributionInstitution: "Collections of Bioclass, School #179, Moscow",
		attributionUrl: "https://www.gbif.org/occurrence/2573691766",
		imageSourceUrl: "https://www.gbif.org/occurrence/2573691766",
		licenseName: "CC0 1.0",
		licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/legalcode"
	},
	"tintinnopsis.png": {
		commonName: "Tintinnids",
		attributionTitle: "iNaturalist - kristobal22",
		attributionNames: "kristobal22",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/kristobal22",
		imageSourceUrl: "https://www.gbif.org/occurrence/4607168833",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"mesodinium.png": {
		commonName: "Red water ciliate",
		attributionTitle: "iNaturalist - Vicente Franch Meneu",
		attributionNames: "Vicente Franch Meneu",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/vicentefranch",
		imageSourceUrl: "https://www.gbif.org/occurrence/3039391269",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"cercomonas.png": {
		commonName: "Bacterivorous flagellates",
		attributionTitle: "iNaturalist - peptolab",
		attributionNames: "peptolab",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/peptolab",
		imageSourceUrl: "https://www.gbif.org/occurrence/6185869897",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"chaetoceros.png": {
		commonName: "Chaetoceros diatoms",
		attributionTitle: "iNaturalist - Ken Koll",
		attributionNames: "Ken Koll",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/kenk",
		imageSourceUrl: "https://www.gbif.org/occurrence/6133487928",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"emiliania.jpg": {
		commonName: "Coccolithophore",
		attributionTitle: "Wikimedia Commons - Dr. Jeremy Young",
		attributionNames: "Dr. Jeremy Young",
		attributionInstitution: "University College London",
		attributionUrl: "https://commons.wikimedia.org/wiki/File:Emiliania_huxleyi.jpg",
		imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Emiliania_huxleyi.jpg",
		licenseName: "CC BY-SA 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
	},
	"karlodinium.jpg": {
		commonName: "Karlodinium dinoflagellate",
		attributionTitle: "Flickr - FWC Fish and Wildlife Research Institute",
		attributionInstitution: "FWC Fish and Wildlife Research Institute",
		attributionUrl: "https://www.flickr.com/photos/myfwc/",
		imageName: "Karlodinium veneficum (light micrograph)",
		imageSourceUrl: "https://www.flickr.com/photos/myfwc/5808219516/in/photolist-edV2z1-9RfDiN-9RcKf8-DqXhKE-neK57e",
		licenseName: "CC BY-NC-ND 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc-nd/2.0/deed.en"
	},
	"tripos.png": {
		commonName: "Horned dinoflagellate",
		attributionTitle: "iNaturalist - Ken Koll",
		attributionNames: "Ken Koll",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/kenk",
		imageSourceUrl: "https://www.gbif.org/occurrence/6188131004",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"noctiluca.png": {
		commonName: "Sea sparkle",
		attributionTitle: "iNaturalist - jsoria",
		attributionNames: "jsoria",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/jsoria",
		imageSourceUrl: "https://www.gbif.org/occurrence/4976554350",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"karenia.png": {
		commonName: "Florida red tide",
		attributionTitle: "iNaturalist - Faith Colemon (Cook)",
		attributionNames: "Faith Colemon (Cook)",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/faithcoleman",
		imageSourceUrl: "https://www.gbif.org/occurrence/5187626596",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"thalassiosira.png": {
		commonName: "Centric diatom",
		attributionTitle: "GBIF Occurrence - Princess Maha Chakri Sirindhorn Natural History Museum",
		attributionInstitution: "Princess Maha Chakri Sirindhorn Natural History Museum",
		attributionUrl: "https://www.gbif.org/occurrence/5106151977",
		imageSourceUrl: "https://www.gbif.org/occurrence/5106151977",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/legalcode"
	},
	"phaeocystis.png": {
		commonName: "Foam Algae",
		attributionTitle: "GBIF Occurrence - Ben Delbaere",
		attributionNames: "Ben Delbaere",
		attributionUrl: "https://observation.org/photos/88323182.jpg",
		imageSourceUrl: "https://www.gbif.org/occurrence/4888728219",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"baleen_whales.jpg": {
		commonName: "Baleen whales",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageName: "anim1754 Blue whale",
		imageSourceUrl: "https://www.flickr.com/photos/noaaphotolib/",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"toothed_whales.png": {
		commonName: "Toothed whales",
		attributionTitle: "iNaturalist - lmk96",
		attributionNames: "lmk96",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/lmk96",
		imageSourceUrl: "https://www.gbif.org/occurrence/6133146298",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"small_cetaceans.png": {
		commonName: "Small ceteceans",
		attributionTitle: "iNaturalist - Travis Nolan",
		attributionNames: "Travis Nolan",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/tankoda",
		imageName: "Dall's Porpoise",
		imageSourceUrl: "https://www.gbif.org/occurrence/5291789416",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"aspergillus.png": {
		commonName: "Aspergillus mold",
		attributionTitle: "iNaturalist - Hernan Perales Herrera",
		attributionNames: "Hernan Perales Herrera",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/crispychris28",
		imageSourceUrl: "https://www.gbif.org/occurrence/5938631776",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"rhizopus.jpeg": {
		commonName: "Rhizopus mold",
		attributionTitle: "Adobe Stock - ggw",
		attributionNames: "ggw",
		attributionUrl: "https://stock.adobe.com/contributor/200465992/ggw?load_type=author&prev_url=detail",
		imageSourceUrl: "https://stock.adobe.com/contributor/200465992/ggw?load_type=author&prev_url=detail",
		licenseName: "Adobe Stock Education License",
		licenseUrl: "https://stock.adobe.com/license-terms"
	},
	"saprolegnia.png": {
		commonName: "Saprolegnia water mold",
		attributionTitle: "iNaturalist - Sean Cozart",
		attributionNames: "Sean Cozart",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/birdwhisperer",
		imageSourceUrl: "https://www.gbif.org/occurrence/5086985651",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"trichodesmium.png": {
		commonName: "Sea sawdust",
		attributionTitle: "iNaturalist - Thomas Gyselinck",
		attributionNames: "Thomas Gyselinck",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/thomas-",
		imageSourceUrl: "https://www.gbif.org/occurrence/6185848546",
		licenseName: "CC BY 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
	},
	"salpa.png": {
		commonName: "Sea Salps",
		attributionTitle: "iNaturalist - Sylvain Le Bris",
		attributionNames: "Sylvain Le Bris",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/sylvain_le_bris",
		imageSourceUrl: "https://www.gbif.org/occurrence/6273938514",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"branchiostoma.png": {
		commonName: "Lancelet",
		attributionTitle: "iNaturalist - squidpastry",
		attributionNames: "squidpastry",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/squidpastry",
		imageSourceUrl: "https://www.gbif.org/occurrence/4946190312",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"beroe.png": {
		commonName: "Cigar comb jelly",
		attributionTitle: "iNaturalist - JA Fields",
		attributionNames: "JA Fields",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/ja_fields",
		imageSourceUrl: "https://www.gbif.org/occurrence/6234257056",
		licenseName: "CC BY-NC 4.0",
		licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/"
	},
	"monosiga.jpg": {
		commonName: "Choanoflagellate",
		attributionTitle: "Wikimedia Commons - Stephen Fairclough",
		attributionNames: "Stephen Fairclough",
		attributionUrl:
			"https://commons.wikimedia.org/w/index.php?search=Monosiga+brevicollis&title=Special%3AMediaSearch&type=image",
		imageSourceUrl:
			"https://commons.wikimedia.org/w/index.php?search=Monosiga+brevicollis&title=Special%3AMediaSearch&type=image",
		licenseName: "CC BY-SA 2.5",
		licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5/"
	},
	"paulinella.png": {
		commonName: "Shelled amoeba",
		attributionTitle: "iNaturalist - onotole",
		attributionNames: "onotole",
		attributionInstitution: "iNaturalist",
		attributionUrl: "https://www.inaturalist.org/people/onotole",
		imageSourceUrl: "https://www.gbif.org/occurrence/5903769752",
		licenseName: "CC0 1.0",
		licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/"
	},
	"red_snapper.jpg": {
		commonName: "Red snapper",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageSourceUrl:
			"https://www.flickr.com/photos/noaaphotolib/9714428833/in/photolist-JbHScj-JMbHbs-JSkkvW-fNqZfi-8Usn6h-fUTZxz-23YKdpZ-fNJ12N",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"silverrag_driftfish.jpg": {
		commonName: "Silver-rag driftfish",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageName: "fish4100, Brandi Noble",
		imageSourceUrl: "https://www.flickr.com/photos/noaaphotolib/5188070068/in/photolist-8UsdtW",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	},
	"american_sackfish.jpg": {
		commonName: "American sackfish",
		attributionTitle: "Flickr - NOAA Photo Library",
		attributionInstitution: "NOAA",
		attributionUrl: "https://www.flickr.com/photos/noaaphotolib/",
		imageName: "fish4347, Brandi Noble",
		imageSourceUrl: "https://www.flickr.com/photos/noaaphotolib/5188100894/in/photolist-8UsnDq",
		licenseName: "CC BY 2.0",
		licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en"
	}
};

function cleanAttributionValue(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

function getFeaturedImageFilename(imagePath: string | undefined): string | undefined {
	if (!imagePath) return undefined;
	const withoutHash = imagePath.split("#")[0] ?? imagePath;
	const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
	const parts = withoutQuery.split("/");
	const fileName = parts[parts.length - 1];
	return fileName && fileName.trim() ? fileName.trim() : undefined;
}

function buildLegacyAttributionText(data: FeaturedImageAttribution): string | undefined {
	const title = cleanAttributionValue(data.attributionTitle);
	if (!title) return undefined;
	const institution = cleanAttributionValue(data.attributionInstitution);
	const names = cleanAttributionValue(data.attributionNames);
	const source = cleanAttributionValue(data.imageSourceUrl);
	const license = cleanAttributionValue(data.licenseName);
	const parts = [title, names, institution, source, license].filter(Boolean);
	return parts.length ? parts.join(" | ") : undefined;
}

function applyFeaturedOrganismMetadata(organisms: FeaturedOrganism[]): FeaturedOrganism[] {
	return organisms.map((organism) => {
		const fileName = getFeaturedImageFilename(organism.imageSrc ?? organism.imageUrl);
		if (!fileName) return organism;

		const metadata = FEATURED_IMAGE_ATTRIBUTIONS[fileName];
		if (!metadata) return organism;

		const merged: FeaturedOrganism = {
			...organism,
			commonName: cleanAttributionValue(metadata.commonName) ?? organism.commonName,
			imageName: cleanAttributionValue(metadata.imageName) ?? organism.imageName,
			imageSourceUrl: cleanAttributionValue(metadata.imageSourceUrl) ?? organism.imageSourceUrl,
			attributionTitle: cleanAttributionValue(metadata.attributionTitle) ?? organism.attributionTitle,
			attributionNames: cleanAttributionValue(metadata.attributionNames) ?? organism.attributionNames,
			attributionInstitution: cleanAttributionValue(metadata.attributionInstitution) ?? organism.attributionInstitution,
			attributionUrl: cleanAttributionValue(metadata.attributionUrl) ?? organism.attributionUrl,
			licenseName: cleanAttributionValue(metadata.licenseName) ?? organism.licenseName,
			licenseUrl: cleanAttributionValue(metadata.licenseUrl) ?? organism.licenseUrl,
			location: cleanAttributionValue(metadata.location) ?? organism.location
		};

		return {
			...merged,
			imageAttribution: merged.imageAttribution ?? buildLegacyAttributionText(metadata)
		};
	});
}

export const FEATURED_ORGANISM_GROUPS: { id: FeaturedOrganismGroup; label: string }[] = [
	{ id: "Fish", label: "Fish" },
	{ id: "Invertebrate animals", label: "Invertebrate animals" },
	{ id: "Invertebrate organisms", label: "Invertebrate organisms" },
	{ id: "Protists and Microbial Eukaryotes", label: "Protists and Microbial Eukaryotes" },
	{ id: "Marine Mammals", label: "Marine Mammals" },
	{ id: "Other", label: "Other" }
];

/**
 * Bones-only data registry.
 * Next step: fill each group with up to 6 organisms (≈30 total).
 */
export const FEATURED_ORGANISMS: FeaturedOrganism[] = applyFeaturedOrganismMetadata([
	{
		id: "chauliodus-macouni",
		group: "Fish",
		taxonomyName: "Chauliodus macouni",
		imageSrc: "/images/featured_organisms/pacific_viperfish.jpg",
		imageAttribution: "Image attribution pending.",
		description:
			"The Pacific viperfish is a deep-sea predator that grows up to a foot long in the dark waters of the North Pacific. They are famous for possessing extremely large, needle-like teeth that actually curl upward past their eyes. Along with a highly flexible jaw, these oversized fangs allow them to trap and swallow surprisingly large prey whole. Like many deep-sea hunters, they also rely on glowing bioluminescent spots to camouflage themselves and attract curious meals. "
	},
	{
		id: "macropinna-microstoma",
		group: "Fish",
		taxonomyName: "Macropinna microstoma",
		imageSrc: "/images/featured_organisms/barreleye_fish.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The barreleye fish is a small, six-inch deep-sea species famous for its completely transparent, fluid-filled forehead. Inside this clear dome sit two highly sensitive, bright green tubular eyes that normally point straight up to spot the shadows of prey above them. Once a meal is spotted, the fish can actually rotate its eyes completely forward to strike. Scientists believe they often use this incredible vision to steal small crustaceans right out of the tentacles of other deep-sea creatures."
	},
	{
		id: "careproctus-melanurus",
		group: "Fish",
		taxonomyName: "Careproctus melanurus",
		imageSrc: "/images/featured_organisms/snailfish.jpg",
		imageAttribution: "Source: Vercel Blob (to be updated).",
		description:
			"The blacktail snailfish is a deep-water fish found along the muddy seafloors of the North Pacific Ocean. Growing up to 20 inches long, they have a pale pink, jelly-like body ending in a distinctive dark tail. They possess a special belly fin modified into a small suction cup, which they use to anchor themselves to rocks in ocean currents. From these safe anchor points, they spend their time hovering just above the mud to hunt for small crustaceans and worms. "
	},

	// TODO: this is the only full example. we need to add: image orientation, common name?, taxonomies for all, and need real images and attributions.
	{
		id: "diaphus-dumerilii",
		group: "Fish",
		taxonomyName: "Diaphus dumerilii",
		taxonomyString: "Eukaryota;Chordata;Actinopteri;Myctophiformes;Myctophidae;Diaphus;Diaphus dumerilii",
		imageSrc: "/images/featured_organisms/lanternfish.jpg",
		imageAttribution: "Taken by NOAA Fisheries.",
		description:
			"Belonging to the family Myctophidae, lanternfish are the most abundant fish in the world's oceans. Their bodies feature special light organs called photophores, which act as biological multitools. They flash these glowing spots to signal species identity, attract mates, and hunt in the dark twilight zone. They form a crucial foundation of the global marine food web. "
	},
	{
		id: "callorhinchus-milii",
		group: "Fish",
		taxonomyName: "Callorhinchus milii",
		imageSrc: "/images/featured_organisms/ghost_shark.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The elephant fish, or ghost shark, is a fascinating cartilaginous fish closely related to sharks and rays. Growing to about four feet long, they are easily recognized by their unique, hoe-shaped snout. They use this highly specialized snout to probe the muddy sea floor to hunt for shellfish and other small invertebrates. "
	},
	{
		id: "ptychogastria-polaris",
		group: "Invertebrate animals",
		taxonomyName: "Ptychogastria polaris",
		imageSrc: "/images/featured_organisms/ptychogastria_polaris.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This cold-water jellyfish thrives in extreme polar environments. Unlike many jellyfish that constantly drift in the open ocean, they often use special adhesive tentacles to attach themselves directly to the seafloor. They are quite small and rely on this bottom-dwelling strategy to catch passing prey in frigid ocean currents. "
	},
	{
		id: "swima-bombiviridis",
		group: "Invertebrate animals",
		taxonomyName: "Swima bombiviridis",
		imageSrc: "/images/featured_organisms/green_bomber_worm.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The green bomber worm is a deep-sea marine worm with a highly unusual defense mechanism. When threatened by a predator, it releases tiny, fluid-filled sacs that burst into glowing green bioluminescent bombs. This sudden, bright flash of light distracts the predator, allowing the worm to quickly swim away into the darkness. "
	},
	{
		id: "cystisoma",
		group: "Invertebrate animals",
		taxonomyName: "Cystisoma",
		imageSrc: "/images/featured_organisms/cystisoma.jpg",
		imageAttribution: "Source: NOAA Ocean Explorer (to be updated).",
		description:
			"Cystisoma is a pelagic crustacean that lives entirely in the dark, open ocean. To hide from predators, its body is completely transparent and lacks any pigmentation, making it look exactly like a floating alien shrimp. They also have massive eyes that take up most of their head, helping them spot the faint silhouettes of prey above them. "
	},
	{
		id: "actinoptychus-splendens",
		group: "Invertebrate organisms",
		taxonomyName: "Actinoptychus splendens",
		imageSrc: "/images/featured_organisms/actinoptychus_splendens.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This species of diatom is a microscopic, single-celled alga famous for its stunning, glass-like shell. Their shells are made of silica and feature incredible geometric patterns with ornamental radial symmetry. Like other diatoms, they are vital to the ocean ecosystem because they produce a massive amount of the oxygen we breathe through photosynthesis. "
	},
	{
		id: "dysidea-cf-arenaria",
		group: "Invertebrate animals",
		taxonomyName: "Dysidea cf. arenaria",
		imageSrc: "/images/featured_organisms/dysidea_sponge.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This marine sponge is known for its soft texture and striking blue or lavender coloration. They grow in irregular, lobed formations permanently attached to the sea floor. As efficient filter feeders, they constantly pump seawater through their porous bodies to extract microscopic food and dissolved nutrients. "
	},
	{
		id: "capitella",
		group: "Invertebrate animals",
		taxonomyName: "Capitella",
		imageSrc: "/images/featured_organisms/capitella.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Capitella worms are small marine worms that live entirely buried in coastal sediments. They are incredibly tolerant of poor water conditions and actually thrive in heavily polluted environments where other marine life cannot survive. Because of this, scientists frequently use them as bioindicators to identify coastal areas suffering from severe organic pollution. "
	},
	{
		id: "calanus",
		group: "Invertebrate animals",
		taxonomyName: "Calanus",
		imageSrc: "/images/featured_organisms/calanus.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"Calanus copepods are tiny crustaceans that form a massive and crucial component of the ocean's zooplankton. They are grazing powerhouses that consume vast amounts of microscopic marine algae. By doing this, they act as a vital energy bridge, transferring the sun's energy from tiny plants up to the commercial fish, seabirds, and whales that eat them. "
	},
	{
		id: "acartia",
		group: "Invertebrate animals",
		taxonomyName: "Acartia",
		imageSrc: "/images/featured_organisms/acartia.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Acartia is a common genus of small copepods found abundantly in coastal waters and estuaries around the world. They are fast swimmers that dart through the water column feeding heavily on phytoplankton. They serve as a primary food source for many commercial fish species during their highly vulnerable early larval stages. "
	},
	{
		id: "daphnia",
		group: "Invertebrate animals",
		taxonomyName: "Daphnia",
		imageSrc: "/images/featured_organisms/daphnia.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Commonly known as water fleas, Daphnia are microscopic crustaceans found heavily in freshwater lakes and ponds. They have a completely transparent body that allows scientists to easily observe their internal organs, including their beating hearts, under a microscope. Because they are highly sensitive to environmental changes, they are widely used globally in ecological research and water toxicity testing. "
	},
	{
		id: "mytilus",
		group: "Invertebrate animals",
		taxonomyName: "Mytilus",
		imageSrc: "/images/featured_organisms/mytilus_blue_mussel.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Mytilus is a genus of widely recognized marine mussels found clinging to rocky coastlines across the globe. They attach themselves to hard surfaces using incredibly strong, natural threads that withstand crashing waves. They are powerful filter feeders that help clean coastal waters and represent a major, highly sustainable food source in the global aquaculture industry. "
	},
	{
		id: "crassostrea",
		group: "Invertebrate animals",
		taxonomyName: "Crassostrea",
		imageSrc: "/images/featured_organisms/crassostrea.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Crassostrea oysters are iconic marine bivalves that construct massive underwater reefs over generations. These reefs act as critical infrastructure in coastal waters, providing safe nursery habitats for countless other fish and crab species. A single adult oyster can also filter dozens of gallons of water a day, making them absolutely essential for keeping estuaries clean. "
	},
	/*{
		id: "loligo",
		group: "Invertebrate animals",
		taxonomyName: "Loligo",
		imageAttribution: "Image attribution pending.",
		description:
			"Loligo is a widely distributed genus of fast-swimming squids found primarily in shallow coastal waters. They are highly active predators that use their specialized tentacles and sharp beaks to hunt small fish and crustaceans. They are an incredibly important food source for marine mammals and represent a massive target for global commercial fisheries. "
	},*/
	{
		id: "aplysia",
		group: "Invertebrate animals",
		taxonomyName: "Aplysia",
		imageSrc: "/images/featured_organisms/aplysia.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Commonly known as sea hares, Aplysia are large herbivorous sea slugs that graze constantly on marine algae. They are famous for releasing a thick cloud of purple ink when threatened to confuse potential predators. Because they possess very large, easily identifiable nerve cells, they are one of the most important model organisms used in human neurobiology and memory research. "
	},
	/*{
		id: "asterias",
		group: "Invertebrate animals",
		taxonomyName: "Asterias",
		imageAttribution: "Image attribution pending.",
		description:
			"Asterias sea stars are instantly recognizable marine invertebrates commonly found in rocky intertidal zones. They are slow but relentless predators that primarily hunt mussels, barnacles, and oysters. They use their powerful tube feet to slowly pry open shells and actually push their stomachs outside their bodies to digest their prey alive. "
	},*/
	/*{
		id: "mnemiopsis",
		group: "Invertebrate animals",
		taxonomyName: "Mnemiopsis",
		imageAttribution: "Image attribution pending.",
		description:
			"Mnemiopsis is a gelatinous, transparent comb jelly native to the western Atlantic Ocean. Unlike true jellyfish, they do not have stinging tentacles and instead use sticky cells to capture small zooplankton. They are notorious for being a highly destructive invasive species, capable of completely collapsing local food webs when introduced to new environments like the Black Sea. "
	},*/
	{
		id: "aurelia",
		group: "Invertebrate animals",
		taxonomyName: "Aurelia",
		imageSrc: "/images/featured_organisms/aurelia.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The moon jellyfish is an incredibly common marine species found floating in coastal waters all over the world. They are easily identified by their translucent, saucer-shaped bells and the four distinct horseshoe-shaped reproductive organs visible inside them. They are weak swimmers that mostly drift with ocean currents, feeding harmlessly on tiny plankton. "
	},
	{
		id: "alexandrium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Alexandrium",
		imageSrc: "/images/featured_organisms/alexandrium.jpg",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Alexandrium is a microscopic marine plankton known for its massive impact on coastal economies and human health. Under certain conditions, they multiply rapidly to form massive, harmful algal blooms. Some species produce a potent neurotoxin that accumulates in filter-feeding shellfish, which can cause severe paralytic shellfish poisoning in humans who consume them. "
	},
	{
		id: "karlodinium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Karlodinium",
		imageSrc: "/images/featured_organisms/karlodinium.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			'Karlodinium is a microscopic marine alga frequently found in estuaries and shallow coastal waters worldwide. While normally harmless in small numbers, they can bloom densely and release specialized toxins directly into the water. These unique "karlotoxins" severely damage the gills of fish, making this organism responsible for devastating fish kills globally. '
	},
	{
		id: "tripos",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Tripos",
		imageSrc: "/images/featured_organisms/tripos.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Tripos is a genus of large, single-celled marine plankton easily identified by their distinct, three-pronged shape. They grow long, horn-like extensions that significantly increase their surface area. This unique geometry acts like a microscopic parachute, preventing them from sinking and helping them regulate their buoyancy in the sunlit upper ocean. "
	},
	{
		id: "noctiluca",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Noctiluca",
		imageSrc: "/images/featured_organisms/noctiluca.png",
		imageAttribution: "Sources: Flickr and GBIF occurrence (to be updated).",
		description:
			"Noctiluca is a circular, single-celled organism famous for producing incredible marine light shows. When massive numbers gather near the coast, they can make the water look heavily discolored during the day. At night, physical disturbance from crashing waves or passing boats triggers them to emit a stunning, bright blue bioluminescent glow. "
	},
	{
		id: "karenia",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Karenia",
		imageSrc: "/images/featured_organisms/karenia.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			'Karenia is a notorious genus of marine phytoplankton primarily found blooming in the Gulf of America. They are the primary organisms responsible for extreme "red tide" events that discolor the water. During these massive blooms, they release airborne toxins that kill vast amounts of marine life and can cause severe respiratory irritation in humans living near the coast. '
	},
	/*{
		id: "ammonia",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Ammonia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Ammonia is a type of microscopic, single-celled organism that builds beautiful, tiny spiral shells out of calcium carbonate. They live predominantly in the muddy sediments of shallow coastal waters and estuaries. Because their shell growth is highly sensitive to surrounding water quality, scientists frequently study them to monitor historical and modern pollution levels. "
	},*/
	/*{
		id: "globigerina",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Globigerina",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Globigerina are single-celled marine organisms that drift freely in the sunlit layers of the open ocean. They construct tiny, complex shells that fall to the deep seafloor when the organism dies. These millions of accumulated fossil shells serve as microscopic time capsules, allowing scientists to reconstruct ancient ocean temperatures and historical climate changes. "
	},*/
	{
		id: "thalassiosira",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Thalassiosira",
		imageSrc: "/images/featured_organisms/thalassiosira.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Thalassiosira is a widespread genus of microscopic marine algae encased in intricate, pillbox-like silica shells. They frequently link together in long, beautiful chains and thrive in cold, highly nutrient-rich waters. As highly efficient photosynthesizers, they are responsible for a massive portion of the global ocean's primary food and oxygen production. "
	},
	{
		id: "phaeocystis",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Phaeocystis",
		imageSrc: "/images/featured_organisms/phaeocystis.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Phaeocystis is a fascinating type of marine phytoplankton that can exist as single cells or as massive, floating gelatinous colonies that resemble sea foam. When these massive ocean blooms eventually die, they release huge amounts of sulfur compounds into the atmosphere. This biological process actually helps seed cloud formation over the ocean, playing a surprising role in regulating the global climate. "
	},
	/*{
		id: "ostreococcus",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Ostreococcus",
		imageAttribution: "Image attribution pending.",
		description: ""
	},*/
	{
		id: "baleen-whales",
		group: "Marine Mammals",
		taxonomyName: "Baleen whales (Balaenoptera musculus, B. physalus, B. acutorostrata, Megaptera novaeangliae)",
		imageSrc: "/images/featured_organisms/baleen_whales.jpg",
		imageAttribution: "Sources: GBIF occurrence and Flickr (to be updated).",
		description:
			"Baleen whales represent some of the largest animals to have ever lived on Earth, including the massive blue whale. Instead of teeth, they have giant plates of bristly baleen hanging from their upper jaws to filter vast amounts of tiny krill and fish from the ocean. They are highly intelligent, communicative mammals that undertake some of the longest seasonal migrations on the planet. "
	},
	{
		id: "toothed-whales",
		group: "Marine Mammals",
		taxonomyName: "Toothed whales (Orcinus orca)",
		imageSrc: "/images/featured_organisms/toothed_whales.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Toothed whales include highly recognizable, highly intelligent marine predators like the killer whale, or orca. They are apex predators equipped with sharp teeth and rely on advanced echolocation to hunt fish, squid, and even other marine mammals. They possess incredibly complex social structures and are known to pass down distinct hunting techniques through familial generations. "
	},
	{
		id: "small-cetaceans",
		group: "Marine Mammals",
		taxonomyName: "Small cetaceans (Phocoenoides dalli, Mesoplodon spp.)",
		imageSrc: "/images/featured_organisms/small_cetaceans.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Smaller cetaceans include marine mammals like Dall's porpoise, or Bottlenose dolphin. They are incredibly fast and energetic swimmers, frequently seen actively riding the bow waves of passing boats. Despite their incredible speed, they remain a vital food source for larger apex predators like great white sharks and transient killer whales. "
	},
	{
		id: "ariomma-bondi",
		group: "Fish",
		taxonomyName: "Ariomma bondi",
		imageSrc: "/images/featured_organisms/silverrag_driftfish.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The silver-rag driftfish is a relatively small, deep-bodied fish found throughout the western Atlantic Ocean. They have a brilliant silvery appearance and typically school together in deeper offshore waters over muddy seafloors. Though largely obscure to the public, they serve as an incredibly important forage fish for larger deep-water marine predators. "
	},
	{
		id: "neoepinnula-americana",
		group: "Fish",
		taxonomyName: "Neoepinnula americana",
		imageSrc: "/images/featured_organisms/american_sackfish.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The American sackfish is an elongated, predatory fish found in the deep waters of the western Atlantic and Gulf of Mexico. They possess a long, sleek body equipped with sharp teeth designed perfectly for hunting smaller fish and squid in the dark. They are typically found hovering near the ocean bottom at depths up to several thousand feet. "
	},
	{
		id: "baldwinella-aureorubens",
		group: "Fish",
		taxonomyName: "Baldwinella aureorubens",
		imageSrc: "/images/featured_organisms/streamer_bass.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The streamer bass is a beautifully colored fish found inhabiting deep coral reefs and rocky ledges in the western Atlantic. They are relatively small and feature striking red and golden hues that help them blend into deep-water environments. They are a classic, beautiful example of the vibrant and hidden biodiversity found in deep marine ecosystems. "
	},
	{
		id: "parascombrops-spinosus",
		group: "Fish",
		taxonomyName: "Parascombrops spinosus",
		imageSrc: "/images/featured_organisms/keelcheek_bass.jpg",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The keelcheek bass is a small, deep-water marine fish frequently found occupying the Gulf of Mexico. They live near muddy or sandy seafloors at significant depths, usually well below the reach of recreational scuba divers. They are primarily bottom-dwellers that feed entirely on tiny deep-sea crustaceans and smaller juvenile fish. "
	},
	{
		id: "maurolicus-weitzmani",
		group: "Fish",
		taxonomyName: "Maurolicus weitzmani",
		imageSrc: "/images/featured_organisms/atlantic_pearlside.png",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The Atlantic pearlside is a tiny, deep-sea fish that forms massive, dense schools in the open ocean. Like many twilight zone inhabitants, their bellies are lined with glowing photophores that help camouflage their silhouettes against the faint light from the surface. They undertake massive daily migrations, swimming up at night to feed before returning to the deep safety of the dark during the day. "
	},
	{
		id: "mola-mola",
		group: "Fish",
		taxonomyName: "Mola mola",
		commonName: "Mola mola",
		taxonomyString: "Animalia;Chordata;Teleostei;Tetraodontiformes;Molidae;Mola;Mola mola",
		imageSrc: "/images/featured_organisms/mola_mola.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6147292914 (local filename pending).",
		description:
			"Mola mola is the heaviest known bony fish in the world and can weigh over two tons. They have a highly unusual, flattened body shape that makes them look like a giant swimming fish head. Despite their massive size, they primarily feed on low calorie jellyfish and must consume huge amounts of them to survive. They are frequently spotted basking on their sides at the ocean surface to let seabirds pick parasites off their rough skin."
	},
	{
		id: "psychropotes-longicauda",
		group: "Invertebrate animals",
		taxonomyName: "Psychropotes longicauda",
		commonName: "Psychropotes longicauda",
		taxonomyString:
			"Animalia;Echinodermata;Holothuroidea;Elasipodida;Psychropotidae;Psychropotes;Psychropotes longicauda",
		imageSrc: "/images/featured_organisms/longicauda.jpg",
		imageAttribution:
			"Source: https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210201/ (local filename pending).",
		description:
			"Psychropotes longicauda is a striking deep-water sea cucumber typically found in deep shades of red or purple. It features a strange appendage that looks like a sail sticking out of its body to help it navigate slow ocean currents. They act as the vacuum cleaners of the deep sea floor by slowly crawling along the mud to consume fallen organic matter. By constantly turning over the sediment, they play a massive role in recycling nutrients in the otherwise barren abyssal plain."
	},
	{
		id: "atolla",
		group: "Invertebrate animals",
		taxonomyName: "Atolla",
		commonName: "Atolla",
		taxonomyString: "Eukaryota;Cnidaria;Scyphozoa;Coronatae;Atollidae;Atolla",
		imageSrc: "/images/featured_organisms/atolla.jpg",
		imageAttribution:
			"Source: https://www.flickr.com/photos/noaaphotolib/27907473986/in/photolist-Jw66JA (local filename pending).",
		description:
			"Atolla is a deep-sea jellyfish instantly recognizable by its dark red coloration and unique crown shape. The red color actually acts as deep-sea camouflage because red light does not penetrate the deep ocean, rendering them effectively invisible. If a predator manages to find them, they trigger a spectacular circular light show of bright blue bioluminescence. This glowing display functions like a burglar alarm to attract an even larger predator to eat their attacker."
	},
	{
		id: "spirobranchus-corniculatus",
		group: "Invertebrate animals",
		taxonomyName: "Spirobranchus corniculatus",
		commonName: "Spirobranchus corniculatus",
		taxonomyString: "Eukaryota;Annelida;Polychaeta;Sabellida;Serpulidae;Spirobranchus;Spirobranchus corniculatus",
		imageSrc: "/images/featured_organisms/spirobranchus.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5908873905 (local filename pending).",
		description:
			"Spirobranchus corniculatus is a marine worm famous for producing spiraling, brightly colored structures that look exactly like tiny pine trees. These festive appendages are actually highly specialized gills used for breathing and catching floating microscopic prey. The worm itself spends its entire life hidden inside a calcium carbonate tube anchored firmly into living coral reefs. They are incredibly sensitive to movement and will instantly retract their colorful crowns into their tubes if they detect a shadow passing overhead."
	},
	{
		id: "nereis-heterocirrata",
		group: "Invertebrate animals",
		taxonomyName: "Nereis heterocirrata",
		commonName: "Nereis heterocirrata",
		taxonomyString: "Eukaryota;Annelida;Polychaeta;Phyllodocida;Nereididae;Nereis;Nereis heterocirrata",
		imageSrc: "/images/featured_organisms/nereis.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5166998946 (local filename pending).",
		description:
			"Nereis heterocirrata is a highly active marine worm equipped with dozens of bristle-covered appendages along its body. These legs allow them to rapidly swim through the water or quickly burrow into coastal mud when hunting. They have a powerful pair of retractable jaws used to capture smaller invertebrates or tear apart marine algae. Because they are an abundant source of protein, they serve as a critical food source for coastal shorebirds and larger predatory fish."
	},
	{
		id: "strongylocentrotus-purpuratus",
		group: "Invertebrate animals",
		taxonomyName: "Strongylocentrotus purpuratus",
		commonName: "Strongylocentrotus purpuratus",
		taxonomyString:
			"Eukaryota;Echinodermata;Echinoidea;Camarodonta;Strongylocentrotidae;Strongylocentrotus;Strongylocentrotus purpuratus",
		imageSrc: "/images/featured_organisms/strongylocentrotus_sea_urchin.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5938357558 (local filename pending).",
		description:
			"Strongylocentrotus is a heavily armored marine invertebrate covered in sharp purple spines that protect it from hungry sea otters. They are highly efficient grazers that use a complex mouth structure to scrape algae and kelp off rocky sea floors. While they are a natural part of the coastal ecosystem, they can completely decimate massive kelp forests if their natural predators are removed. Left unchecked, dense groups of these urchins can transform a thriving underwater forest into a barren wasteland."
	},
	{
		id: "strombidium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Strombidium",
		commonName: "Strombidium",
		imageSrc: "/images/featured_organisms/strombidium.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/2573691766 (local filename pending).",
		description:
			"Strombidium is a genus of microscopic single-celled organisms found heavily throughout the global ocean. They are incredibly active swimmers that use tiny hair-like structures called cilia to dart through the water column. As voracious grazers, they constantly hunt down marine bacteria and smaller phytoplankton. Some species have even evolved the ability to steal the chloroplasts from the algae they eat and use them to perform photosynthesis for extra energy."
	},
	{
		id: "tintinnopsis",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Tintinnopsis",
		commonName: "Tintinnopsis",
		imageSrc: "/images/featured_organisms/tintinnopsis.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/4607168833 (local filename pending).",
		description:
			"Tintinnopsis is a fascinating microscopic organism that constructs its own protective mobile home. They build tiny, vase-shaped shells called loricae out of protein and small debris found floating in the water. The organism lives entirely inside this protective casing and extends a ring of beating hairs out the top to pull food into its mouth. They are a massive component of coastal microzooplankton and provide a crucial food source for larger marine crustaceans."
	},
	{
		id: "mesodinium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Mesodinium",
		commonName: "Mesodinium",
		imageSrc: "/images/featured_organisms/mesodinium.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/3039391269 (local filename pending).",
		description:
			"Mesodinium is a unique marine microbe that blurs the line between animal and plant. While it actively hunts and consumes smaller algae like a typical predator, it does not fully digest them. Instead it steals their internal photosynthetic machinery and stores it inside its own body to harvest energy directly from sunlight. This incredible survival strategy allows massive blooms of these microbes to thrive in highly competitive coastal waters."
	},
	{
		id: "cercomonas",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Cercomonas",
		commonName: "Cercomonas",
		imageSrc: "/images/featured_organisms/cercomonas.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6185869897 (local filename pending).",
		description:
			"Cercomonas is an exceptionally adaptable single-celled organism found across marine, freshwater, and soil environments. They have a highly flexible body shape that allows them to squeeze through microscopic gaps in aquatic sediment. They use long whip-like structures called flagella to move around and actively hunt down environmental bacteria. By keeping bacterial populations under control, they play a vital but unseen role in global nutrient recycling."
	},
	{
		id: "chaetoceros",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Chaetoceros",
		commonName: "Chaetoceros",
		imageSrc: "/images/featured_organisms/chaetoceros.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6133487928 (local filename pending).",
		description:
			"Chaetoceros is arguably the most abundant genus of marine diatoms on the planet. They are famous for linking together into long microscopic chains and growing distinct glassy spines that help them float near the ocean surface. During massive spring blooms, they multiply so rapidly that they can temporarily turn coastal waters a murky brown. They form the absolute bedrock of the marine food web and provide the foundational energy for countless ocean species."
	},
	{
		id: "emiliania",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Emiliania",
		commonName: "Emiliania",
		imageSrc: "/images/featured_organisms/emiliania.jpg",
		imageAttribution: "Source: https://www.gbif.org/occurrence/2863071096 (local filename pending).",
		description:
			"Emiliania is a microscopic marine alga that encases itself in intricate, armor-like plates made of chalk. When conditions are perfect, they multiply into blooms so massive that they turn hundreds of square miles of the ocean a brilliant milky turquoise. These giant reflective blooms can be clearly photographed from space by weather satellites. When they die, their chalky armor sinks to the ocean floor, locking away massive amounts of global carbon over millions of years."
	},
	{
		id: "aspergillus",
		group: "Other",
		taxonomyName: "Aspergillus",
		commonName: "Aspergillus",
		imageSrc: "/images/featured_organisms/aspergillus.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5938631776 (local filename pending).",
		description:
			"Aspergillus is a highly diverse group of fungi that thrive everywhere from marine sediments to common household environments. In the ocean they act as crucial decomposers that break down tough organic matter and recycle essential nutrients back into the food web. On land, certain species are notorious for causing harmful black mold outbreaks in damp buildings. Surprisingly, the industrial food sector relies heavily on this exact fungus to manufacture the citric acid used in countless sodas and tart candies."
	},
	{
		id: "rhizopus",
		group: "Other",
		taxonomyName: "Rhizopus",
		commonName: "Rhizopus",
		imageSrc: "/images/featured_organisms/rhizopus.jpeg",
		imageAttribution: "Source: adobe stock image (local filename pending).",
		description:
			"Rhizopus is a fast-growing fungus best known as the common mold that ruins fruit and bread. They spread incredibly quickly by releasing millions of microscopic spores into the air and water. In marine and coastal environments, they function as aggressive decomposers that quickly break down dead plant matter. While they are a nuisance in the kitchen, some species are highly valued in biotechnology for producing enzymes and industrial chemicals."
	},
	{
		id: "saprolegnia",
		group: "Other",
		taxonomyName: "Saprolegnia",
		commonName: "Saprolegnia",
		imageSrc: "/images/featured_organisms/saprolegnia.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5086985651 (local filename pending).",
		description:
			"Saprolegnia is a highly aggressive water mold found heavily in freshwater and estuarine environments. It is a notorious pathogen that attacks the skin and gills of aquatic animals and forms a distinctive fuzzy white coating on its host. This mold is a massive economic threat to global salmon hatcheries and aquaculture farms. Because it spreads rapidly through the water column, a single outbreak can devastate an entire population of vulnerable fish within days."
	},
	{
		id: "trichodesmium",
		group: "Other",
		taxonomyName: "Trichodesmium",
		commonName: "Trichodesmium",
		imageSrc: "/images/featured_organisms/trichodesmium.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6185848546 (local filename pending).",
		description:
			"Trichodesmium is a marine bacteria that frequently clumps together into visible tufts sometimes called sea sawdust. They possess the incredibly rare ability to pull raw nitrogen directly out of the atmosphere and convert it into a usable nutrient. Because most ocean regions are starved of nitrogen, they act as critical biological fertilizers for the entire marine ecosystem. Their massive blooms are so extensive that early sailors used them to navigate across otherwise featureless stretches of the open ocean."
	},
	{
		id: "salpa",
		group: "Invertebrate animals",
		taxonomyName: "Salpa",
		commonName: "Salpa",
		imageSrc: "/images/featured_organisms/salpa.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6273938514 (local filename pending).",
		description:
			"Salpa is a completely transparent, barrel-shaped marine organism that drifts gracefully through the open ocean. They often link their bodies together to form massive gelatinous chains that can stretch for several yards. They move by pumping water directly through their bodies, which also allows them to filter feed on microscopic algae. Their heavy waste pellets sink rapidly to the deep ocean, making them a major player in removing carbon from the upper atmosphere."
	},
	{
		id: "branchiostoma",
		group: "Other",
		taxonomyName: "Branchiostoma",
		commonName: "Branchiostoma",
		imageSrc: "/images/featured_organisms/branchiostoma.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/4946190312 (local filename pending).",
		description:
			"Branchiostoma is a small, translucent marine animal commonly known as a lancelet. They spend most of their lives buried in shallow coastal sands with only their mouths exposed to filter food from the passing water. Despite their simple appearance, they possess a primitive nerve cord that makes them an incredibly close relative to all modern vertebrates. Scientists study them extensively because they provide a living window into what the earliest ancestors of fish and humans might have looked like."
	},
	{
		id: "beroe",
		group: "Invertebrate animals",
		taxonomyName: "Beroe",
		commonName: "Beroe",
		imageSrc: "/images/featured_organisms/beroe.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/6234257056 (local filename pending).",
		description:
			"Beroe is a specialized marine comb jelly shaped like a floating gelatinous sack. They lack the long tentacles common to most jellyfish and instead swim around with their massive mouths wide open. They are highly specialized predators that hunt exclusively for other comb jellies in the water column. When they find a meal, they act like a living vacuum cleaner and swallow their relatives completely whole."
	},
	{
		id: "monosiga",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Monosiga",
		commonName: "Monosiga",
		imageSrc: "/images/featured_organisms/monosiga.jpg",
		imageAttribution:
			"Source: https://commons.wikimedia.org/w/index.php?search=Monosiga+brevicollis&title=Special%3AMediaSearch&type=image (local filename pending).",
		description:
			"Monosiga is a microscopic aquatic organism equipped with a distinctive collar and a long swimming tail. They use this beating tail to create tiny water currents that trap swimming bacteria against their sticky collar for consumption. Biologically, they are considered the closest living single-celled relatives to all modern animals. Researchers study their genetics heavily to understand the evolutionary leap from solitary cells to complex multicellular creatures like sponges and humans."
	},
	{
		id: "paulinella",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Paulinella",
		commonName: "Paulinella",
		imageSrc: "/images/featured_organisms/paulinella.png",
		imageAttribution: "Source: https://www.gbif.org/occurrence/5903769752 (local filename pending).",
		description:
			"Paulinella is a fascinating microscopic amoeba that builds its own protective shell out of tiny silica scales. What makes it famous among biologists is that it recently swallowed a photosynthetic bacterium and kept it alive inside its body. Over evolutionary time, this captured bacteria transformed into a permanent solar panel for the amoeba. It represents one of the only known instances in history where a creature independently evolved the ability to photosynthesize outside of plants and typical algae."
	},
	{
		id: "lutjanus-campechanus",
		group: "Fish",
		taxonomyName: "Lutjanus campechanus",
		commonName: "Lutjanus campechanus",
		imageSrc: "/images/featured_organisms/red_snapper.jpg",
		imageAttribution:
			"Source: https://www.flickr.com/photos/noaaphotolib/9714428833/in/photolist-JbHScj-JMbHbs-JSkkvW-fNqZfi-8Usn6h-fUTZxz-23YKdpZ-fNJ12N (local filename pending).",
		description:
			"Lutjanus campechanus is an incredibly iconic and valuable reef fish found heavily throughout the Gulf of Mexico. They are easily identified by their sloped profiles and bright rosy red coloration. They prefer to live around structured deep-water habitats like natural coral reefs, shipwrecks, and offshore oil platforms. As one of the most sought-after fish in the culinary world, their populations are carefully monitored to protect against massive historical overfishing."
	}
]);

const DEFAULT_IMAGE_SRC = "/images/featured_organisms/lanternfish.webp";

const IUCN_BADGE_CLASS: Record<string, string> = {
	"Least Concern": "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
	"Near Threatened": "border-lime-500/30 bg-lime-500/10 text-lime-600",
	Vulnerable: "border-amber-500/30 bg-amber-500/10 text-amber-600",
	Endangered: "border-orange-500/30 bg-orange-500/10 text-orange-600",
	"Critically Endangered": "border-rose-500/30 bg-rose-500/10 text-rose-600",
	"Data Deficient": "border-base-content/20 bg-base-content/10 text-base-content/70",
	"Not Evaluated": "border-base-content/20 bg-base-content/10 text-base-content/70"
};

/** GBIF `distributions[].threatStatus` vocabulary, ordered from least to most severe. */
const GBIF_THREAT_LABELS: [string, string][] = [
	["NOT_EVALUATED", "Not Evaluated"],
	["DATA_DEFICIENT", "Data Deficient"],
	["LEAST_CONCERN", "Least Concern"],
	["NEAR_THREATENED", "Near Threatened"],
	["VULNERABLE", "Vulnerable"],
	["ENDANGERED", "Endangered"],
	["CRITICALLY_ENDANGERED", "Critically Endangered"],
	["EXTINCT_IN_THE_WILD", "Extinct in the Wild"],
	["EXTINCT", "Extinct"]
];

const gbifCommonNameCache = new Map<number, string | null>();
const gbifKeyByNameCache = new Map<string, number | null>();

function isEnglishLanguage(language: string | undefined): boolean {
	const lang = (language ?? "").trim().toLowerCase();
	if (!lang) return false;
	if (lang === "en" || lang === "eng" || lang === "english") return true;
	return lang.startsWith("en-") || lang.startsWith("en_") || lang.startsWith("eng-") || lang.startsWith("eng_");
}

function scoreEnglishVernacular(row: {
	vernacularName?: string;
	country?: string;
	preferred?: boolean;
	isPreferredName?: boolean;
}): number {
	const name = row.vernacularName?.trim() ?? "";
	if (!name) return -Infinity;
	let score = 0;
	if (row.preferred || row.isPreferredName) score += 40;
	if (["US", "GB", "CA", "AU", "NZ"].includes((row.country ?? "").toUpperCase())) score += 25;
	if (/^[A-Za-z][A-Za-z\s-]*$/.test(name)) score += 5;
	return score;
}

async function resolveGbifTaxonKeyFromName(name: string): Promise<number | null> {
	const key = name.trim();
	if (!key) return null;
	if (gbifKeyByNameCache.has(key)) return gbifKeyByNameCache.get(key) ?? null;
	try {
		const matchUrl = new URL("https://api.gbif.org/v1/species/match");
		matchUrl.searchParams.set("name", key);
		const res = await fetch(matchUrl.toString());
		if (!res.ok) {
			gbifKeyByNameCache.set(key, null);
			return null;
		}
		const json = (await res.json()) as { usageKey?: number; speciesKey?: number; acceptedUsageKey?: number };
		const resolved = json.usageKey ?? json.speciesKey ?? json.acceptedUsageKey ?? null;
		const numeric = resolved != null ? Number(resolved) : null;
		const out = Number.isFinite(numeric) ? (numeric as number) : null;
		gbifKeyByNameCache.set(key, out);
		return out;
	} catch {
		gbifKeyByNameCache.set(key, null);
		return null;
	}
}

async function fetchGbifCommonName(taxonKey: number): Promise<string | null> {
	try {
		const res = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/vernacularNames?limit=80`);
		if (!res.ok) return null;
		const json = (await res.json()) as {
			results?: {
				vernacularName?: string;
				language?: string;
				country?: string;
				preferred?: boolean;
				isPreferredName?: boolean;
			}[];
		};
		const rows = Array.isArray(json?.results) ? json.results : [];
		const englishRows = rows.filter((r) => isEnglishLanguage(r.language) && r.vernacularName?.trim());
		if (!englishRows.length) return null;
		englishRows.sort((a, b) => {
			const scoreDiff = scoreEnglishVernacular(b) - scoreEnglishVernacular(a);
			if (scoreDiff !== 0) return scoreDiff;
			return (a.vernacularName ?? "").localeCompare(b.vernacularName ?? "");
		});
		return englishRows[0]?.vernacularName?.trim() || null;
	} catch {
		return null;
	}
}

/** Returns the most severe IUCN category GBIF reports for the taxon, or null if none. */
async function fetchGbifIucnStatus(taxonKey: number): Promise<string | null> {
	try {
		const res = await fetch(`https://api.gbif.org/v1/species/${taxonKey}/distributions?limit=200`);
		if (!res.ok) return null;
		const json = (await res.json()) as { results?: { threatStatus?: string }[] };
		const statuses = new Set(
			(json.results ?? []).map((r) => (r.threatStatus ?? "").trim().toUpperCase().replace(/\s+/g, "_"))
		);
		const worst = GBIF_THREAT_LABELS.findLast(([status]) => statuses.has(status));
		return worst ? worst[1] : null;
	} catch {
		return null;
	}
}

/** Scientific name is the last rank of the taxonomy path (e.g. "...;Mola;Mola_mola;" -> "Mola mola"). */
function getScientificName(taxonomy: string): string {
	const lastRank = taxonomy.split(";").findLast((rank) => rank.trim());
	return lastRank?.trim().replace(/_/g, " ") || taxonomy;
}

/**
 * react-photo-album photo shape, extended with the full spotlight so a click
 * handler can recover the original data object from the clicked photo.
 */
type OrganismPhoto = Photo & { spotlight: SpotlightWithImage };

type PhotoSize = { width: number; height: number };

/**
 * Map spotlight data into the photo format the library accepts. The Image table
 * has no intrinsic image dimensions, so each tile starts as a square 800x800 and
 * switches to its measured size once the image has loaded in the browser.
 */
function toOrganismPhotos(spotlights: SpotlightWithImage[], sizesById: Record<number, PhotoSize>): OrganismPhoto[] {
	return spotlights.map((spotlight) => ({
		key: String(spotlight.id),
		src: spotlight.imageFileUrl_ODE || DEFAULT_IMAGE_SRC,
		width: sizesById[spotlight.id]?.width ?? 800,
		height: sizesById[spotlight.id]?.height ?? 800,
		alt: spotlight.commonName?.trim() || getScientificName(spotlight.taxonomy),
		spotlight
	}));
}

// Responsive masonry column count, driven by the library's measured container width.
// The grid now lives in a 2/3-width column, so we lean toward more, smaller tiles.
function masonryColumns(containerWidth: number): number {
	if (containerWidth < 400) return 2;
	if (containerWidth < 600) return 3;
	if (containerWidth < 900) return 4;
	return 5;
}

export default function FeaturedOrganisms({ spotlights }: { spotlights: SpotlightWithImage[] }) {
	// `null` until the user picks a tile; the detail panel falls back to `activeOrganism` below.
	const [selectedOrganism, setSelectedOrganism] = useState<SpotlightWithImage | null>(null);
	const [gbifCommonNamesById, setGbifCommonNamesById] = useState<Record<number, string>>({});
	const [sizesById, setSizesById] = useState<Record<number, PhotoSize>>({});

	// Map the spotlight data into react-photo-album's photo shape.
	const photos = useMemo(() => toOrganismPhotos(spotlights, sizesById), [spotlights, sizesById]);

	// Pick a random default once on the client so the detail panel is never empty.
	// Must be an effect: Math.random() during render fails the purity lint, and during SSR
	// it would mismatch the server HTML and the browser HTML.
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setSelectedOrganism((current) => current ?? spotlights[Math.floor(Math.random() * spotlights.length)]!);
	}, []);

	// The spotlight shown in the detail panel. Falls back to the first entry during the
	// brief pre-mount window before the random default is applied.
	const activeOrganism = selectedOrganism ?? spotlights[0]!;

	useEffect(() => {
		let cancelled = false;

		async function loadMissingCommonNames() {
			const targets = spotlights.filter((spotlight) => {
				const hasLocalCommonName = Boolean(spotlight.commonName?.trim());
				const alreadyLoaded = Boolean(gbifCommonNamesById[spotlight.id]);
				return !hasLocalCommonName && !alreadyLoaded;
			});
			if (!targets.length) return;

			const resolvedEntries = await Promise.all(
				targets.map(async (spotlight): Promise<[number, string | null]> => {
					const taxonKey = await resolveGbifTaxonKeyFromName(getScientificName(spotlight.taxonomy));
					if (!taxonKey) return [spotlight.id, null];
					if (gbifCommonNameCache.has(taxonKey)) {
						return [spotlight.id, gbifCommonNameCache.get(taxonKey) ?? null];
					}
					const gbifName = await fetchGbifCommonName(taxonKey);
					gbifCommonNameCache.set(taxonKey, gbifName);
					return [spotlight.id, gbifName];
				})
			);

			if (cancelled) return;
			setGbifCommonNamesById((prev) => {
				const next = { ...prev };
				let changed = false;
				for (const [id, commonName] of resolvedEntries) {
					if (commonName?.trim()) {
						const normalized = commonName.trim();
						if (next[id] !== normalized) {
							next[id] = normalized;
							changed = true;
						}
					}
				}
				return changed ? next : prev;
			});
		}

		void loadMissingCommonNames();
		return () => {
			cancelled = true;
		};
	}, [gbifCommonNamesById]);

	function getDisplayCommonName(spotlight: SpotlightWithImage): string {
		const local = spotlight.commonName?.trim();
		if (local) return local;
		const fromGbif = gbifCommonNamesById[spotlight.id]?.trim();
		if (fromGbif) return fromGbif;
		return getScientificName(spotlight.taxonomy);
	}

	// Custom image renderer: inject the native Next.js Image into each masonry slot.
	// react-photo-album measures and sizes every tile for us, so we render the Image
	// with `fill` inside a relative, aspect-ratio box and let it cover the slot.
	function renderOrganismImage(
		{ alt, sizes }: RenderImageProps,
		{ photo, width, height }: RenderImageContext<OrganismPhoto>
	) {
		const isSelected = photo.spotlight.id === activeOrganism.id;
		const label = getDisplayCommonName(photo.spotlight);
		return (
			<div
				className={[
					"relative overflow-hidden rounded-xl bg-base-100/80",
					isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-base-200" : ""
				].join(" ")}
				style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
			>
				<Image
					src={photo.src}
					alt={alt ?? ""}
					fill
					sizes={sizes}
					className="object-cover object-center"
					onLoad={(e) => {
						const id = photo.spotlight.id;
						const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
						setSizesById((prev) => (prev[id] ? prev : { ...prev, [id]: { width, height } }));
					}}
				/>
				{/* Always-visible common name across the bottom of every grid tile. */}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-2 pb-1.5 pt-6">
					<p className="truncate text-center text-xs font-semibold text-white">{label}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 lg:flex-row">
			{/* Left: the detail panel (master-detail), sticky so it stays in view while the grid scrolls. */}
			<div className="lg:w-1/3">
				<div className="sticky top-0 h-fit">
					<SelectedOrganismCard
						key={activeOrganism.id}
						spotlight={activeOrganism}
						resolvedCommonName={getDisplayCommonName(activeOrganism)}
					/>
				</div>
			</div>

			{/* Right: the masonry grid (master list). */}
			<div className="lg:w-2/3">
				<div className="rounded-2xl bg-base-200 p-3 shadow-sm md:p-4">
					{/* Padding on all sides leaves room for the selected tile's ring, which the scroll box would otherwise clip. */}
					<div className="h-[75vh] overflow-y-auto p-1">
						<MasonryPhotoAlbum
							photos={photos}
							columns={masonryColumns}
							spacing={12}
							sizes={{
								size: "calc(100vw - 2rem)",
								sizes: [{ viewport: "(min-width: 1024px)", size: "60vw" }]
							}}
							render={{ image: renderOrganismImage }}
							onClick={({ photo }) => setSelectedOrganism(photo.spotlight)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function SelectedOrganismCard({
	spotlight,
	resolvedCommonName
}: {
	spotlight: SpotlightWithImage;
	resolvedCommonName: string;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	// `undefined` while the GBIF lookup is in flight.
	const [iucnStatus, setIucnStatus] = useState<string>();
	const commonName = resolvedCommonName;
	const scientificName = getScientificName(spotlight.taxonomy);
	const imageSrc = spotlight.imageFileUrl_ODE || DEFAULT_IMAGE_SRC;
	const imageAttribution = getImageAttributionDetails(spotlight);
	const taxonomyHref = exploreUrl({ table: "taxonomy", taxonomy: spotlight.taxonomy });

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const taxonKey = await resolveGbifTaxonKeyFromName(scientificName);
			const status = taxonKey ? await fetchGbifIucnStatus(taxonKey) : null;
			if (!cancelled) setIucnStatus(status ?? "Not Evaluated");
		})();
		return () => {
			cancelled = true;
		};
	}, [scientificName]);

	return (
		<div className="flex flex-col items-center">
			{/*
			 * daisyUI hover-3d tilts its first child using the 8 empty hover-zone divs layered on top,
			 * so nothing inside the card face can be clickable, hoverable, or scrollable.
			 */}
			<div className="hover-3d w-full">
				{/*
				 * The trading-card look is built from stacked frames: outer stock border ->
				 * inner frame -> art frame -> text-box frame, plus gradient "gloss" overlays.
				 */}
				<div className="relative w-full overflow-hidden rounded-2xl border-[5px] border-primary/75 bg-linear-to-br from-base-200/82 via-base-100/92 to-base-200/80 p-2 shadow-[0_14px_45px_-12px_rgba(0,0,0,0.6)] sm:p-2.5">
					{/* Holo-like shading in ODE blues only (no white), kept subtle. */}
					<div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(125%_76%_at_50%_-4%,rgba(100,171,220,0.14),transparent_52%),radial-gradient(120%_70%_at_8%_0%,rgba(35,61,127,0.11),transparent_55%),radial-gradient(95%_70%_at_92%_8%,rgba(14,165,233,0.09),transparent_58%),radial-gradient(78%_60%_at_85%_96%,rgba(100,171,220,0.1),transparent_60%)]" />
					<div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,transparent_0%,rgba(35,61,127,0.05)_30%,transparent_52%,rgba(100,171,220,0.08)_78%,rgba(56,189,248,0.08)_92%,transparent_100%)] opacity-55" />

					{/* Centered top notch tab, connected to top border. */}
					<div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-px">
						<div className="bg-primary/75 p-0.5 [clip-path:polygon(0_0,100%_0,100%_76%,92%_100%,8%_100%,0_76%)]">
							<div className="bg-base-200/92 px-5 py-px [clip-path:polygon(0_0,100%_0,100%_76%,92%_100%,8%_100%,0_76%)]">
								<span className="text-[11px] font-semibold text-primary/90">oceandnaexplorer.org</span>
							</div>
						</div>
					</div>

					{/* Inner frame (the card's second line). */}
					<div className="relative z-10 flex flex-col gap-2.5 rounded-xl p-3 pt-6 sm:p-3.5 sm:pt-6">
						{/* Header: name + scientific name (left), ODE logo emblem (right). */}
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<h3 className="truncate text-xl font-extrabold leading-tight text-base-content sm:text-2xl">
									{commonName}
								</h3>
								<p className="mt-0.5 truncate text-sm italic leading-snug text-base-content/60">{scientificName}</p>
							</div>
							<Image
								src="/images/ode_logo_clean.svg"
								alt=""
								width={40}
								height={40}
								className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
							/>
						</div>

						{/* Card art window (framed + beveled; kept short so the text box breathes). */}
						<div className="relative aspect-3/2 w-full overflow-hidden rounded-lg border-2 border-primary/75 bg-base-300/40 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
							{imageFailed ? (
								<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-sky-900/70 to-indigo-900/70 text-5xl font-semibold text-white/85">
									{commonName.charAt(0).toUpperCase()}
								</div>
							) : (
								<Image
									src={imageSrc}
									alt={commonName}
									fill
									sizes="(max-width: 1024px) 100vw, 420px"
									className="object-cover object-center"
									onError={() => setImageFailed(true)}
								/>
							)}
						</div>

						{/* IUCN status strip. */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-base-content/60">IUCN status</span>
							<span
								className={[
									"inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
									IUCN_BADGE_CLASS[iucnStatus ?? ""] ?? IUCN_BADGE_CLASS["Not Evaluated"]
								].join(" ")}
							>
								{iucnStatus ?? "Loading..."}
							</span>
						</div>

						{/* Description box (the "attack text" area). Fixed height + clamp so every card is the same size. */}
						<div className="rounded-lg border border-base-content/10 bg-base-100/60 p-3">
							<p className="line-clamp-6 h-34 text-sm leading-relaxed text-base-content/85">{spotlight.description}</p>
						</div>

						{/* Footer: source project + reserved QR spot. */}
						<div className="flex items-center justify-between gap-2 border-t border-base-content/10 pt-2">
							<span className="truncate text-xs text-base-content/60">
								Project: <span className="font-semibold text-base-content/80">{spotlight.project_id}</span>
							</span>
							{/* QR code placeholder: taxonomy-page QR link will render here later. */}
						</div>
					</div>
				</div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>

			{/* Photo credit lives outside the card face because hover-3d blocks hovering inside it. */}
			<div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3">
				<Link href={taxonomyHref} className="btn btn-primary btn-sm">
					View taxonomy
				</Link>
				<ImageAttributionIcon attribution={imageAttribution} fallbackTitle={commonName} />
			</div>
		</div>
	);
}

type ImageAttributionDetails = {
	title?: string;
	names?: string;
	institution?: string;
	attributionUrl?: string;
	imageSourceUrl?: string;
	licenseName?: string;
	licenseUrl?: string;
	location?: string;
	imageName?: string;
	legacyText?: string;
	isMissing?: boolean;
};

function getImageAttributionDetails(spotlight: SpotlightWithImage): ImageAttributionDetails {
	const image = spotlight.Image;
	const attribution = image?.Attribution;
	const details: ImageAttributionDetails = {
		title: cleanAttributionValue(attribution?.attributionTitle),
		names: cleanAttributionValue(attribution?.attributionNames.join(", ")),
		institution: cleanAttributionValue(attribution?.attributionInstitution ?? undefined),
		attributionUrl: cleanAttributionValue(attribution?.attributionUrl ?? undefined),
		licenseName: cleanAttributionValue(image?.license ?? undefined),
		location: cleanAttributionValue(image?.location ?? undefined),
		imageName: cleanAttributionValue(image?.name ?? undefined)
	};
	const hasStructuredValues = Object.values(details).some(Boolean);
	if (hasStructuredValues) {
		return details;
	}
	return {
		legacyText: "Attribution details coming soon.",
		isMissing: true
	};
}

function ImageAttributionIcon({
	attribution,
	fallbackTitle
}: {
	attribution: ImageAttributionDetails;
	fallbackTitle: string;
}) {
	const [hover, setHover] = useState(false);
	const combinedCredit = [attribution.names, attribution.institution].filter(Boolean).join(" - ");
	const licenseText = attribution.licenseName ?? attribution.licenseUrl;
	const headline = attribution.imageName ?? attribution.title ?? fallbackTitle;

	return (
		<div
			className="relative z-20"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div className="relative">
				<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-base-100/70 border border-base-200 backdrop-blur flex items-center justify-center shadow-sm">
					<PhotoIcon />
				</div>
				{hover ? (
					<div className="absolute bottom-full right-0 w-72 max-w-[86vw] rounded-lg border border-base-200 bg-base-100/95 p-2.5 text-xs text-base-content shadow-lg backdrop-blur">
						<div className="space-y-1.5 wrap-break-word">
							<p className="font-semibold">{headline}</p>
							{attribution.title ? <p>{attribution.title}</p> : null}
							{combinedCredit ? <p>{combinedCredit}</p> : null}
							{attribution.location ? <p>{attribution.location}</p> : null}
							{attribution.attributionUrl ? (
								<p>
									<a
										className="link link-primary break-all"
										href={attribution.attributionUrl}
										target="_blank"
										rel="noreferrer"
									>
										{attribution.attributionUrl}
									</a>
								</p>
							) : null}
							{attribution.imageSourceUrl ? (
								<p>
									<a
										className="link link-primary break-all"
										href={attribution.imageSourceUrl}
										target="_blank"
										rel="noreferrer"
									>
										{attribution.imageSourceUrl}
									</a>
								</p>
							) : null}
							{licenseText ? (
								<p>
									{attribution.licenseUrl ? (
										<a
											className="link link-primary break-all"
											href={attribution.licenseUrl}
											target="_blank"
											rel="noreferrer"
										>
											{licenseText}
										</a>
									) : (
										licenseText
									)}
								</p>
							) : null}
							{attribution.legacyText ? (
								<p className={attribution.isMissing ? "text-base-content/70 italic" : undefined}>
									{attribution.legacyText}
								</p>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
