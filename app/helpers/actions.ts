import { ProgressStream } from "@/types/globals";
import { Assignment, Feature, Occurrence, Prisma, Taxonomy } from "../generated/prisma/client";
import { md5 } from "js-md5";
import { parse } from "csv-parse";
import {
	AssignmentOptionalDefaultsSchema,
	FeatureOptionalDefaultsSchema,
	OccurrenceOptionalDefaultsSchema,
	TaxonomyOptionalDefaultsSchema,
	TaxonomyScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { deadBooleanToString } from "./utils";
import { parseSchemaToObject } from "./schema";

export async function parseAssignmentFile(
	stream: ProgressStream,
	url: string,
	analysis_run_name: Assignment["analysis_run_name"],
	unsetOptionals = false
) {
	const features = [] as Prisma.FeatureCreateManyInput[];
	const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
	const assignments = [] as Prisma.AssignmentCreateManyInput[];

	//fetch file from blob storage
	await stream.message("Downloading file", 10);
	const response = await fetch(url);
	if (!response.ok) {
		await stream.error(
			`Assignment file for ${analysis_run_name} responded ${response.status}: ${response.statusText}.`
		);
		return;
	}

	await stream.message("Reading file into memory", 15);
	const text = await response.text();
	const md5Checksum = md5(text);
	const parser = parse(text, { columns: true, delimiter: "\t" });
	await stream.message("File read into memory", 25);

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
					errorMap: (error, ctx) => {
						return {
							message: `Field: ${error.path[0]}\nIssue: ${
								ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
							}\nValue: ${featureRow[error.path[0] as keyof typeof featureRow]}`
						};
					}
				}
			);

			if (!parsedFeature.success) {
				await stream.error(
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
					errorMap: (error, ctx) => {
						return {
							message: `Field: ${error.path[0]}\nIssue: ${
								ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
							}\nValue: ${assignmentRow[error.path[0] as keyof typeof assignmentRow]}`
						};
					}
				}
			);

			if (!parsedAssignment.success) {
				await stream.error(
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
				errorMap: (error, ctx) => {
					return {
						message: `Field: ${error.path[0]}\nIssue: ${
							ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
						}\nValue: ${taxonomyRow[error.path[0] as keyof typeof taxonomyRow]}`
					};
				}
			});

			if (!parsedTaxonomy.success) {
				await stream.error(
					`Table: Taxonomy\n` +
						`Key: ${taxonomyRow.taxonomy}\n\n` +
						`${parsedTaxonomy.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//unset all optional fields that were not provided
			if (unsetOptionals) {
				for (const field of TaxonomyScalarFieldEnumSchema._def.values) {
					if (field !== "id" && !(field in parsedTaxonomy.data)) {
						//@ts-ignore
						parsedTaxonomy.data[field] = null;
					}
				}
			}

			taxonomies.push(parsedTaxonomy.data);

			//add to progress bar
			await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
		}
	}

	return { features, taxonomies, assignments, md5Checksum };
}

export async function parseOccurrenceFile(
	stream: ProgressStream,
	url: string,
	analysis_run_name: Occurrence["analysis_run_name"]
) {
	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

	//fetch from blob storage
	await stream.message("Downloading file", 10);
	const response = await fetch(url);
	if (!response.ok) {
		await stream.error(
			`Occurrence file for ${analysis_run_name} responded ${response.status}: ${response.statusText}.`
		);
		return;
	}

	let headers = [] as string[];

	await stream.message("Reading file into memory", 15);
	const text = await response.text();
	const md5Checksum = md5(text);
	const parser = parse(text, { delimiter: "\t" });
	await stream.message("File read into memory", 25);

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
				await stream.error(`No "featureid" found for row ${i}.`);
				return;
			}
			for (let j = 1; j < headers.length; j++) {
				const samp_name = headers[j];
				if (!samp_name) {
					await stream.error(`No "samp_name" found for column ${j}.`);
					return;
				}
				const organismQuantity = parseInt(record[j]);
				if (isNaN(organismQuantity)) {
					await stream.error(
						`Organism quantity is not an integer for Feature ${featureid} (row ${i}) and Sample ${samp_name} (column ${j}). Value is ${record[j]}.`
					);
					return;
				}

				if (organismQuantity) {
					//parse occurrence
					const parsedOccurrence = OccurrenceOptionalDefaultsSchema.safeParse(
						{
							samp_name,
							featureid,
							organismQuantity,
							analysis_run_name
						},
						{
							errorMap: (error, ctx) => {
								return {
									message: `Field: ${error.path[0]}\nIssue: ${
										ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
									}\nValue: ${
										error.path[0] === "samp_name"
											? samp_name
											: error.path[0] === "featureid"
											? featureid
											: error.path[0] === "organismQuantity"
											? organismQuantity
											: undefined
									}`
								};
							}
						}
					);

					if (!parsedOccurrence.success) {
						await stream.error(
							`Table: Occurrence\n` +
								`Key: ${analysis_run_name}\n` +
								`Key: ${samp_name}\n` +
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

		//add to progress bar
		await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
	}

	return { occurrences, md5Checksum };
}

export function getNewEditHistory(
	editId: string,
	editHistory: PrismaJson.EditHistoryType | null,
	changes: PrismaJson.ChangesType
) {
	if (editHistory) {
		const currEditIndex = editHistory.findIndex((edit) => edit.id === editId);

		if (currEditIndex === -1) {
			//new edit
			return [
				{
					id: editId,
					dateEdited: new Date(),
					changes
				},
				...editHistory
			];
		} else {
			//group changes together into previously existing edit
			const temp = [...editHistory];
			temp[currEditIndex].changes = [...editHistory[currEditIndex].changes, ...changes];
			return temp;
		}
	} else {
		//new edit AND new editHistory
		return [
			{
				id: editId,
				dateEdited: new Date(),
				changes
			}
		];
	}
}
