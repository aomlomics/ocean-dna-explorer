import { Analysis, Assignment, Feature, Occurrence, Prisma, Taxonomy } from "../../generated/prisma/client";
import { md5 } from "js-md5";
import { parse } from "csv-parse";
import {
	AnalysisOptionalDefaultsSchema,
	AnalysisScalarFieldEnumSchema,
	AssignmentOptionalDefaultsSchema,
	FeatureOptionalDefaultsSchema,
	OccurrenceOptionalDefaultsSchema,
	TaxonomyOptionalDefaultsSchema,
	TaxonomyScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { parseSchemaToObject } from "../schema";
import { Channel } from "../progress";

export async function parseAnalysisFile({
	channel,
	assignmentsUrl,
	occurrencesUrl,
	isPrivate,
	trusted,
	oldChecksum
}: {
	channel: Channel;
	assignmentsUrl: string;
	occurrencesUrl: string;
	isPrivate?: Analysis["isPrivate"];
	trusted?: Analysis["trusted"];
	oldChecksum?: string;
}) {
	const analysisCol = {} as Record<string, string>;
	const userDefined = {} as PrismaJson.UserDefinedType;

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const fileResponse = await fetch(channel.url);
	if (!fileResponse.ok) {
		await channel.stream.error(`Analysis file responded ${fileResponse.status}: ${fileResponse.statusText}.`);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const text = await fileResponse.text();
	const analysisMd5 = md5(text);

	if (oldChecksum === analysisMd5) {
		await channel.stream.error(
			"Checksum for submitted analysisMetadata file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const parser = parse(text, { columns: true, delimiter: "\t", relax_quotes: true });
	await channel.stream.message("File read into memory", 25);

	let i = 0;
	for await (const record of parser) {
		const field = record.term_name;
		if (field) {
			i++;

			const value = record.values;

			//User defined
			if (!AnalysisScalarFieldEnumSchema.safeParse(field).success) {
				userDefined[field] = value;
			} else {
				parseSchemaToObject(field, value, analysisCol, "analysis");
			}
		}

		//add to progress bar every 10 percent
		if (i % (parser.info.records / 10) === 0) {
			await channel.stream.message(
				`Processed line ${i} of ${parser.info.records}.`,
				(i / parser.info.records) * 50 + 25
			);
		}
	}

	const parsedAnalysis = AnalysisOptionalDefaultsSchema.safeParse(
		{
			...analysisCol,
			isPrivate: isPrivate === undefined ? false : isPrivate,
			trusted: trusted === undefined ? false : trusted,
			editHistory: "JsonNull",
			analysisMetadataFileUrl_ODE: channel.url,
			analysisMetadataFileChecksum_ODE: analysisMd5,
			asvFileUrl_ODE: assignmentsUrl,
			occurrenceFileUrl_ODE: occurrencesUrl,
			//placeholders, must override later
			asvFileChecksum_ODE: "",
			occurrenceFileChecksum_ODE: ""
		},
		{
			error: (iss) => {
				return {
					message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
				};
			}
		}
	);

	if (!parsedAnalysis.success) {
		await channel.stream.error(
			`Table: Analysis\n` +
				`Key: ${analysisCol.analysis_run_name}\n\n` +
				`${parsedAnalysis.error.issues.map((e) => e.message).join("\n\n")}`
		);
		return;
	}

	//unset all optional fields that were not provided
	for (const field of AnalysisScalarFieldEnumSchema.options) {
		if (field !== "id" && field !== "dateSubmitted" && !(field in parsedAnalysis.data)) {
			//@ts-ignore
			parsedAnalysis.data[field] = null;
		}
	}

	return { analysis: parsedAnalysis.data, analysisMd5 };
}

export async function parseAssignmentsFile({
	channel,
	analysis_run_name,
	oldChecksum
}: {
	channel: Channel;
	analysis_run_name: Assignment["analysis_run_name"];
	oldChecksum?: string;
}) {
	const features = [] as Prisma.FeatureCreateManyInput[];
	const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
	const assignments = [] as Prisma.AssignmentCreateManyInput[];
	const featsToTaxa = {} as Record<Feature["featureid"], Taxonomy["taxonomy"][]>;

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const response = await fetch(channel.url);
	if (!response.ok) {
		await channel.stream.error(
			`Assignment file for ${analysis_run_name} responded ${response.status}: ${response.statusText}.`
		);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const text = await response.text();
	const assignmentsMd5 = md5(text);

	if (oldChecksum === assignmentsMd5) {
		await channel.stream.error(
			"Checksum for submitted ASV file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const parser = parse(text, { columns: true, delimiter: "\t", relax_quotes: true });
	await channel.stream.message("File read into memory", 25);

	let i = 0;
	for await (const record of parser) {
		if (record.featureid) {
			i++;

			const featureRow = {} as Feature;
			const assignmentRow = {} as Assignment;
			const taxonomyRow = {} as Taxonomy;

			//iterate over each column
			for (const [field, v] of Object.entries(record)) {
				const value = v as string;
				//feature table
				parseSchemaToObject(field, value, featureRow, "feature");

				//assignment table
				parseSchemaToObject(field, value, assignmentRow, "assignment");

				//taxonomy table
				parseSchemaToObject(field, value, taxonomyRow, "taxonomy");
			}

			//parse feature
			const parsedFeature = FeatureOptionalDefaultsSchema.safeParse(
				{
					...featureRow,
					sequenceLength_ODE: featureRow.dna_sequence.length
				},
				{
					error: (iss) => {
						return {
							message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
						};
					}
				}
			);

			if (!parsedFeature.success) {
				await channel.stream.error(
					`Table: Feature\n` +
						`Key: ${featureRow.featureid}\n\n` +
						`${parsedFeature.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//no optional fields

			features.push(parsedFeature.data);

			//parse assignment
			const parsedAssignment = AssignmentOptionalDefaultsSchema.safeParse(
				{
					...assignmentRow,
					analysis_run_name
				},
				{
					error: (iss) => {
						return {
							message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
						};
					}
				}
			);

			if (!parsedAssignment.success) {
				await channel.stream.error(
					`Table: Assignment\n` +
						`Key: ${assignmentRow.analysis_run_name}\n` +
						`Key: ${assignmentRow.featureid}\n\n` +
						`${parsedAssignment.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//no optional fields

			assignments.push(parsedAssignment.data);

			//parse taxonomy
			const parsedTaxonomy = TaxonomyOptionalDefaultsSchema.safeParse(taxonomyRow, {
				error: (iss) => {
					return {
						message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
					};
				}
			});

			if (!parsedTaxonomy.success) {
				await channel.stream.error(
					`Table: Taxonomy\n` +
						`Key: ${taxonomyRow.taxonomy}\n\n` +
						`${parsedTaxonomy.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//unset all optional fields that were not provided
			for (const field of TaxonomyScalarFieldEnumSchema.options) {
				if (field !== "id" && !(field in parsedTaxonomy.data)) {
					//@ts-ignore
					parsedTaxonomy.data[field] = null;
				}
			}

			//TODO: verify taxonomy.taxonomy matches all rank fields

			taxonomies.push(parsedTaxonomy.data);

			if (featsToTaxa[parsedFeature.data.featureid]) {
				featsToTaxa[parsedFeature.data.featureid].push(parsedTaxonomy.data.taxonomy);
			} else {
				featsToTaxa[parsedFeature.data.featureid] = [parsedTaxonomy.data.taxonomy];
			}

			//add to progress bar every 10 percent
			if (i % (parser.info.records / 10) === 0) {
				await channel.stream.message(
					`Processed line ${i} of ${parser.info.records}.`,
					(i / parser.info.records) * 50 + 25
				);
			}
		}
	}

	return { features, taxonomies, featsToTaxa, assignments, assignmentsMd5 };
}

export async function parseOccurrencesFile({
	channel,
	analysis_run_name,
	featsToTaxa,
	oldChecksum
}: {
	channel: Channel;
	analysis_run_name: Occurrence["analysis_run_name"];
	featsToTaxa: Record<Feature["featureid"], Taxonomy["taxonomy"][]>;
	oldChecksum?: string;
}) {
	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];
	const libIdsToTaxa = {} as Record<Occurrence["lib_id"], { taxonomy: Taxonomy["taxonomy"] }[]>;

	//fetch from blob storage
	await channel.stream.message("Downloading file", 10);
	const response = await fetch(channel.url);
	if (!response.ok) {
		await channel.stream.error(
			`Occurrence file for ${analysis_run_name} responded ${response.status}: ${response.statusText}.`
		);
		return;
	}

	let headers = [] as string[];

	await channel.stream.message("Reading file into memory", 15);
	const text = await response.text();
	const occurrencesMd5 = md5(text);

	if (oldChecksum === occurrencesMd5) {
		await channel.stream.error(
			"Checksum for submitted Occurrence file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const parser = parse(text, { delimiter: "\t", relax_quotes: true });
	await channel.stream.message("File read into memory", 25);

	let i = 0;
	for await (const record of parser) {
		//get first row as headers
		if (!headers.length) {
			headers = record;
		} else {
			i++;

			//iterate over each column
			const featureid = record[0];
			if (!featureid) {
				await channel.stream.error(`No "featureid" found for row ${i}.`);
				return;
			}
			for (let j = 1; j < headers.length; j++) {
				const lib_id = headers[j];
				if (!lib_id) {
					await channel.stream.error(`No "lib_id" found for column ${j}.`);
					return;
				}
				const organismQuantity = parseInt(record[j]);
				if (isNaN(organismQuantity)) {
					await channel.stream.error(
						`Organism quantity is not an integer for Feature ${featureid} (row ${i}) and Library ${lib_id} (column ${j}). Value is ${record[j]}.`
					);
					return;
				}

				if (organismQuantity) {
					//parse occurrence
					const parsedOccurrence = OccurrenceOptionalDefaultsSchema.safeParse(
						{
							lib_id,
							featureid,
							organismQuantity,
							analysis_run_name
						},
						{
							error: (iss) => {
								return {
									message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
								};
							}
						}
					);

					if (!parsedOccurrence.success) {
						await channel.stream.error(
							`Table: Occurrence\n` +
								`Key: ${analysis_run_name}\n` +
								`Key: ${lib_id}\n` +
								`Key: ${featureid}\n\n` +
								`${parsedOccurrence.error.issues.map((e) => e.message).join("\n\n")}`
						);
						return;
					}

					//no optional fields

					occurrences.push(parsedOccurrence.data);

					//assemble shortcut object
					const taxaArr = featsToTaxa[parsedOccurrence.data.featureid];
					if (taxaArr) {
						for (const taxonomy of taxaArr) {
							if (libIdsToTaxa[parsedOccurrence.data.lib_id]) {
								libIdsToTaxa[parsedOccurrence.data.lib_id].push({ taxonomy });
							} else {
								libIdsToTaxa[parsedOccurrence.data.lib_id] = [{ taxonomy }];
							}
						}
					} else {
						//TODO: check if this should be an error or not
						// await channel.stream.error(`Occurrence has featureid of "${parsedOccurrence.data.featureid}", which does not exist in data provided.`);
						// return;
					}
				}
			}
		}

		//add to progress bar every 10 percent
		if (i % (parser.info.records / 10) === 0) {
			await channel.stream.message(
				`Processed line ${i} of ${parser.info.records}.`,
				(i / parser.info.records) * 50 + 25
			);
		}
	}

	return { occurrences, libIdsToTaxa, occurrencesMd5 };
}

export async function parseAnalysisFiles({
	analysisChannel,
	assignmentsChannel,
	occurrencesChannel,
	isPrivate,
	trusted,
	oldChecksums
}: {
	analysisChannel: Channel;
	assignmentsChannel: Channel;
	occurrencesChannel: Channel;
	isPrivate: Analysis["isPrivate"];
	trusted: Analysis["trusted"];
	oldChecksums?: { analysisMd5?: string; assignmentsMd5?: string; occurrencesMd5?: string };
}) {
	const analysisParseResult = await parseAnalysisFile({
		channel: analysisChannel,
		assignmentsUrl: assignmentsChannel.url,
		occurrencesUrl: occurrencesChannel.url,
		isPrivate,
		trusted,
		oldChecksum: oldChecksums?.analysisMd5
	});
	if (!analysisParseResult) {
		return;
	}
	const { analysis, analysisMd5 } = analysisParseResult;

	const assignmentsParseResult = await parseAssignmentsFile({
		channel: assignmentsChannel,
		analysis_run_name: analysis.analysis_run_name,
		oldChecksum: oldChecksums?.assignmentsMd5
	});
	if (!assignmentsParseResult) {
		return;
	}
	const { features, taxonomies, featsToTaxa, assignments, assignmentsMd5 } = assignmentsParseResult;

	const occurrencesParseResult = await parseOccurrencesFile({
		channel: occurrencesChannel,
		analysis_run_name: analysis.analysis_run_name,
		featsToTaxa,
		oldChecksum: oldChecksums?.occurrencesMd5
	});
	if (!occurrencesParseResult) {
		return;
	}
	const { occurrences, libIdsToTaxa, occurrencesMd5 } = occurrencesParseResult;

	return {
		analysis: {
			...analysis,
			asvFileChecksum_ODE: assignmentsMd5,
			occurrenceFileChecksum_ODE: occurrencesMd5
		},
		features,
		taxonomies,
		assignments,
		occurrences,
		libIdsToTaxa,
		checksums: {
			analysisMd5,
			assignmentsMd5,
			occurrencesMd5
		}
	};
}
