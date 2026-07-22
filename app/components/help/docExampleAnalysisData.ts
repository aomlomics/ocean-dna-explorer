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

/** Library column headers: real lib_id values (GOMECC4 / RTSF example data). */
export const ODE_OCCURRENCE_HEADERS = [
	"featureid",
	"RTSF_NTC_1404_S287",
	"RTSF_NTC_1353_S192",
	"RTSF_NTC_1543_S96",
	"RTSF_NTC_1403_S191",
	"RTSF_NTC_1352_S96",
	"GOMECC18S_Neg2",
	"GOMECC18S_Neg1",
	"GOMECC16S_Neg2",
	"GOMECC16S_Neg1",
	"GOMECC18S_Plate6_9",
	"GOMECC18S_Plate6_8",
	"GOMECC18S_Plate6_7"
] as const;

/** Counts per library column, same order as ODE_OCCURRENCE_HEADERS after featureid. */
export const ODE_OCCURRENCE_ROWS: { id: string; counts: number[] }[] = [
	{
		id: "010e7a145bf6d7824c0afab445d912db",
		counts: [3, 0, 11, 0, 0, 0, 8, 0, 0, 15, 0, 2]
	},
	{
		id: "01b20b363c6b6b8077f7938f81522554",
		counts: [19, 0, 0, 4, 0, 0, 0, 0, 6, 0, 3, 0]
	},
	{
		id: "04722aea39fdae29b213552fb69c7cee",
		counts: [0, 0, 9, 0, 0, 21, 0, 0, 0, 0, 0, 1]
	},
	{
		id: "0518a354c0e4e9fede9f4f671962be3b",
		counts: [0, 0, 0, 0, 12, 0, 5, 0, 0, 7, 0, 0]
	},
	{
		id: "06faf9ae3ac3f725585afaad1bb1084d",
		counts: [0, 6, 0, 0, 0, 0, 0, 2, 14, 0, 0, 4]
	},
	{
		id: "08c316db9d66f8b80955e688d209cfd1",
		counts: [1, 0, 0, 0, 8, 0, 0, 0, 0, 5, 0, 10]
	}
];
