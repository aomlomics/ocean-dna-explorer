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
	 * Not used for routing yet (for now, "View taxonomy" always goes to `/explore/taxonomy` list).
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
		imageAttribution: "Image attribution pending.",
		description:
			"The Pacific viperfish is a deep-sea predator that grows up to a foot long in the dark waters of the North Pacific. They are famous for possessing extremely large, needle-like teeth that actually curl upward past their eyes. Along with a highly flexible jaw, these oversized fangs allow them to trap and swallow surprisingly large prey whole. Like many deep-sea hunters, they also rely on glowing bioluminescent spots to camouflage themselves and attract curious meals. "
	},
	{
		id: "macropinna-microstoma",
		group: "Fish",
		taxonomyName: "Macropinna microstoma",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The barreleye fish is a small, six-inch deep-sea species famous for its completely transparent, fluid-filled forehead. Inside this clear dome sit two highly sensitive, bright green tubular eyes that normally point straight up to spot the shadows of prey above them. Once a meal is spotted, the fish can actually rotate its eyes completely forward to strike. Scientists believe they often use this incredible vision to steal small crustaceans right out of the tentacles of other deep-sea creatures."
	},
	{
		id: "careproctus-melanurus",
		group: "Fish",
		taxonomyName: "Careproctus melanurus",
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
		imageSrc: "/images/featured_organisms/lanternfish.webp",
		imageAttribution: "Taken by NOAA Fisheries.",
		description:
			"Belonging to the family Myctophidae, lanternfish are the most abundant fish in the world's oceans. Their bodies feature special light organs called photophores, which act as biological multitools. They flash these glowing spots to signal species identity, attract mates, and hunt in the dark twilight zone. They form a crucial foundation of the global marine food web. "
	},
	{
		id: "callorhinchus-milii",
		group: "Fish",
		taxonomyName: "Callorhinchus milii",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The elephant fish, or ghost shark, is a fascinating cartilaginous fish closely related to sharks and rays. Growing to about four feet long, they are easily recognized by their unique, hoe-shaped snout. They use this highly specialized snout to probe the muddy sea floor to hunt for shellfish and other small invertebrates. "
	},
	{
		id: "ptychogastria-polaris",
		group: "Invertebrate animals",
		taxonomyName: "Ptychogastria polaris",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This cold-water jellyfish thrives in extreme polar environments. Unlike many jellyfish that constantly drift in the open ocean, they often use special adhesive tentacles to attach themselves directly to the seafloor. They are quite small and rely on this bottom-dwelling strategy to catch passing prey in frigid ocean currents. "
	},
	{
		id: "swima-bombiviridis",
		group: "Invertebrate animals",
		taxonomyName: "Swima bombiviridis",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The green bomber worm is a deep-sea marine worm with a highly unusual defense mechanism. When threatened by a predator, it releases tiny, fluid-filled sacs that burst into glowing green bioluminescent bombs. This sudden, bright flash of light distracts the predator, allowing the worm to quickly swim away into the darkness. "
	},
	{
		id: "cystisoma",
		group: "Invertebrate animals",
		taxonomyName: "Cystisoma",
		imageAttribution: "Source: NOAA Ocean Explorer (to be updated).",
		description:
			"Cystisoma is a pelagic crustacean that lives entirely in the dark, open ocean. To hide from predators, its body is completely transparent and lacks any pigmentation, making it look exactly like a floating alien shrimp. They also have massive eyes that take up most of their head, helping them spot the faint silhouettes of prey above them. "
	},
	{
		id: "actinoptychus-splendens",
		group: "Invertebrate organisms",
		taxonomyName: "Actinoptychus splendens",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This species of diatom is a microscopic, single-celled alga famous for its stunning, glass-like shell. Their shells are made of silica and feature incredible geometric patterns with ornamental radial symmetry. Like other diatoms, they are vital to the ocean ecosystem because they produce a massive amount of the oxygen we breathe through photosynthesis. "
	},
	{
		id: "dysidea-cf-arenaria",
		group: "Invertebrate animals",
		taxonomyName: "Dysidea cf. arenaria",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"This marine sponge is known for its soft texture and striking blue or lavender coloration. They grow in irregular, lobed formations permanently attached to the sea floor. As efficient filter feeders, they constantly pump seawater through their porous bodies to extract microscopic food and dissolved nutrients. "
	},
	{
		id: "capitella",
		group: "Invertebrate animals",
		taxonomyName: "Capitella",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Capitella worms are small marine worms that live entirely buried in coastal sediments. They are incredibly tolerant of poor water conditions and actually thrive in heavily polluted environments where other marine life cannot survive. Because of this, scientists frequently use them as bioindicators to identify coastal areas suffering from severe organic pollution. "
	},
	{
		id: "calanus",
		group: "Invertebrate animals",
		taxonomyName: "Calanus",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"Calanus copepods are tiny crustaceans that form a massive and crucial component of the ocean's zooplankton. They are grazing powerhouses that consume vast amounts of microscopic marine algae. By doing this, they act as a vital energy bridge, transferring the sun's energy from tiny plants up to the commercial fish, seabirds, and whales that eat them. "
	},
	{
		id: "acartia",
		group: "Invertebrate animals",
		taxonomyName: "Acartia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Acartia is a common genus of small copepods found abundantly in coastal waters and estuaries around the world. They are fast swimmers that dart through the water column feeding heavily on phytoplankton. They serve as a primary food source for many commercial fish species during their highly vulnerable early larval stages. "
	},
	{
		id: "daphnia",
		group: "Invertebrate animals",
		taxonomyName: "Daphnia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Commonly known as water fleas, Daphnia are microscopic crustaceans found heavily in freshwater lakes and ponds. They have a completely transparent body that allows scientists to easily observe their internal organs, including their beating hearts, under a microscope. Because they are highly sensitive to environmental changes, they are widely used globally in ecological research and water toxicity testing. "
	},
	{
		id: "mytilus",
		group: "Invertebrate animals",
		taxonomyName: "Mytilus",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Mytilus is a genus of widely recognized marine mussels found clinging to rocky coastlines across the globe. They attach themselves to hard surfaces using incredibly strong, natural threads that withstand crashing waves. They are powerful filter feeders that help clean coastal waters and represent a major, highly sustainable food source in the global aquaculture industry. "
	},
	{
		id: "crassostrea",
		group: "Invertebrate animals",
		taxonomyName: "Crassostrea",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Crassostrea oysters are iconic marine bivalves that construct massive underwater reefs over generations. These reefs act as critical infrastructure in coastal waters, providing safe nursery habitats for countless other fish and crab species. A single adult oyster can also filter dozens of gallons of water a day, making them absolutely essential for keeping estuaries clean. "
	},
	{
		id: "loligo",
		group: "Invertebrate animals",
		taxonomyName: "Loligo",
		imageAttribution: "Image attribution pending.",
		description:
			"Loligo is a widely distributed genus of fast-swimming squids found primarily in shallow coastal waters. They are highly active predators that use their specialized tentacles and sharp beaks to hunt small fish and crustaceans. They are an incredibly important food source for marine mammals and represent a massive target for global commercial fisheries. "
	},
	{
		id: "aplysia",
		group: "Invertebrate animals",
		taxonomyName: "Aplysia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Commonly known as sea hares, Aplysia are large herbivorous sea slugs that graze constantly on marine algae. They are famous for releasing a thick cloud of purple ink when threatened to confuse potential predators. Because they possess very large, easily identifiable nerve cells, they are one of the most important model organisms used in human neurobiology and memory research. "
	},
	{
		id: "asterias",
		group: "Invertebrate animals",
		taxonomyName: "Asterias",
		imageAttribution: "Image attribution pending.",
		description:
			"Asterias sea stars are instantly recognizable marine invertebrates commonly found in rocky intertidal zones. They are slow but relentless predators that primarily hunt mussels, barnacles, and oysters. They use their powerful tube feet to slowly pry open shells and actually push their stomachs outside their bodies to digest their prey alive. "
	},
	{
		id: "mnemiopsis",
		group: "Invertebrate animals",
		taxonomyName: "Mnemiopsis",
		imageAttribution: "Image attribution pending.",
		description:
			"Mnemiopsis is a gelatinous, transparent comb jelly native to the western Atlantic Ocean. Unlike true jellyfish, they do not have stinging tentacles and instead use sticky cells to capture small zooplankton. They are notorious for being a highly destructive invasive species, capable of completely collapsing local food webs when introduced to new environments like the Black Sea. "
	},
	{
		id: "aurelia",
		group: "Invertebrate animals",
		taxonomyName: "Aurelia",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The moon jellyfish is an incredibly common marine species found floating in coastal waters all over the world. They are easily identified by their translucent, saucer-shaped bells and the four distinct horseshoe-shaped reproductive organs visible inside them. They are weak swimmers that mostly drift with ocean currents, feeding harmlessly on tiny plankton. "
	},
	{
		id: "alexandrium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Alexandrium",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Alexandrium is a microscopic marine plankton known for its massive impact on coastal economies and human health. Under certain conditions, they multiply rapidly to form massive, harmful algal blooms. Some species produce a potent neurotoxin that accumulates in filter-feeding shellfish, which can cause severe paralytic shellfish poisoning in humans who consume them. "
	},
	{
		id: "karlodinium",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Karlodinium",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"Karlodinium is a microscopic marine alga frequently found in estuaries and shallow coastal waters worldwide. While normally harmless in small numbers, they can bloom densely and release specialized toxins directly into the water. These unique \"karlotoxins\" severely damage the gills of fish, making this organism responsible for devastating fish kills globally. "
	},
	{
		id: "tripos",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Tripos",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Tripos is a genus of large, single-celled marine plankton easily identified by their distinct, three-pronged shape. They grow long, horn-like extensions that significantly increase their surface area. This unique geometry acts like a microscopic parachute, preventing them from sinking and helping them regulate their buoyancy in the sunlit upper ocean. "
	},
	{
		id: "noctiluca",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Noctiluca",
		imageAttribution: "Sources: Flickr and GBIF occurrence (to be updated).",
		description:
			"Noctiluca is a circular, single-celled organism famous for producing incredible marine light shows. When massive numbers gather near the coast, they can make the water look heavily discolored during the day. At night, physical disturbance from crashing waves or passing boats triggers them to emit a stunning, bright blue bioluminescent glow. "
	},
	{
		id: "karenia",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Karenia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Karenia is a notorious genus of marine phytoplankton primarily found blooming in the Gulf of America. They are the primary organisms responsible for extreme \"red tide\" events that discolor the water. During these massive blooms, they release airborne toxins that kill vast amounts of marine life and can cause severe respiratory irritation in humans living near the coast. "
	},
	{
		id: "ammonia",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Ammonia",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Ammonia is a type of microscopic, single-celled organism that builds beautiful, tiny spiral shells out of calcium carbonate. They live predominantly in the muddy sediments of shallow coastal waters and estuaries. Because their shell growth is highly sensitive to surrounding water quality, scientists frequently study them to monitor historical and modern pollution levels. "
	},
	{
		id: "globigerina",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Globigerina",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Globigerina are single-celled marine organisms that drift freely in the sunlit layers of the open ocean. They construct tiny, complex shells that fall to the deep seafloor when the organism dies. These millions of accumulated fossil shells serve as microscopic time capsules, allowing scientists to reconstruct ancient ocean temperatures and historical climate changes. "
	},
	{
		id: "thalassiosira",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Thalassiosira",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Thalassiosira is a widespread genus of microscopic marine algae encased in intricate, pillbox-like silica shells. They frequently link together in long, beautiful chains and thrive in cold, highly nutrient-rich waters. As highly efficient photosynthesizers, they are responsible for a massive portion of the global ocean's primary food and oxygen production. "
	},
	{
		id: "phaeocystis",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Phaeocystis",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Phaeocystis is a fascinating type of marine phytoplankton that can exist as single cells or as massive, floating gelatinous colonies that resemble sea foam. When these massive ocean blooms eventually die, they release huge amounts of sulfur compounds into the atmosphere. This biological process actually helps seed cloud formation over the ocean, playing a surprising role in regulating the global climate. "
	},
	{
		id: "ostreococcus",
		group: "Protists and Microbial Eukaryotes",
		taxonomyName: "Ostreococcus",
		imageAttribution: "Image attribution pending.",
		description: ""
	},
	{
		id: "baleen-whales",
		group: "Marine Mammals",
		taxonomyName: "Baleen whales (Balaenoptera musculus, B. physalus, B. acutorostrata, Megaptera novaeangliae)",
		imageAttribution: "Sources: GBIF occurrence and Flickr (to be updated).",
		description:
			"Baleen whales represent some of the largest animals to have ever lived on Earth, including the massive blue whale. Instead of teeth, they have giant plates of bristly baleen hanging from their upper jaws to filter vast amounts of tiny krill and fish from the ocean. They are highly intelligent, communicative mammals that undertake some of the longest seasonal migrations on the planet. "
	},
	{
		id: "toothed-whales",
		group: "Marine Mammals",
		taxonomyName: "Toothed whales (Orcinus orca)",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Toothed whales include highly recognizable, highly intelligent marine predators like the killer whale, or orca. They are apex predators equipped with sharp teeth and rely on advanced echolocation to hunt fish, squid, and even other marine mammals. They possess incredibly complex social structures and are known to pass down distinct hunting techniques through familial generations. "
	},
	{
		id: "small-cetaceans",
		group: "Marine Mammals",
		taxonomyName: "Small cetaceans (Phocoenoides dalli, Mesoplodon spp.)",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"Smaller cetaceans include marine mammals like Dall's porpoise, or Bottlenose dolphin. They are incredibly fast and energetic swimmers, frequently seen actively riding the bow waves of passing boats. Despite their incredible speed, they remain a vital food source for larger apex predators like great white sharks and transient killer whales. "
	},
	{
		id: "ariomma-bondi",
		group: "Fish",
		taxonomyName: "Ariomma bondi",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The silver-rag driftfish is a relatively small, deep-bodied fish found throughout the western Atlantic Ocean. They have a brilliant silvery appearance and typically school together in deeper offshore waters over muddy seafloors. Though largely obscure to the public, they serve as an incredibly important forage fish for larger deep-water marine predators. "
	},
	{
		id: "neoepinnula-americana",
		group: "Fish",
		taxonomyName: "Neoepinnula americana",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The American sackfish is an elongated, predatory fish found in the deep waters of the western Atlantic and Gulf of Mexico. They possess a long, sleek body equipped with sharp teeth designed perfectly for hunting smaller fish and squid in the dark. They are typically found hovering near the ocean bottom at depths up to several thousand feet. "
	},
	{
		id: "baldwinella-aureorubens",
		group: "Fish",
		taxonomyName: "Baldwinella aureorubens",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The streamer bass is a beautifully colored fish found inhabiting deep coral reefs and rocky ledges in the western Atlantic. They are relatively small and feature striking red and golden hues that help them blend into deep-water environments. They are a classic, beautiful example of the vibrant and hidden biodiversity found in deep marine ecosystems. "
	},
	{
		id: "parascombrops-spinosus",
		group: "Fish",
		taxonomyName: "Parascombrops spinosus",
		imageAttribution: "Source: Flickr (to be updated).",
		description:
			"The keelcheek bass is a small, deep-water marine fish frequently found occupying the Gulf of Mexico. They live near muddy or sandy seafloors at significant depths, usually well below the reach of recreational scuba divers. They are primarily bottom-dwellers that feed entirely on tiny deep-sea crustaceans and smaller juvenile fish. "
	},
	{
		id: "maurolicus-weitzmani",
		group: "Fish",
		taxonomyName: "Maurolicus weitzmani",
		imageAttribution: "Source: GBIF occurrence (to be updated).",
		description:
			"The Atlantic pearlside is a tiny, deep-sea fish that forms massive, dense schools in the open ocean. Like many twilight zone inhabitants, their bellies are lined with glowing photophores that help camouflage their silhouettes against the faint light from the surface. They undertake massive daily migrations, swimming up at night to feed before returning to the deep safety of the dark during the day. "
	}
];

type FeaturedFilterGroup = "All" | "Fish" | "Invertebrates" | "Protists" | "Fungi" | "Other";

const FEATURED_FILTER_GROUPS: FeaturedFilterGroup[] = ["All", "Fish", "Invertebrates", "Protists", "Fungi", "Other"];

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

export default function FeaturedOrganisms() {
	const [activeGroup, setActiveGroup] = useState<FeaturedFilterGroup>("All");
	const [selectedOrganism, setSelectedOrganism] = useState<FeaturedOrganism>(FEATURED_ORGANISMS[0]);
	const bubbleNodesRef = useRef<(HTMLButtonElement | null)[]>([]);

	const filteredOrganisms = useMemo(() => {
		if (activeGroup === "All") return FEATURED_ORGANISMS;
		return FEATURED_ORGANISMS.filter((organism) => toFilterGroup(organism.group) === activeGroup);
	}, [activeGroup]);
	const honeycombRows = useMemo(() => createHoneycombRows(filteredOrganisms), [filteredOrganisms]);

	useEffect(() => {
		bubbleNodesRef.current = bubbleNodesRef.current.slice(0, filteredOrganisms.length);
	}, [filteredOrganisms.length]);

	useEffect(() => {
		if (filteredOrganisms.length === 0) return;
		const stillVisible = filteredOrganisms.some((organism) => organism.id === selectedOrganism.id);
		if (!stillVisible) {
			const randomIndex = Math.floor(Math.random() * filteredOrganisms.length);
			setSelectedOrganism(filteredOrganisms[randomIndex]);
		}
	}, [filteredOrganisms, selectedOrganism.id]);

	function handleBubbleFieldMouseMove(event: React.MouseEvent<HTMLDivElement>) {
		const { clientX, clientY } = event;
		for (const node of bubbleNodesRef.current) {
			if (!node) continue;
			const rect = node.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const dx = clientX - centerX;
			const dy = clientY - centerY;
			const distance = Math.hypot(dx, dy);

			let scale = 1;
			if (distance < 90) {
				scale = 1.22;
			} else if (distance < 190) {
				const t = (distance - 90) / 100;
				scale = 1.22 - t * 0.16;
			}

			node.style.transform = `scale(${scale.toFixed(3)})`;
			if (scale > 1.2) {
				node.style.zIndex = "30";
			} else if (scale > 1) {
				node.style.zIndex = "20";
			} else {
				node.style.zIndex = "10";
			}
		}
	}

	function handleBubbleFieldMouseLeave() {
		for (const node of bubbleNodesRef.current) {
			if (!node) continue;
			node.style.transform = "scale(1)";
			node.style.zIndex = "10";
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
							className={[
								"rounded-full border px-4 py-2 text-sm font-medium will-change-transform",
								"transition-transform duration-200 ease-out hover:-translate-y-0.5",
								isActive
									? "border-primary/60 bg-primary/15 text-primary"
									: "border-base-content/15 bg-base-200/70 text-base-content/80"
							].join(" ")}
							aria-pressed={isActive}
						>
							{group}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-4 md:gap-6">
				<div className="self-center">
					<SelectedOrganismCard organism={selectedOrganism} />
				</div>

				<div
					onMouseMove={handleBubbleFieldMouseMove}
					onMouseLeave={handleBubbleFieldMouseLeave}
					className="min-w-0 flex-1 py-4 md:py-6"
				>
					<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 md:gap-3">
						{honeycombRows.map((row, rowIndex) => (
							<div
								key={`honeycomb-row-${rowIndex}`}
								className={[
									"flex items-center justify-center gap-5 md:gap-7",
									rowIndex === 0 ? "" : "-mt-2 md:-mt-3"
								].join(" ")}
							>
								{row.map(({ organism, index }) => (
									<OrganismDockCircle
										key={organism.id}
										organism={organism}
										onSelect={() => setSelectedOrganism(organism)}
										isSelected={selectedOrganism.id === organism.id}
										bubbleRef={(node) => {
											bubbleNodesRef.current[index] = node;
										}}
									/>
								))}
							</div>
						))}
						{filteredOrganisms.length === 0 ? (
							<div className="rounded-xl border border-base-content/10 bg-base-200/60 px-4 py-3 text-sm text-base-content/70">
								No featured organisms in this group yet.
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	);
}

function OrganismDockCircle({
	organism,
	onSelect,
	isSelected,
	bubbleRef
}: {
	organism: FeaturedOrganism;
	onSelect: () => void;
	isSelected: boolean;
	bubbleRef: (node: HTMLButtonElement | null) => void;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	const imageSrc = organism.imageUrl ?? organism.imageSrc ?? DEFAULT_IMAGE_SRC;
	const commonName = organism.commonName ?? createFallbackCommonName(organism);

	return (
		<button
			ref={bubbleRef}
			type="button"
			onClick={onSelect}
			className={[
				"organism-node group relative isolate overflow-hidden rounded-full",
				"w-20 h-20 md:w-24 md:h-24 shrink-0 border-2 bg-base-200/80 shadow-sm",
				"transition-all duration-200 ease-out will-change-transform",
				isSelected ? "border-primary/60" : "border-base-content/10"
			].join(" ")}
			style={{ zIndex: 10 }}
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
					sizes="(max-width: 768px) 5rem, 6rem"
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

function SelectedOrganismCard({ organism }: { organism: FeaturedOrganism }) {
	const [imageFailed, setImageFailed] = useState(false);
	const commonName = organism.commonName ?? createFallbackCommonName(organism);
	const imageSrc = organism.imageUrl ?? organism.imageSrc ?? DEFAULT_IMAGE_SRC;
	const iucnStatus = organism.iucnStatus ?? "Not Evaluated";
	const taxonomyHref = organism.taxonomyString
		? `/explore/taxonomy/${encodeURIComponent(organism.taxonomyString)}`
		: "/explore/taxonomy";

	return (
		<article className="w-[320px] md:w-[360px] shrink-0 overflow-hidden rounded-2xl border border-base-content/10 bg-base-100/95 shadow-sm">
			<div className="translate-y-0 opacity-100 transition-[transform,opacity] duration-250 ease-out will-change-transform">
				<div className="relative aspect-video w-full bg-base-200">
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
				</div>

				<div className="space-y-4 p-4 sm:p-5">
					<div>
						<p className="text-xs uppercase tracking-wide text-base-content/55">Featured organism</p>
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

					<p className="text-sm leading-relaxed text-base-content/80">{organism.description}</p>

					<div className="flex flex-wrap items-center gap-3 pt-1">
						<Link href={taxonomyHref} className="btn btn-primary btn-sm">
							View taxonomy
						</Link>
						<p className="text-xs text-base-content/45">
							Image credits: {organism.imageAttribution ?? "Attribution coming soon."}
						</p>
					</div>
				</div>
			</div>
		</article>
	);
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

function createHoneycombRows(
	organisms: FeaturedOrganism[]
): Array<Array<{ organism: FeaturedOrganism; index: number }>> {
	const total = organisms.length;
	if (total === 0) return [];

	const longRowSize = clamp(Math.ceil(Math.sqrt(total)), 3, 7);
	const shortRowSize = Math.max(2, longRowSize - 1);
	const rowSizes: number[] = [];

	// For smaller sets, form a centered 3-row cluster like x / y / x.
	if (total <= longRowSize * 3) {
		const center = Math.min(longRowSize, total);
		const remainder = total - center;
		const top = Math.ceil(remainder / 2);
		const bottom = Math.floor(remainder / 2);
		for (const size of [top, center, bottom]) {
			if (size > 0) rowSizes.push(size);
		}
	} else {
		let remaining = total;
		let useLongRow = true;
		while (remaining > 0) {
			const target = useLongRow ? longRowSize : shortRowSize;
			const size = Math.min(target, remaining);
			rowSizes.push(size);
			remaining -= size;
			useLongRow = !useLongRow;
		}

		// Prevent a tiny dangling last row by borrowing from prior rows.
		const minTailSize = Math.max(2, shortRowSize - 1);
		const tailIndex = rowSizes.length - 1;
		if (tailIndex > 0 && rowSizes[tailIndex] < minTailSize) {
			let needed = minTailSize - rowSizes[tailIndex];
			for (let i = tailIndex - 1; i >= 0 && needed > 0; i -= 1) {
				const floor = i % 2 === 0 ? Math.max(2, longRowSize - 2) : Math.max(2, shortRowSize - 1);
				const movable = Math.max(0, rowSizes[i] - floor);
				const move = Math.min(movable, needed);
				rowSizes[i] -= move;
				rowSizes[tailIndex] += move;
				needed -= move;
			}
		}
	}

	const rows: Array<Array<{ organism: FeaturedOrganism; index: number }>> = [];
	let cursor = 0;
	for (const size of rowSizes) {
		const slice = organisms.slice(cursor, cursor + size).map((organism, offset) => ({
			organism,
			index: cursor + offset
		}));
		rows.push(slice);
		cursor += size;
	}

	return rows;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
