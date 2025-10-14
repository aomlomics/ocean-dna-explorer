import { RanksBySpecificity } from "@/types/objects";
import { Prisma, Taxonomy } from "@/app/generated/prisma/client";
import distinctColors from "distinct-colors";

export async function fetcher(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		const data = await res.json();
		return { error: data.error };
	}
	return await res.json();
}

//export function getBaseUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:3000/";
//	}
//	return "https://opaldb.vercel.app/";
//}

//export function getRemoteUrl() {
//	if (process.env.NODE_ENV === "development") {
//		return "http://localhost:8080";
//	}
//	return "https://opalserver-qnwedardvq-uc.a.run.app";
//}

export function randomColors(count: number) {
	const colors = distinctColors({ count });

	return colors.map((c) => {
		const rgb = c.rgb();
		return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
	});
}

export function generateThemedColors(count: number, baseColor: string): string[] {
	const colors: string[] = [];
	const [baseR, baseG, baseB] = baseColor.match(/\d+/g)!.map(Number);

	for (let i = 0; i < count; i++) {
		const factor = 1 - i / (count * 1.5);
		const r = Math.max(0, Math.min(255, Math.floor(baseR * factor)));
		const g = Math.max(0, Math.min(255, Math.floor(baseG * factor)));
		const b = Math.max(0, Math.min(255, Math.floor(baseB * factor)));
		colors.push(`rgb(${r},${g},${b})`);
	}

	return colors;
}

export function generateChartColors(count: number): string[] {
	const primary = "rgb(100, 171, 220)";
	const secondary = "rgb(35, 61, 127)";
	const colors: string[] = [];

	if (count === 0) {
		return colors;
	}

	if (count === 1) {
		return [primary];
	}

	colors.push(primary, secondary);

	const generateShade = (color: string, factor: number) => {
		const [r, g, b] = color.match(/\d+/g)!.map(Number);
		const newR = Math.max(0, Math.min(255, Math.floor(r * factor)));
		const newG = Math.max(0, Math.min(255, Math.floor(g * factor)));
		const newB = Math.max(0, Math.min(255, Math.floor(b * factor)));
		return `rgb(${newR},${newG},${newB})`;
	};

	for (let i = 2; i < count; i++) {
		const factor = 1 - (i - 1) / (count * 1.5);
		if (i % 2 === 0) {
			colors.push(generateShade(primary, factor));
		} else {
			colors.push(generateShade(secondary, factor));
		}
	}

	return colors;
}

export function getMostSpecificRank(taxonomy: Taxonomy) {
	for (const rank of RanksBySpecificity) {
		if (taxonomy[rank]) {
			return { rank, label: taxonomy[rank] as string };
		}
	}

	return { rank: "taxonomy", label: taxonomy.taxonomy };
}

//handles converting numbers from 0 to 99
function stringToNumber(str: string) {
	const NUMBERS = {
		ZERO: 0,
		ONE: 1,
		TWO: 2,
		THREE: 3,
		FOUR: 4,
		FIVE: 5,
		SIX: 6,
		SEVEN: 7,
		EIGHT: 8,
		NINE: 9,
		TEN: 10,
		ELEVEN: 11,
		TWELVE: 12,
		THIRTEEN: 13,
		FOURTEEN: 14,
		FIFTEEN: 15,
		SIXTEEN: 16,
		SEVENTEEN: 17,
		EIGHTEEN: 18,
		NINETEEN: 19,
		TWENTY: 20,
		THIRTY: 30,
		FOURTY: 40,
		FIFTY: 50,
		SIXTY: 60,
		SEVENTY: 70,
		EIGHTY: 80,
		NINETY: 90
	} as Record<string, number>;

	const ENDING = "__";
	const SEP = "_";

	const words = str.toString().split(ENDING);
	if (words.length === 1) {
		return str;
	}

	let num = 0;
	let replace = "";

	words[0].split(SEP).forEach((word) => {
		if (word in NUMBERS) {
			num += NUMBERS[word];

			if (replace === "") {
				replace += word;
			} else {
				replace += SEP + word;
			}
		}
	});

	if (replace === "") {
		return str;
	} else {
		return str.replace(replace + ENDING, num.toString());
	}
}

export function deadBooleanToString(value: any) {
	return stringToNumber(value)
		.replaceAll("PAREN1_", "(")
		.replaceAll("PAREN2_", ")")
		.replaceAll("PERCENT_", "%")
		.replaceAll("COLON__", ": ")
		.replaceAll("__", "-")
		.replaceAll("_", " ");
}

export function parseNestedJson(json: string) {
	let parsed;

	try {
		parsed = JSON.parse(json); // object -> object, number -> number, string -> catch block
	} catch {
		return json;
	}

	if (typeof parsed === "object") {
		for (const [key, value] of Object.entries(parsed)) {
			parsed[key] = parseNestedJson(value as string);
		}
	}

	return parsed;
}

export function getOptions(arr: Record<string, any>[]) {
	//create object of sets with keys matching arr
	const filterOptionsSet = {} as Record<keyof (typeof arr)[0], Set<any>>;
	for (let field in arr[0]) {
		filterOptionsSet[field as keyof (typeof arr)[0]] = new Set();
	}

	//fill sets with all possible values
	for (let e of arr) {
		for (let [field, value] of Object.entries(e)) {
			if (value) {
				filterOptionsSet[field as keyof typeof e].add(value);
			}
		}
	}

	//convert sets to arrays
	const filterOptions = {} as Record<keyof (typeof arr)[0], any[]>;
	for (let e in filterOptionsSet) {
		filterOptions[e as keyof typeof filterOptions] = Array.from(
			filterOptionsSet[e as keyof typeof filterOptionsSet]
		).sort();
	}

	return filterOptions;
}

function isObject(item: any) {
	return item && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge(target: Record<string, any>, ...sources: Record<string, any>[]) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepMerge(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return deepMerge(target, ...sources);
}

export function uncapitalizeTable(table: Prisma.ModelName) {
	return (table.slice(0, 1).toLowerCase() + table.slice(1)) as Uncapitalize<Prisma.ModelName>;
}

export function getSubmissionFileName(value: string) {
	const url = new URL(value);
	if (url.origin.endsWith("blob.vercel-storage.com") && url.pathname.startsWith("/submissions")) {
		//reassemble file name without the random suffix
		const splitPath = url.pathname.split("/");
		const name = splitPath[splitPath.length - 1];
		const dashSplit = name.split("-"); //file name
		const dotSplit = name.split("."); //file type
		return decodeURIComponent(dashSplit.slice(0, dashSplit.length - 1).join("-")) + "." + dotSplit[dotSplit.length - 1];
	} else {
		//do nothing
		return value;
	}
}
