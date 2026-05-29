"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
	/** Optional credit line for the image (shown via a small photo icon). */
	imageAttribution?: string;

	description: string;
};

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
export const FEATURED_ORGANISMS: FeaturedOrganism[] = [
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
			"Karlodinium is a microscopic marine alga frequently found in estuaries and shallow coastal waters worldwide. While normally harmless in small numbers, they can bloom densely and release specialized toxins directly into the water. These unique \"karlotoxins\" severely damage the gills of fish, making this organism responsible for devastating fish kills globally. "
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
			"Karenia is a notorious genus of marine phytoplankton primarily found blooming in the Gulf of America. They are the primary organisms responsible for extreme \"red tide\" events that discolor the water. During these massive blooms, they release airborne toxins that kill vast amounts of marine life and can cause severe respiratory irritation in humans living near the coast. "
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
		taxonomyString: "Animalia;Echinodermata;Holothuroidea;Elasipodida;Psychropotidae;Psychropotes;Psychropotes longicauda",
		imageSrc: "/images/featured_organisms/longicauda.jpg",
		imageAttribution: "Source: https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210201/ (local filename pending).",
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
		imageAttribution: "Source: https://www.flickr.com/photos/noaaphotolib/27907473986/in/photolist-Jw66JA (local filename pending).",
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
		taxonomyString: "Eukaryota;Echinodermata;Echinoidea;Camarodonta;Strongylocentrotidae;Strongylocentrotus;Strongylocentrotus purpuratus",
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
		imageAttribution: "Source: https://commons.wikimedia.org/w/index.php?search=Monosiga+brevicollis&title=Special%3AMediaSearch&type=image (local filename pending).",
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
		imageAttribution: "Source: https://www.flickr.com/photos/noaaphotolib/9714428833/in/photolist-JbHScj-JMbHbs-JSkkvW-fNqZfi-8Usn6h-fUTZxz-23YKdpZ-fNJ12N (local filename pending).",
		description:
			"Lutjanus campechanus is an incredibly iconic and valuable reef fish found heavily throughout the Gulf of Mexico. They are easily identified by their sloped profiles and bright rosy red coloration. They prefer to live around structured deep-water habitats like natural coral reefs, shipwrecks, and offshore oil platforms. As one of the most sought-after fish in the culinary world, their populations are carefully monitored to protect against massive historical overfishing."
	}
];

type FeaturedFilterGroup = "All" | "Fish" | "Invertebrates" | "Protists" | "Fungi" | "Other";

const FEATURED_FILTER_GROUPS: FeaturedFilterGroup[] = ["All", "Fish", "Invertebrates", "Protists", "Fungi", "Other"];
const FILTER_TAB_BASE =
	"inline-flex min-h-9 items-center justify-center px-3 py-2 text-center text-sm font-medium transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-[0.9375rem]";

const DEFAULT_IMAGE_SRC = "/images/featured_organisms/lanternfish.webp";

const IUCN_BADGE_CLASS: Record<string, string> = {
	"Least Concern": "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
	"Near Threatened": "border-lime-400/30 bg-lime-500/10 text-lime-300",
	Vulnerable: "border-amber-400/30 bg-amber-500/10 text-amber-300",
	Endangered: "border-orange-400/30 bg-orange-500/10 text-orange-300",
	"Critically Endangered": "border-rose-400/30 bg-rose-500/10 text-rose-300",
	"Data Deficient": "border-slate-400/30 bg-slate-500/10 text-slate-300",
	"Not Evaluated": "border-slate-400/30 bg-slate-500/10 text-slate-300"
};

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

export default function FeaturedOrganisms() {
	const [activeGroup, setActiveGroup] = useState<FeaturedFilterGroup>("All");
	const [selectedOrganism, setSelectedOrganism] = useState<FeaturedOrganism>(FEATURED_ORGANISMS[0]);
	const [gbifCommonNamesById, setGbifCommonNamesById] = useState<Record<string, string>>({});
	const bubbleNodesRef = useRef<(HTMLButtonElement | null)[]>([]);
	const scrollFieldRef = useRef<HTMLDivElement | null>(null);
	const dockInnerRef = useRef<HTMLDivElement | null>(null);
	const pointerRef = useRef<{ x: number; y: number; isInside: boolean }>({ x: 0, y: 0, isInside: false });
	const autoScrollFrameRef = useRef<number | null>(null);
	const dockTiltXRef = useRef(0);
	const dockTiltYRef = useRef(0);
	const hasInitializedSelectionRef = useRef(false);

	const filteredOrganisms = useMemo(() => {
		if (activeGroup === "All") return FEATURED_ORGANISMS;
		return FEATURED_ORGANISMS.filter((organism) => toFilterGroup(organism.group) === activeGroup);
	}, [activeGroup]);
	const honeycombRows = useMemo(() => createHoneycombRows(filteredOrganisms), [filteredOrganisms]);
	const shouldCenterDock = filteredOrganisms.length > 0 && honeycombRows.length <= 3;

	useEffect(() => {
		if (filteredOrganisms.length === 0) return;
		const preferredCenterOrganism = getCenterOrganism(honeycombRows) ?? filteredOrganisms[0];
		if (!hasInitializedSelectionRef.current) {
			hasInitializedSelectionRef.current = true;
			setSelectedOrganism(preferredCenterOrganism);
			return;
		}
		const stillVisible = filteredOrganisms.some((organism) => organism.id === selectedOrganism.id);
		if (!stillVisible) {
			setSelectedOrganism(preferredCenterOrganism);
		}
	}, [filteredOrganisms, honeycombRows, selectedOrganism.id]);

	useEffect(() => {
		bubbleNodesRef.current = Array.from({ length: filteredOrganisms.length }, () => null);
	}, [filteredOrganisms]);

	useEffect(() => {
		const scrollNode = scrollFieldRef.current;
		if (!scrollNode || filteredOrganisms.length === 0) return;

		const handleScroll = () => {
			updateBubbleScales();
		};
		const handleResize = () => {
			updateBubbleScales();
		};

		scrollNode.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleResize);
		const raf = window.requestAnimationFrame(() => {
			updateBubbleScales();
		});
		return () => {
			window.cancelAnimationFrame(raf);
			scrollNode.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleResize);
		};
	}, [filteredOrganisms.length, selectedOrganism.id]);

	useEffect(() => {
		const scrollNode = scrollFieldRef.current;
		if (!scrollNode) return;
		const raf = window.requestAnimationFrame(() => {
			const maxX = Math.max(0, scrollNode.scrollWidth - scrollNode.clientWidth);
			const maxY = Math.max(0, scrollNode.scrollHeight - scrollNode.clientHeight);
			scrollNode.scrollLeft = maxX / 2;
			scrollNode.scrollTop = maxY / 2;
		});
		return () => window.cancelAnimationFrame(raf);
	}, [filteredOrganisms.length, honeycombRows.length, activeGroup]);

	useEffect(() => {
		return () => {
			stopAutoScrollLoop();
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadMissingCommonNames() {
			const targets = FEATURED_ORGANISMS.filter((organism) => {
				const hasLocalCommonName = Boolean(organism.commonName?.trim());
				const alreadyLoaded = Boolean(gbifCommonNamesById[organism.id]);
				return !hasLocalCommonName && !alreadyLoaded;
			});
			if (!targets.length) return;

			const resolvedEntries = await Promise.all(
				targets.map(async (organism): Promise<[string, string | null]> => {
					const taxonKey = organism.gbifTaxonKey ?? (await resolveGbifTaxonKeyFromName(organism.taxonomyName));
					if (!taxonKey) return [organism.id, null];
					if (gbifCommonNameCache.has(taxonKey)) {
						return [organism.id, gbifCommonNameCache.get(taxonKey) ?? null];
					}
					const gbifName = await fetchGbifCommonName(taxonKey);
					gbifCommonNameCache.set(taxonKey, gbifName);
					return [organism.id, gbifName];
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

	function getDisplayCommonName(organism: FeaturedOrganism): string {
		const local = organism.commonName?.trim();
		if (local) return local;
		const fromGbif = gbifCommonNamesById[organism.id]?.trim();
		if (fromGbif) return fromGbif;
		return createFallbackCommonName(organism);
	}

	function handleOrganismSelect(organism: FeaturedOrganism, node: HTMLButtonElement | null) {
		if (node) {
			const currentScale = readNodeScale(node);
			const pressScale = Math.max(0.96, currentScale * 0.97);
			const reboundScale = currentScale * 1.012;
			node.animate(
				[
					{ transform: `scale(${pressScale.toFixed(3)})` },
					{ transform: `scale(${reboundScale.toFixed(3)})` },
					{ transform: `scale(${currentScale.toFixed(3)})` }
				],
				{
					duration: 140,
					easing: "cubic-bezier(0.22, 1, 0.36, 1)"
				}
			);
		}
		setSelectedOrganism(organism);
	}

	function handleBubbleFieldMouseMove(event: React.MouseEvent<HTMLDivElement>) {
		pointerRef.current = { x: event.clientX, y: event.clientY, isInside: true };
		if (autoScrollFrameRef.current == null) {
			startAutoScrollLoop();
		}
		updateBubbleScales();
	}

	function handleBubbleFieldMouseLeave() {
		pointerRef.current = { ...pointerRef.current, isInside: false };
		updateBubbleScales();
	}

	function startAutoScrollLoop() {
		if (autoScrollFrameRef.current != null) return;

		const step = () => {
			const fieldNode = scrollFieldRef.current;
			if (!fieldNode) {
				stopAutoScrollLoop();
				return;
			}

			const pointer = pointerRef.current;
			const rect = fieldNode.getBoundingClientRect();
			let targetScrollTop = fieldNode.scrollTop;
			let targetScrollLeft = fieldNode.scrollLeft;
			let targetTiltX = 0;
			let targetTiltY = 0;

			if (pointer.isInside) {
				const halfWidth = Math.max(1, rect.width / 2);
				const halfHeight = Math.max(1, rect.height / 2);
				const normX = clamp((pointer.x - (rect.left + halfWidth)) / halfWidth, -1, 1);
				const normY = clamp((pointer.y - (rect.top + halfHeight)) / halfHeight, -1, 1);

				const maxScrollX = Math.max(0, fieldNode.scrollWidth - fieldNode.clientWidth);
				const maxScrollY = Math.max(0, fieldNode.scrollHeight - fieldNode.clientHeight);
				targetScrollLeft = ((normX + 1) / 2) * maxScrollX;
				targetScrollTop = ((normY + 1) / 2) * maxScrollY;

				const curvedX = Math.sign(normX) * Math.pow(Math.abs(normX), 1.15);
				const curvedY = Math.sign(normY) * Math.pow(Math.abs(normY), 1.15);
				// Subtle "watch-like" tilt when cursor approaches far edges.
				targetTiltY = -curvedX * 2.4;
				targetTiltX = curvedY * 2;
			}

			fieldNode.scrollTop = mix(fieldNode.scrollTop, targetScrollTop, pointer.isInside ? 0.11 : 0.08);
			fieldNode.scrollLeft = mix(fieldNode.scrollLeft, targetScrollLeft, pointer.isInside ? 0.11 : 0.08);

			dockTiltXRef.current = dockTiltXRef.current * 0.9 + targetTiltX * 0.1;
			dockTiltYRef.current = dockTiltYRef.current * 0.9 + targetTiltY * 0.1;
			const dockNode = dockInnerRef.current;
			if (dockNode) {
				dockNode.style.transform = `perspective(1100px) rotateX(${dockTiltXRef.current.toFixed(
					2
				)}deg) rotateY(${dockTiltYRef.current.toFixed(2)}deg)`;
			}

			updateBubbleScales();
			const scrollDelta =
				Math.abs(targetScrollLeft - fieldNode.scrollLeft) + Math.abs(targetScrollTop - fieldNode.scrollTop);
			const shouldContinue =
				pointerRef.current.isInside ||
				scrollDelta > 0.12 ||
				Math.abs(dockTiltXRef.current) > 0.04 ||
				Math.abs(dockTiltYRef.current) > 0.04;
			if (!shouldContinue) {
				stopAutoScrollLoop();
				return;
			}

			autoScrollFrameRef.current = window.requestAnimationFrame(step);
		};

		autoScrollFrameRef.current = window.requestAnimationFrame(step);
	}

	function stopAutoScrollLoop() {
		if (autoScrollFrameRef.current != null) {
			window.cancelAnimationFrame(autoScrollFrameRef.current);
			autoScrollFrameRef.current = null;
		}
		dockTiltXRef.current = 0;
		dockTiltYRef.current = 0;
		const dockNode = dockInnerRef.current;
		if (dockNode) {
			dockNode.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
		}
	}

	function updateBubbleScales() {
		const fieldNode = scrollFieldRef.current;
		if (!fieldNode) return;
		const pointer = pointerRef.current;
		const fieldRect = fieldNode.getBoundingClientRect();
		const viewportCenterX = fieldRect.left + fieldRect.width / 2;
		const viewportCenterY = fieldRect.top + fieldRect.height / 2;
		const focusX = pointer.isInside ? mix(viewportCenterX, pointer.x, 0.34) : viewportCenterX;
		const focusY = pointer.isInside ? mix(viewportCenterY, pointer.y, 0.4) : viewportCenterY;
		const xRadius = Math.max(210, fieldRect.width * 0.48);
		const yRadius = Math.max(230, fieldRect.height * 0.45);
		const edgeRadius = Math.max(100, fieldRect.height * 0.24);
		let hoveredNode: HTMLButtonElement | null = null;
		let hoveredDistance = Number.POSITIVE_INFINITY;

		if (pointer.isInside) {
			for (const node of bubbleNodesRef.current) {
				if (!node) continue;
				const rect = node.getBoundingClientRect();
				const nodeCenterX = rect.left + rect.width / 2;
				const nodeCenterY = rect.top + rect.height / 2;
				const distance = Math.hypot(pointer.x - nodeCenterX, pointer.y - nodeCenterY);
				const candidateRadius = Math.max(rect.width, rect.height) * 0.86;
				if (distance < candidateRadius && distance < hoveredDistance) {
					hoveredDistance = distance;
					hoveredNode = node;
				}
			}
		}

		for (const node of bubbleNodesRef.current) {
			if (!node) continue;
			const isSelected = node.dataset.selected === "true";
			const rect = node.getBoundingClientRect();
			const nodeCenterX = rect.left + rect.width / 2;
			const nodeCenterY = rect.top + rect.height / 2;
			const pointerDistance = pointer.isInside ? Math.hypot(pointer.x - nodeCenterX, pointer.y - nodeCenterY) : Infinity;
			const focusDistance = Math.hypot((nodeCenterX - focusX) / xRadius, (nodeCenterY - focusY) / yRadius);
			const focusStrength = clamp(1 - focusDistance, 0, 1);
			const viewportDistance = Math.hypot(
				(nodeCenterX - viewportCenterX) / xRadius,
				(nodeCenterY - viewportCenterY) / yRadius
			);
			const viewportStrength = clamp(1 - viewportDistance, 0, 1);
			const centerStrength = pointer.isInside
				? clamp(viewportStrength * 0.45 + focusStrength * 0.92, 0, 1)
				: viewportStrength;
			const distanceToNearestEdge = Math.min(nodeCenterY - fieldRect.top, fieldRect.bottom - nodeCenterY);
			const edgeStrength = clamp(distanceToNearestEdge / edgeRadius, 0, 1);
			const centerScale = 0.58 + centerStrength * 0.64;
			const edgeScale = 0.82 + edgeStrength * 0.18;
			const selectedBoost = isSelected ? 0.09 : 0;
			const proximityStrength = clamp(1 - pointerDistance / 54, 0, 1);
			const localProximity = proximityStrength * proximityStrength * proximityStrength;
			const hoverBoost = node === hoveredNode ? 0.05 : localProximity * 0.0035;
			let scale = clamp(centerScale * edgeScale + selectedBoost + hoverBoost, 0.55, 1.04);
			if (isSelected) {
				// Keep the selected organism prominent even near the outer fringe.
				scale = Math.max(scale, 0.9);
			}
			const opacity = clamp(0.42 + centerStrength * 0.46 + edgeStrength * 0.1 + proximityStrength * 0.08, 0.42, 1);
			const driftX = ((nodeCenterX - viewportCenterX) / xRadius) * (1 - centerStrength) * 3.5;

			node.style.transform = `translate3d(${driftX.toFixed(2)}px, 0px, 0) scale(${scale.toFixed(3)})`;
			node.style.opacity = opacity.toFixed(3);
			if (node === hoveredNode) {
				node.style.zIndex = "36";
			} else if (isSelected) {
				node.style.zIndex = "30";
			} else if (scale >= 1.1) {
				node.style.zIndex = "18";
			} else if (scale >= 0.88) {
				node.style.zIndex = "14";
			} else if (scale >= 0.62) {
				node.style.zIndex = "11";
			} else {
				node.style.zIndex = "8";
			}
		}
	}

	return (
		<section className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				{FEATURED_FILTER_GROUPS.map((group) => {
					const isActive = activeGroup === group;
					return (
						<button
							key={group}
							type="button"
							onClick={() => setActiveGroup(group)}
							className={`${FILTER_TAB_BASE} ${
								isActive
									? "bg-primary text-primary-content shadow-md"
									: "bg-base-200/90 text-base-content hover:bg-base-300 active:brightness-95"
							}`}
							aria-pressed={isActive}
						>
							{group}
						</button>
					);
				})}
			</div>

			<div className="rounded-2xl bg-base-200 p-3 shadow-sm md:p-4">
				<div className="grid items-start gap-4 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
					<div className="lg:sticky lg:top-24">
						<SelectedOrganismCard
							organism={selectedOrganism}
							resolvedCommonName={getDisplayCommonName(selectedOrganism)}
						/>
					</div>

					<div className="relative min-w-0">
						<div
							ref={scrollFieldRef}
							onMouseMove={handleBubbleFieldMouseMove}
							onMouseLeave={handleBubbleFieldMouseLeave}
							className={[
								"relative h-[620px] overflow-x-auto overflow-y-auto px-6 py-6 md:h-[690px] md:px-10 md:py-8",
								"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
								shouldCenterDock ? "flex items-center justify-center" : ""
							].join(" ")}
						>
							<div
								ref={dockInnerRef}
								className="mx-auto flex min-w-full w-max max-w-none px-10 transform-gpu flex-col items-center gap-0.75 pb-8 transition-transform duration-150 ease-out will-change-transform md:px-16 md:gap-1.25 md:pb-10"
							>
								{honeycombRows.map((row, rowIndex) => (
									<div
										key={`honeycomb-row-${rowIndex}`}
										className={[
											"flex items-center justify-center gap-0.75 md:gap-1.25",
											rowIndex === 0 ? "" : "-mt-4.5 md:-mt-5.5"
										].join(" ")}
										style={{
											marginInlineStart: `${computeWatchRowShift(rowIndex)}px`
										}}
									>
										{row.map(({ organism, index }) => (
											<OrganismDockCircle
												key={organism.id}
												organism={organism}
												resolvedCommonName={getDisplayCommonName(organism)}
												onSelect={(node) => handleOrganismSelect(organism, node)}
												isSelected={selectedOrganism.id === organism.id}
												bubbleRef={(node) => {
													bubbleNodesRef.current[index] = node;
												}}
											/>
										))}
									</div>
								))}
								{filteredOrganisms.length === 0 ? (
									<div className="rounded-xl bg-base-100/40 px-4 py-3 text-sm text-base-content/70">
										No featured organisms in this group yet.
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function OrganismDockCircle({
	organism,
	resolvedCommonName,
	onSelect,
	isSelected,
	bubbleRef
}: {
	organism: FeaturedOrganism;
	resolvedCommonName: string;
	onSelect: (node: HTMLButtonElement | null) => void;
	isSelected: boolean;
	bubbleRef: (node: HTMLButtonElement | null) => void;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	const imageSrc = organism.imageUrl ?? organism.imageSrc ?? DEFAULT_IMAGE_SRC;
	const commonName = resolvedCommonName;

	return (
		<button
			ref={bubbleRef}
			type="button"
			onClick={(event) => onSelect(event.currentTarget)}
			data-selected={isSelected ? "true" : "false"}
			className={[
				"organism-node group relative isolate overflow-hidden rounded-full",
				"h-22 w-22 shrink-0 bg-base-100/90 md:h-27 md:w-27",
				"transition-[transform,opacity] duration-200 ease-out will-change-transform",
				isSelected
					? "border-[3px] border-primary/85 shadow-md shadow-primary/25"
					: "border-2 border-base-content/15"
			].join(" ")}
			aria-label={`Open details for ${commonName}`}
		>
			{imageFailed ? (
				<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-sky-900/70 to-indigo-900/70 text-xl font-semibold text-white/85">
					{commonName.charAt(0).toUpperCase()}
				</div>
			) : (
				<Image
					src={imageSrc}
					alt={commonName}
					fill
					sizes="(max-width: 768px) 8rem, 10rem"
					quality={95}
					className="object-cover object-center"
					onError={() => setImageFailed(true)}
				/>
			)}
			<div
				className={[
					"pointer-events-none absolute inset-x-2 bottom-1.5 rounded-lg border border-white/20 bg-black/75 px-2 py-1",
					"text-center text-[12px] font-semibold leading-tight text-white",
					"opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100"
				].join(" ")}
			>
				{commonName}
			</div>
		</button>
	);
}

function readNodeScale(node: HTMLElement): number {
	const match = /scale\(([\d.]+)\)/.exec(node.style.transform);
	if (!match) return 1;
	const parsed = Number.parseFloat(match[1] ?? "1");
	return Number.isFinite(parsed) ? parsed : 1;
}

function SelectedOrganismCard({
	organism,
	resolvedCommonName
}: {
	organism: FeaturedOrganism;
	resolvedCommonName: string;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	const commonName = resolvedCommonName;
	const imageSrc = organism.imageUrl ?? organism.imageSrc ?? DEFAULT_IMAGE_SRC;
	const imageAttribution = normalizeImageAttribution(organism.imageAttribution);
	const iucnStatus = organism.iucnStatus ?? "Not Evaluated";
	const taxonomyString = toSingleTaxonomyString(organism.taxonomyString);
	const taxonomyHref = taxonomyString
		? `/explore/taxonomy/${encodeURIComponent(taxonomyString)}`
		: "/explore/taxonomy";

	useEffect(() => {
		setImageFailed(false);
	}, [imageSrc]);

	return (
		<article className="overflow-hidden rounded-2xl bg-transparent">
			<div className="translate-y-0 opacity-100 transition-[transform,opacity] duration-250 ease-out will-change-transform">
				<div className="p-3 md:p-4">
					<div className="relative aspect-6/5 w-full overflow-hidden rounded-2xl bg-transparent">
						{imageFailed ? (
							<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-sky-900/70 to-indigo-900/70 text-5xl font-semibold text-white/85">
								{commonName.charAt(0).toUpperCase()}
							</div>
						) : (
							<Image
								src={imageSrc}
								alt={commonName}
								fill
								sizes="(max-width: 1024px) 100vw, 760px"
								className="object-cover object-center"
								onError={() => setImageFailed(true)}
							/>
						)}
						{imageAttribution ? <ImageAttributionIcon attribution={imageAttribution} /> : null}
					</div>
				</div>

				<div className="flex flex-col gap-4 p-4 pt-2 sm:p-5 sm:pt-2">
					<div>
						<h3 className="text-2xl font-semibold text-base-content">{commonName}</h3>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<p className="text-base italic text-base-content/70">{organism.taxonomyName}</p>
						<span className="text-base-content/30">•</span>
						<span
							className={[
								"inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
								IUCN_BADGE_CLASS[iucnStatus] ?? IUCN_BADGE_CLASS["Not Evaluated"]
							].join(" ")}
						>
							IUCN: {iucnStatus}
						</span>
					</div>

					<p className="max-h-[240px] overflow-y-auto pr-1 text-[0.95rem] leading-relaxed text-base-content/85">
						{organism.description}
					</p>

					<div className="flex flex-wrap items-center gap-3 pt-1">
						<Link href={taxonomyHref} className="btn btn-primary btn-sm">
							View taxonomy
						</Link>
					</div>
				</div>
			</div>
		</article>
	);
}

function normalizeImageAttribution(attribution: string | undefined): string | null {
	const value = attribution?.trim();
	if (!value) return null;
	if (/to be updated|pending|coming soon/i.test(value)) return null;
	return value;
}

function ImageAttributionIcon({ attribution }: { attribution: string }) {
	const [hover, setHover] = useState(false);
	return (
		<div
			className="absolute bottom-2 right-2 z-20"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div className="relative">
				<div className="h-8 w-8 rounded-full bg-base-100/75 border border-base-200 backdrop-blur flex items-center justify-center shadow-sm">
					<span className="block h-4.5 w-4.5 bg-primary mask-[url('/images/icons/photo_icon.svg')] mask-contain mask-no-repeat mask-center [-webkit-mask-image:url('/images/icons/photo_icon.svg')] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]" />
				</div>
				{hover ? (
					<div className="absolute bottom-full right-0 mb-2 w-64 max-w-[80vw] rounded-lg border border-base-200 bg-base-100/95 p-2.5 text-xs text-base-content shadow-lg backdrop-blur">
						<span className="text-base-content/70">Attribution:</span> {attribution}
					</div>
				) : null}
			</div>
		</div>
	);
}

function toSingleTaxonomyString(taxonomyString: string | undefined): string | undefined {
	if (!taxonomyString) return undefined;
	const normalized = taxonomyString.trim();
	// Guard against accidentally passing a list of taxonomy paths.
	if (normalized.includes(",") || normalized.includes("|") || normalized.includes("\n")) {
		return undefined;
	}
	return normalized;
}

function toFilterGroup(group: FeaturedOrganismGroup): FeaturedFilterGroup {
	switch (group) {
		case "Fish":
			return "Fish";
		case "Protists and Microbial Eukaryotes":
			return "Protists";
		case "Invertebrate animals":
		case "Invertebrate organisms":
			return "Invertebrates";
		case "Other":
			return "Other";
		default:
			return "Other";
	}
}

function createFallbackCommonName(organism: FeaturedOrganism): string {
	const fromId = organism.id
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
	return fromId || organism.taxonomyName;
}

function getCenterOrganism(
	rows: Array<Array<{ organism: FeaturedOrganism; index: number }>>
): FeaturedOrganism | undefined {
	if (rows.length === 0) return undefined;
	const centerRow = rows[Math.floor(rows.length / 2)];
	if (!centerRow || centerRow.length === 0) return undefined;
	return centerRow[Math.floor(centerRow.length / 2)]?.organism;
}

function createHoneycombRows(
	organisms: FeaturedOrganism[]
): Array<Array<{ organism: FeaturedOrganism; index: number }>> {
	const total = organisms.length;
	if (total === 0) return [];

	// Build a true radial cluster on a hex grid (closest cells to center first),
	// which keeps a single rounded shape for any entry count.
	let hexRadius = 0;
	while (1 + 3 * hexRadius * (hexRadius + 1) < total) {
		hexRadius += 1;
	}

	type HexCell = {
		q: number;
		r: number;
		distance: number;
		angle: number;
	};
	const cells: HexCell[] = [];
	for (let q = -hexRadius; q <= hexRadius; q += 1) {
		const minR = Math.max(-hexRadius, -q - hexRadius);
		const maxR = Math.min(hexRadius, -q + hexRadius);
		for (let r = minR; r <= maxR; r += 1) {
			const s = -q - r;
			const distance = (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
			const angle = Math.atan2(r * Math.sqrt(3) * 0.5, q + r * 0.5);
			cells.push({ q, r, distance, angle });
		}
	}

	cells.sort((a, b) => {
		if (a.distance !== b.distance) return a.distance - b.distance;
		return a.angle - b.angle;
	});

	const selected = cells.slice(0, total);
	selected.sort((a, b) => {
		if (a.r !== b.r) return a.r - b.r;
		return a.q - b.q;
	});

	const rows: Array<Array<{ organism: FeaturedOrganism; index: number }>> = [];
	let organismCursor = 0;
	let currentRow = Number.NaN;
	for (const cell of selected) {
		if (cell.r !== currentRow) {
			rows.push([]);
			currentRow = cell.r;
		}
		const organism = organisms[organismCursor];
		if (!organism) break;
		rows[rows.length - 1].push({
			organism,
			index: organismCursor
		});
		organismCursor += 1;
	}

	return rows.filter((row) => row.length > 0);
}

function computeWatchRowShift(rowIndex: number): number {
	return rowIndex % 2 === 0 ? -6 : 6;
}

function mix(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
