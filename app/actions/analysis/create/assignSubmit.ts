"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { deadBooleanToString } from "@/app/helpers/utils";
import { auth } from "@clerk/nextjs/server";
import {
	FeatureOptionalDefaultsSchema,
	AssignmentOptionalDefaultsSchema,
	TaxonomyOptionalDefaultsSchema,
	Assignment,
	Feature,
	Taxonomy
} from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { parse } from "csv-parse";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { md5 } from "js-md5";

async function doSubmit(stream: ProgressStream, analysis_run_name: Assignment["analysis_run_name"], url: string) {
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
		//Feature file
		console.log(`${analysis_run_name}_assign file`);
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
		const textMd5 = md5(text);
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
				taxonomies.push(parsedTaxonomy.data);

				//add to progress bar
				await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
			}
		}

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

		await prisma.$transaction(
			async (tx) => {
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						}
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${analysis_run_name} does not exist.`);
				} else if (!analysis.Project.userIds.includes(userId)) {
					throw new Error("Unauthorized");
				}

				//add asv file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						asvFileUrl_ODE: url,
						asvFileChecksum_ODE: textMd5
					}
				});

				//upload to database
				//features
				await tx.feature.createMany({
					data: features,
					skipDuplicates: true
				});

				//taxonomies
				await tx.taxonomy.createMany({
					data: taxonomies,
					skipDuplicates: true
				});

				//assignments
				console.log("assignments");
				await tx.assignment.createMany({
					data: assignments
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		await stream.success("Success");
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			await stream.error(handlePrismaError(err).error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function assignSubmitAction(analysis_run_name: Assignment["analysis_run_name"], url: string) {
	const stream = createProgressStream();

	doSubmit(stream, analysis_run_name, url).then(stream.close);

	return stream.readable;
}
