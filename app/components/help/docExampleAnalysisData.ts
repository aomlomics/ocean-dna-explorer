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

export const ODE_OCCURRENCE_HEADERS = [
	"featureid",
	"Control10_20190721_MiFish_S52",
	"Control12_20190731_MiFish_S53",
	"Control9_20190715_MiFish_S51",
	"ExtNeg_20190910_MiFish_S55",
	"ExtNeg_20190918_MiFish_S56",
	"ExtNeg_20191028_MiFish_S57",
	"ExtNeg_20191031_MiFish_S58",
	"GU190706-CTD11-220_MiFish_S30",
	"GU190707-CTD13-310_MiFish_S31",
	"GU190707-CTD14-315_MiFish_S32",
	"GU190708-CTD16-252_MiFish_S33",
	"GU190708-CTD17-171_MiFish_S34",
	"GU190709-CTD20-280_MiFish_S35",
	"GU190710-CTD22-245_MiFish_S36",
	"GU190710-CTD23-190_MiFish_S37",
	"GU190714-CTD25-185_MiFish_S38",
	"GU190714-CTD26-260_MiFish_S39",
	"GU190715-CTD28-310_MiFish_S40",
	"GU190721-CTD31-205_MiFish_S41",
	"GU190722-CTD33-205_MiFish_S42",
	"GU190724-CTD36-310_MiFish_S43",
	"GU190727-CTD40-210_MiFish_S44",
	"GU190727-CTD41B-145_MiFish_S45",
	"GU190728-CTD43-245_MiFish_S46",
	"GU190728-CTD44B-125_MiFish_S47",
	"GU190729-CTD46-240_MiFish_S48",
	"GU190729-CTD47-140_MiFish_S49",
	"GU190731-CTD50-150_MiFish_S50",
	"PCRNeg_MiFish_S54"
] as const;

/** Counts per library column, same order as ODE_OCCURRENCE_HEADERS after featureid. */
export const ODE_OCCURRENCE_ROWS: { id: string; counts: number[] }[] = [
	{
		id: "010e7a145bf6d7824c0afab445d912db",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]
	},
	{
		id: "01b20b363c6b6b8077f7938f81522554",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2013, 0, 0, 0, 0, 0, 2574, 0, 0, 838, 3184, 0, 0, 0, 2449, 0]
	},
	{
		id: "04722aea39fdae29b213552fb69c7cee",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 672, 3, 6414, 0, 0]
	},
	{
		id: "0518a354c0e4e9fede9f4f671962be3b",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	},
	{
		id: "06faf9ae3ac3f725585afaad1bb1084d",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	},
	{
		id: "08c316db9d66f8b80955e688d209cfd1",
		counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	}
];
