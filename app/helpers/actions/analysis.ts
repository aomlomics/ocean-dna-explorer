import type { Prisma } from "@/app/generated/prisma/client";
import type {
	AnalysisModel,
	AssignmentModel,
	FeatureModel,
	OccurrenceModel,
	TaxonomyModel
} from "@/app/generated/prisma/models";
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
import type { Channel } from "../progress";
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
	trusted?: AnalysisModel["trusted"];
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
					message: `Field: ${iss.path![0] as string}\nIssue: ${
						iss.input != null ? `${iss.code}\nValue: ${iss.input}` : "missing"
					}`
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
	delete parsedAnalysis.data.id;
	delete parsedAnalysis.data.dateSubmitted;
	for (const field of AnalysisScalarFieldEnumSchema.options) {
		if (!(field in parsedAnalysis.data)) {
			//@ts-expect-error overriding never with null
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
	project_id: AssignmentModel["project_id"];
	analysis_run_name: AssignmentModel["analysis_run_name"];
	oldChecksum?: string;
}) {
	const features = [] as Prisma.FeatureCreateWithoutAnalysesInput[];
	const uniqueTaxa = new Set() as Set<TaxonomyModel["taxonomy"]>;
	const taxonomies = [] as Prisma.TaxonomyCreateWithoutAnalysesInput[];
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

			const featureRow = {} as FeatureModel;
			const assignmentRow = {} as AssignmentModel;
			const taxonomyRow = {} as TaxonomyModel;

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
							message: `Field: ${iss.path![0] as string}\nIssue: ${
								iss.input != null ? `${iss.code}\nValue: ${iss.input}` : "missing"
							}`
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

			delete parsedAssignment.data.id;

			assignments.push(parsedAssignment.data);

			//parse feature
			const parsedFeature = FeatureOptionalDefaultsSchema.safeParse(
				{
					...featureRow,
					sequenceLength_ODE: featureRow.dna_sequence.length
				},
				{
					error: (iss) => {
						return {
							message: `Field: ${iss.path![0] as string}\nIssue: ${
								iss.input != null ? `${iss.code}\nValue: ${iss.input}` : "missing"
							}`
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

			delete parsedFeature.data.id;

			features.push(parsedFeature.data);

			//parse taxonomy
			if (!uniqueTaxa.has(taxonomyRow.taxonomy)) {
				const parsedTaxonomy = TaxonomyOptionalDefaultsSchema.safeParse(taxonomyRow, {
					error: (iss) => {
						return {
							message: `Field: ${iss.path![0] as string}\nIssue: ${
								iss.input != null ? `${iss.code}\nValue: ${iss.input}` : "missing"
							}`
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
				delete parsedTaxonomy.data.id;
				for (const field of TaxonomyScalarFieldEnumSchema.options) {
					if (!(field in parsedTaxonomy.data)) {
						//@ts-expect-error overriding never with null
						parsedTaxonomy.data[field] = null;
					}
				}

				//TODO: verify taxonomy.taxonomy matches all rank fields

				taxonomies.push(parsedTaxonomy.data);
				uniqueTaxa.add(parsedTaxonomy.data.taxonomy);
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

	return { features, taxonomies, assignments, assignmentsMd5 };
}

export async function parseOccurrencesFile({
	channel,
	project_id,
	analysis_run_name,
	oldChecksum
}: {
	channel: Channel;
	project_id: OccurrenceModel["project_id"];
	analysis_run_name: OccurrenceModel["analysis_run_name"];
	oldChecksum?: string;
}) {
	const featureids = [] as OccurrenceModel["featureid"][];
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

	let libIds = [] as OccurrenceModel["lib_id"][];
	let i = 1;
	for await (const record of parser) {
		//get first row as headers
		if (!libIds.length) {
			libIds = record.slice(1).map((lib_id: OccurrenceModel["lib_id"]) => lib_id.trim());
		} else {
			//iterate over each column
			const featureid = record[0]?.trim();
			if (!featureid) {
				await channel.stream.error(`No "featureid" found for row ${i}.`);
				return;
			}
			featureids.push(featureid);

			let j = 1;
			for (const lib_id of libIds) {
				if (!lib_id) {
					await channel.stream.error(`No "lib_id" found for column ${j}.`);
					return;
				}

				if (record[j] == null || record[j] === "") {
					await channel.stream.error(
						`Organism quantity is missing for Feature ${featureid} (row ${i}) and Library ${lib_id} (column ${j}).`
					);
					return;
				}
				const organismQuantity = Number(record[j]);
				if (!Number.isInteger(organismQuantity)) {
					await channel.stream.error(
						`Organism quantity is not an integer for Feature ${featureid} (row ${i}) and Library ${lib_id} (column ${j}). Value is ${record[j]}.`
					);
					return;
				}

				if (organismQuantity !== 0) {
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
									message: `Field: ${iss.path![0] as string}\nIssue: ${
										iss.input != null ? `${iss.code}\nValue: ${iss.input}` : "missing"
									}`
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

					delete parsedOccurrence.data.id;

					occurrences.push(parsedOccurrence.data);
				}

				j++;
			}

			i++;
		}

		//add to progress bar every 10 percent
		if (i % (parser.info.records / 10) === 0) {
			await channel.stream.message(
				`Processed line ${i} of ${parser.info.records}.`,
				(i / parser.info.records) * 50 + 25
			);
		}
	}

	return { occurrences, occurrencesMd5, libIds, featureids };
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
	trusted: AnalysisModel["trusted"];
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
	const { occurrences, occurrencesMd5, libIds, featureids } = occurrencesParseResult;

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
		libIds,
		featureids,
		checksums: {
			analysisMd5,
			assignmentsMd5,
			occurrencesMd5
		}
	};
}
