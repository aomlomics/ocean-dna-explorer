/**
 * Sample rows from ODE_testdata (noaa-sefsc-gu1901): same featureids in ASV and occurrence tables.
 * https://github.com/aomlomics/ODE_testdata/tree/main/noaa-sefsc-gu1901
 */

export const ODE_ASV_HEADERS = [
	"featureid",
	"dna_sequence",
	"taxonomy",
	"verbatimIdentification",
	"kingdom",
	"phylum",
	"class",
	"order",
	"family",
	"genus",
	"species",
	"Confidence"
] as const;

/** One row per column after featureid + sequence (taxonomy through Confidence). */
export type OdeAsvRow = {
	featureid: string;
	dna_sequence: string;
	cells: string[];
};

export const ODE_ASV_ROWS: OdeAsvRow[] = [
	{
		featureid: "010e7a145bf6d7824c0afab445d912db",
		dna_sequence:
			"CACCGCGGTTATACGAGAGACCCAAGTTGTTAAATCACGGCGTAAAGGGTGGTTAAGATCCCCTAAAACTAAAGCCGAACACCTTCAGGGCAGTTATACGCATCCGAAGGCACGAAGCCCCACCACGAAAGTGACTTTACCCAGCCCGAACCCACGATAGCTAAGAT",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Scombriformes",
			"Eukaryota;Chordata;Actinopteri;Scombriformes",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Scombriformes",
			"",
			"",
			"",
			"0.9973788688616797"
		]
	},
	{
		featureid: "01b20b363c6b6b8077f7938f81522554",
		dna_sequence:
			"CACCGCGGTTAGACGAGAGACCCAAGTTGACATCAAACGGCGTAAAGAGTGGTGAAGAACCAACTAAACTAAAGCTAAACCCCCTCCTGGCCGTTATACGCATCCGAAAGGGTGAGACACCACTACAAAAGTAGCTTTATAATTATCTGACTCCACGACAGTTAAGGA",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Stomiiformes;Sternoptychidae;Maurolicus",
			"Eukaryota;Chordata;Actinopteri;Stomiiformes;Sternoptychidae;Maurolicus",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Stomiiformes",
			"Sternoptychidae",
			"Maurolicus",
			"",
			"0.9999999999964182"
		]
	},
	{
		featureid: "04722aea39fdae29b213552fb69c7cee",
		dna_sequence:
			"CACCGCGGTTATACGAGAGGCCCAAGTTGACAGAAAGCGGCGTAAAGAGTGGCTAGGGAAACGAACAAACTAGAGCCGAAAGCCTTCAAAACTGTTATACGCCCCATCGAAGGCACGAAGACCAAACACGAAAGTGGCCCTACTCGCCCTGACCCCACGAAAGCTAAGGC",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Pleuronectiformes;Bothidae;Trichopsetta;Trichopsetta ventralis",
			"Eukaryota;Chordata;Actinopteri;Pleuronectiformes;Bothidae;Trichopsetta;Trichopsetta ventralis",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Pleuronectiformes",
			"Bothidae",
			"Trichopsetta",
			"Trichopsetta ventralis",
			"0.9999999996728093"
		]
	},
	{
		featureid: "0518a354c0e4e9fede9f4f671962be3b",
		dna_sequence:
			"CACCGCGGTTATACGAGAGGCTCAAATTGACAGGCGCCGGCGTAAAGAGTGGTCAAGGATTCAATGTAATAAGGCCGTACACCCCCCCGCTGTTATACGCCCCCGGAGAAATGAAGCCCCCACGAAAGTAGCCTTACCACACCTGAACCCACGACAACTAAGAA",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Stomiiformes;Gonostomatidae;Bonapartia;Bonapartia pedaliota",
			"Eukaryota;Chordata;Actinopteri;Stomiiformes;Gonostomatidae;Bonapartia;Bonapartia pedaliota",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Stomiiformes",
			"Gonostomatidae",
			"Bonapartia",
			"Bonapartia pedaliota",
			"0.999999999"
		]
	},
	{
		featureid: "06faf9ae3ac3f725585afaad1bb1084d",
		dna_sequence:
			"CACCGCGGTTATACGAGAGGCCCAAGTTGACAGTTACCGGCGTAAAGAGTGGTTAAAGAATAATAGATACTAAAGCCGAATAGCCCCTAGGCTGTTATACGCACCTGGGGGCACGAAGCCCTCCCACGAAAGTGGCTTTACCCCCCCCGAACCCACGACAGCTATGCT",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Argentiniformes;Argentinidae;Argentina;Argentina striata",
			"Eukaryota;Chordata;Actinopteri;Argentiniformes;Argentinidae;Argentina;Argentina striata",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Argentiniformes",
			"Argentinidae",
			"Argentina",
			"Argentina striata",
			"0.911488241"
		]
	},
	{
		featureid: "08c316db9d66f8b80955e688d209cfd1",
		dna_sequence:
			"CACCGCGGTCATACGAGTGTTAGCCCAAGCGGATGACTAACGGCGTAAAGAGTGGCTAGGGAACCCCCCCCCCACAACTAAAGTTAAACACCCACAAGGCCGTGATACGCATCCGATGGAATGAAACCCCACCACGAAAGTGACTTTACCCAGCCCGAACCCACGATAGCTAAGAT",
		cells: [
			"Eukaryota;Chordata;Actinopteri;Myctophiformes;Myctophidae;Diaphus;Diaphus dumerilii",
			"Eukaryota;Chordata;Actinopteri;Myctophiformes;Myctophidae;Diaphus;Diaphus dumerilii",
			"Eukaryota",
			"Chordata",
			"Actinopteri",
			"Myctophiformes",
			"Myctophidae",
			"Diaphus",
			"Diaphus dumerilii",
			"0.9999999999779732"
		]
	}
];

/** Short example library column names (replace with your real lib_id values). */
export const ODE_OCCURRENCE_HEADERS = [
	"featureid",
	"lib_S01",
	"lib_S02",
	"lib_S03",
	"lib_S04",
	"lib_S05",
	"lib_S06",
	"lib_S07",
	"lib_S08",
	"lib_S09",
	"lib_S10",
	"lib_S11",
	"lib_S12"
] as const;

/** Counts per library column, same order as ODE_OCCURRENCE_HEADERS after featureid. */
export const ODE_OCCURRENCE_ROWS: { id: string; counts: number[] }[] = [
	{
		id: "010e7a145bf6d7824c0afab445d912db",
		counts: [3, 0, 12, 45, 0, 88, 120, 0, 2, 156, 0, 24]
	},
	{
		id: "01b20b363c6b6b8077f7938f81522554",
		counts: [2013, 450, 0, 88, 2574, 3184, 0, 838, 120, 2449, 15, 640]
	},
	{
		id: "04722aea39fdae29b213552fb69c7cee",
		counts: [0, 12, 672, 3, 0, 6414, 44, 0, 210, 0, 92, 18]
	},
	{
		id: "0518a354c0e4e9fede9f4f671962be3b",
		counts: [66, 0, 14, 0, 205, 0, 33, 410, 0, 7, 156, 0]
	},
	{
		id: "06faf9ae3ac3f725585afaad1bb1084d",
		counts: [4, 18, 0, 0, 92, 0, 0, 15, 300, 0, 44, 12]
	},
	{
		id: "08c316db9d66f8b80955e688d209cfd1",
		counts: [1, 0, 22, 0, 8, 0, 190, 0, 4, 67, 0, 12]
	}
];
