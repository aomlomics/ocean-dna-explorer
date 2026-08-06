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
import { get } from "@vercel/blob";

export async function parseAnalysisFile({
	channel,
	assignmentsUrl,
	occurrencesUrl,
	trusted,
	oldChecksum
}: {
	channel: Channel;
	assignmentsUrl: string;
	occurrencesUrl: string;
	trusted?: Analysis["trusted"];
	oldChecksum?: string;
}) {
	const analysisCol = {} as Record<string, string>;
	const userDefined = {} as PrismaJson.UserDefinedType;

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const fileResponse = await get(channel.url, { access: "public" });
	if (!fileResponse || fileResponse.statusCode === 304) {
		await channel.stream.error(`Analysis file does not exist at provided URL: ${channel.url}.`);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const text = await new Response(fileResponse.stream).text();
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
	project_id,
	analysis_run_name,
	oldChecksum
}: {
	channel: Channel;
	project_id: Assignment["project_id"];
	analysis_run_name: Assignment["analysis_run_name"];
	oldChecksum?: string;
}) {
	const features = [] as Prisma.FeatureCreateManyInput[];
	const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
	const assignments = [] as Prisma.AssignmentCreateManyInput[];

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const fileResponse = await get(channel.url, { access: "public" });
	if (!fileResponse || fileResponse.statusCode === 304) {
		await channel.stream.error(
			`Assignment file for ${analysis_run_name} does not exist at provided URL: ${channel.url}.`
		);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const text = await new Response(fileResponse.stream).text();
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
					project_id,
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

			//add to progress bar every 10 percent
			if (i % (parser.info.records / 10) === 0) {
				await channel.stream.message(
					`Processed line ${i} of ${parser.info.records}.`,
					(i / parser.info.records) * 50 + 25
				);
			}
		}
	}

	return { features, taxonomies, assignments, assignmentsMd5 };
}

export async function parseOccurrencesFile({
	channel,
	project_id,
	analysis_run_name,
	oldChecksum
}: {
	channel: Channel;
	project_id: Occurrence["project_id"];
	analysis_run_name: Occurrence["analysis_run_name"];
	oldChecksum?: string;
}) {
	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

	//fetch from blob storage
	await channel.stream.message("Downloading file", 10);
	const fileResponse = await get(channel.url, { access: "public" });
	if (!fileResponse || fileResponse.statusCode === 304) {
		await channel.stream.error(
			`Occurrence file for ${analysis_run_name} does not exist at provided URL: ${channel.url}.`
		);
		return;
	}

	let headers = [] as string[];

	await channel.stream.message("Reading file into memory", 15);
	const text = await new Response(fileResponse.stream).text();
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
							project_id,
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

	return { occurrences, occurrencesMd5 };
}

export async function parseAnalysisFiles({
	analysisChannel,
	assignmentsChannel,
	occurrencesChannel,
	trusted,
	oldChecksums
}: {
	analysisChannel: Channel;
	assignmentsChannel: Channel;
	occurrencesChannel: Channel;
	trusted: Analysis["trusted"];
	oldChecksums?: { analysisMd5?: string; assignmentsMd5?: string; occurrencesMd5?: string };
}) {
	const analysisParseResult = await parseAnalysisFile({
		channel: analysisChannel,
		assignmentsUrl: assignmentsChannel.url,
		occurrencesUrl: occurrencesChannel.url,
		trusted,
		oldChecksum: oldChecksums?.analysisMd5
	});
	if (!analysisParseResult) {
		return;
	}
	const { analysis, analysisMd5 } = analysisParseResult;

	const assignmentsParseResult = await parseAssignmentsFile({
		channel: assignmentsChannel,
		project_id: analysis.project_id,
		analysis_run_name: analysis.analysis_run_name,
		oldChecksum: oldChecksums?.assignmentsMd5
	});
	if (!assignmentsParseResult) {
		return;
	}
	const { features, taxonomies, assignments, assignmentsMd5 } = assignmentsParseResult;

	const occurrencesParseResult = await parseOccurrencesFile({
		channel: occurrencesChannel,
		project_id: analysis.project_id,
		analysis_run_name: analysis.analysis_run_name,
		oldChecksum: oldChecksums?.occurrencesMd5
	});
	if (!occurrencesParseResult) {
		return;
	}
	const { occurrences, occurrencesMd5 } = occurrencesParseResult;

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
		checksums: {
			analysisMd5,
			assignmentsMd5,
			occurrencesMd5
		}
	};
}
