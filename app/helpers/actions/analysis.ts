import type { Prisma } from "@/app/generated/prisma/client";
import type {
	AnalysisModel,
	AssignmentModel,
	FeatureModel,
	OccurrenceModel,
	TaxonomicHierarchyModel,
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
	TaxonomicHierarchyOptionalDefaultsSchema,
	TaxonomicHierarchyScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { parseSchemaToObject } from "../schema";
import type { Channel } from "../progress";
import { get } from "@vercel/blob";
import { getSchemaParseError, schemaParseErrorFunction } from "../queries";
import { AppError, GLOBAL_SERVER_ERROR, TaxonomicRanks } from "@/types/objects";

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
	try {
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
				error: schemaParseErrorFunction
			}
		);

		if (!parsedAnalysis.success) {
			await channel.stream.error(
				getSchemaParseError(parsedAnalysis.error, "Analysis", [
					analysisCol.analysis_run_name ?? "Unknown analysis_run_name"
				])
			);
			return;
		}

		//unset all optional fields that were not provided
		for (const field of AnalysisScalarFieldEnumSchema.options) {
			if (!(field in parsedAnalysis.data)) {
				//@ts-expect-error overriding never with null
				parsedAnalysis.data[field] = null;
			}
		}
		delete parsedAnalysis.data.id;
		delete parsedAnalysis.data.dateSubmitted;

		return { analysis: parsedAnalysis.data, analysisMd5 };
	} catch (err) {
		console.error(err);

		if (err instanceof AppError) {
			await channel.stream.error(err.message);
		} else {
			await channel.stream.error(GLOBAL_SERVER_ERROR);
		}

		throw err;
	}
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
	try {
		const features = [] as Prisma.FeatureCreateManyInput[];
		const hierarchyByTaxonomy = {} as Record<
			TaxonomicHierarchyModel["taxonomy"],
			Prisma.TaxonomicHierarchyCreateManyInput
		>;
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
			if (record.featureid !== "") {
				i++;

				const featureRow = {} as FeatureModel;
				const assignmentRow = {} as AssignmentModel;
				const hierarchyRow = {} as TaxonomicHierarchyModel;

				//iterate over each column
				for (const [field, v] of Object.entries(record)) {
					const value = v as string;
					//feature table
					parseSchemaToObject(field, value, featureRow, "feature");

					//assignment table
					parseSchemaToObject(field, value, assignmentRow, "assignment");

					//taxonomy table
					parseSchemaToObject(field, value, hierarchyRow, "taxonomicHierarchy");
				}

				//parse assignment
				const parsedAssignment = AssignmentOptionalDefaultsSchema.safeParse(
					{
						...assignmentRow,
						project_id,
						analysis_run_name
					},
					{
						error: schemaParseErrorFunction
					}
				);

				if (!parsedAssignment.success) {
					await channel.stream.error(
						getSchemaParseError(parsedAssignment.error, "Assignment", [
							assignmentRow.analysis_run_name,
							assignmentRow.featureid
						])
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
						error: schemaParseErrorFunction
					}
				);

				if (!parsedFeature.success) {
					await channel.stream.error(getSchemaParseError(parsedFeature.error, "Feature", [featureRow.featureid]));
					return;
				}

				delete parsedFeature.data.id;

				features.push(parsedFeature.data);

				//parse taxonomy
				const parsedHierarchy = TaxonomicHierarchyOptionalDefaultsSchema.safeParse(hierarchyRow, {
					error: schemaParseErrorFunction
				});

				if (!parsedHierarchy.success) {
					await channel.stream.error(
						getSchemaParseError(parsedHierarchy.error, "TaxonomicHierarchy", [hierarchyRow.taxonomy])
					);
					return;
				}

				//unset all optional fields that were not provided
				for (const field of TaxonomicHierarchyScalarFieldEnumSchema.options) {
					if (!(field in parsedHierarchy.data)) {
						//@ts-expect-error overriding never with null
						parsedHierarchy.data[field] = null;
					}
				}
				delete parsedHierarchy.data.id;

				//check hierarchy against existing rank values
				if (!hierarchyByTaxonomy[parsedHierarchy.data.taxonomy]) {
					hierarchyByTaxonomy[parsedHierarchy.data.taxonomy] = parsedHierarchy.data;
				} else {
					for (const rank of TaxonomicRanks) {
						if (hierarchyByTaxonomy[parsedHierarchy.data.taxonomy]![rank] !== parsedHierarchy.data[rank]) {
							await channel.stream.error(
								`The rank value ${rank}:${parsedHierarchy.data[rank]} on line ${i} does not match a ${parsedHierarchy.data.taxonomy} from a previous Assignment.`
							);
							return;
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
		}

		return { features, hierarchyByTaxonomy, assignments, assignmentsMd5 };
	} catch (err) {
		console.error(err);

		if (err instanceof AppError) {
			await channel.stream.error(err.message);
		} else {
			await channel.stream.error(GLOBAL_SERVER_ERROR);
		}

		throw err;
	}
}

//TODO: check if assignments file has features not in occurrence file
export async function parseOccurrencesFile({
	channel,
	project_id,
	analysis_run_name,
	features,
	oldChecksum
}: {
	channel: Channel;
	project_id: OccurrenceModel["project_id"];
	analysis_run_name: OccurrenceModel["analysis_run_name"];
	features: { featureid: FeatureModel["featureid"] }[];
	oldChecksum?: string;
}) {
	try {
		const occurrences = [] as Prisma.OccurrenceCreateManyInput[];
		let libIds = [] as OccurrenceModel["lib_id"][];
		const featureids = new Set() as Set<OccurrenceModel["featureid"]>;

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

		const assignFeatures = new Set(features.map((feat) => feat.featureid));
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
				} else if (featureids.has(featureid)) {
					await channel.stream.error(`Duplicate featureid "${featureid}".`);
					return;
				} else if (!assignFeatures.has(featureid)) {
					await channel.stream.error(`Assignments file does not have the Feature with featureid "${featureid}".`);
					return;
				}
				assignFeatures.delete(featureid);
				featureids.add(featureid);

				let numOccs = 0;
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
						numOccs++;
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
								error: schemaParseErrorFunction
							}
						);

						if (!parsedOccurrence.success) {
							await channel.stream.error(
								getSchemaParseError(parsedOccurrence.error, "Occurrence", [analysis_run_name, lib_id, featureid])
							);
							return;
						}

						delete parsedOccurrence.data.id;

						occurrences.push(parsedOccurrence.data);
					}

					j++;
				}

				if (!numOccs) {
					await channel.stream.error(
						`Assignments file does not have any Occurrences with an organismQuantity greater than zero for Feature with featureid "${featureid}".`
					);
					return;
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

		if (assignFeatures.size) {
			channel.stream.error(
				`${assignFeatures.size} Features from Assignments file are missing. The Features are: ${Array.from(assignFeatures)}`
			);
			return;
		}

		return { occurrences, occurrencesMd5, libIds, featureids };
	} catch (err) {
		console.error(err);

		if (err instanceof AppError) {
			await channel.stream.error(err.message);
		} else {
			await channel.stream.error(GLOBAL_SERVER_ERROR);
		}

		throw err;
	}
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
	const { features, hierarchyByTaxonomy, assignments, assignmentsMd5 } = assignmentsParseResult;

	const occurrencesParseResult = await parseOccurrencesFile({
		channel: occurrencesChannel,
		project_id: analysis.project_id,
		analysis_run_name: analysis.analysis_run_name,
		features,
		oldChecksum: oldChecksums?.occurrencesMd5
	});
	if (!occurrencesParseResult) {
		return;
	}
	const { occurrences, occurrencesMd5, libIds } = occurrencesParseResult;

	return {
		analysis: {
			...analysis,
			asvFileChecksum_ODE: assignmentsMd5,
			occurrenceFileChecksum_ODE: occurrencesMd5
		},
		features,
		hierarchyByTaxonomy,
		assignments,
		occurrences,
		libIds,
		checksums: {
			analysisMd5,
			assignmentsMd5,
			occurrencesMd5
		}
	};
}
