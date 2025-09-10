"use server";

import { Assignment, Feature, Prisma, Taxonomy } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { deadBooleanToString } from "@/app/helpers/utils";
import {
	AssignmentOptionalDefaultsSchema,
	FeatureOptionalDefaultsSchema,
	TaxonomyOptionalDefaultsSchema,
	TaxonomyScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { parse } from "csv-parse";
import { md5 } from "js-md5";

async function doEdit(stream: ProgressStream, url: string, editId: string, analysis_run_name: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const features = [] as Prisma.FeatureCreateManyInput[];
	const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
	const assignments = [] as Prisma.AssignmentCreateManyInput[];

	try {
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
				for (const field of TaxonomyScalarFieldEnumSchema._def.values) {
					if (field !== "id" && !(field in parsedTaxonomy.data)) {
						//@ts-ignore
						parsedTaxonomy.data[field] = null;
					}
				}

				taxonomies.push(parsedTaxonomy.data);

				//add to progress bar
				await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
			}
		}

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

		await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbAnalysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						},
						editHistory: true,
						asvFileUrl_ODE: true,
						asvFileChecksum_ODE: true
					}
				});

				if (!dbAnalysis) {
					return `No Analysis with analysis_run_name of "${analysis_run_name}" found.`;
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					return "Unauthorized action.";
				} else if (!dbAnalysis.asvFileUrl_ODE || !dbAnalysis.asvFileChecksum_ODE) {
					return "Invalid Analysis. Missing file for ASVs.";
				}

				await stream.message("All checks passed.", 80);

				const changes = [
					{
						field: "asvFileUrl_ODE",
						oldValue: dbAnalysis.asvFileUrl_ODE,
						newValue: url
					},
					{
						field: "asvFileChecksum_ODE",
						oldValue: dbAnalysis.asvFileChecksum_ODE,
						newValue: md5Checksum
					}
				];
				let editHistory;
				if (dbAnalysis.editHistory) {
					const currEditIndex = dbAnalysis.editHistory.findIndex((edit) => edit.id === editId);

					if (currEditIndex === -1) {
						//new edit
						editHistory = [
							{
								id: editId,
								dateEdited: new Date(),
								changes
							},
							...dbAnalysis.editHistory
						];
					} else {
						//group changes together into previously existing edit
						dbAnalysis.editHistory[currEditIndex].changes = [
							...dbAnalysis.editHistory[currEditIndex].changes,
							...changes
						];
						editHistory = dbAnalysis.editHistory;
					}
				} else {
					//new edit AND new editHistory
					editHistory = [
						{
							id: editId,
							dateEdited: new Date(),
							changes
						}
					];
				}

				//add asv file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						editHistory,
						asvFileUrl_ODE: url,
						asvFileChecksum_ODE: md5Checksum
					}
				});
				await stream.message("Analysis editHistory successfully updated in database.", 85);

				//add new
				const newFeatures = await tx.feature.createManyAndReturn({
					data: features,
					skipDuplicates: true
				});

				const newTaxonomies = await tx.taxonomy.createManyAndReturn({
					data: taxonomies,
					skipDuplicates: true
				});

				const newAssignments = await tx.assignment.createManyAndReturn({
					data: assignments,
					skipDuplicates: true
				});

				await stream.message("New entries successfully added to database.", 90);

				//update old
				await updateManyRaw(
					tx,
					"Feature",
					features.filter((feat) => !newFeatures.some((dbFeat) => dbFeat.featureid === feat.featureid)),
					"featureid"
				);

				await updateManyRaw(
					tx,
					"Taxonomy",
					taxonomies.filter((taxa) => !newTaxonomies.some((dbTaxa) => dbTaxa.taxonomy === taxa.taxonomy)),
					"taxonomy"
				);

				await updateManyRaw(
					tx,
					"Assignment",
					assignments.filter(
						(a) =>
							!newAssignments.some(
								(dbA) => dbA.analysis_run_name === a.analysis_run_name && dbA.featureid === a.featureid
							)
					)
				);

				await stream.message("Existing entries successfully updated in database.", 93);

				//delete unused
				//rely on cron to delete unused features and taxonomies
				await tx.assignment.deleteMany({
					where: {
						analysis_run_name,
						featureid: {
							notIn: assignments.map((a) => a.featureid)
						}
					}
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		await stream.success("Success");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			await stream.error(handlePrismaError(err).error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function assignSubmitAction(url: string, editId: string, analysis_run_name: string) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
