"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import {
	AssignmentOptionalDefaultsSchema,
	AssignmentPartial,
	AssignmentScalarFieldEnumSchema,
	FeatureOptionalDefaultsSchema,
	FeaturePartial,
	FeatureScalarFieldEnumSchema,
	TaxonomyOptionalDefaultsSchema,
	TaxonomyPartial,
	TaxonomyScalarFieldEnumSchema
} from "@/prisma/schema/generated/zod";
import { SubmitActionReturn } from "@/types/types";
import { auth } from "@clerk/nextjs/server";

export default async function assignSubmitAction(formData: FormData): SubmitActionReturn {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	try {
		const analysis_run_name = formData.get("analysis_run_name") as string;
		console.log(`${analysis_run_name} assignment submit`);

		const isPrivate = formData.get("isPrivate") ? true : false;

		//Feature file
		//parsing file inside transaction to reduce memory usage, since this file is large
		await prisma.$transaction(
			async (tx) => {
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						isPrivate: true
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${analysis_run_name} does not exist.`);
				} else if (analysis.isPrivate && !isPrivate) {
					throw new Error(
						`Analysis with analysis_run_name of ${analysis_run_name} is private. Assignments can't be public if the associated analysis is private.`
					);
				}

				const features = [] as Prisma.FeatureCreateManyInput[];
				const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
				const assignments = [] as Prisma.AssignmentCreateManyInput[];

				console.log(`${analysis_run_name}_assign file`);
				let assignFileLines;
				//fetch files from blob storage
				const url = JSON.parse(formData.get("file") as string).url;
				const file = await fetch(url);
				const fileText = await file.text();
				assignFileLines = fileText.replace(/[\r]+/gm, "").split("\n");
				const assignFileHeaders = assignFileLines[0].split("\t");

				//iterate over each row
				for (let i = 1; i < assignFileLines.length; i++) {
					const currentLine = assignFileLines[i].split("\t");

					if (currentLine[assignFileHeaders.indexOf("featureid")]) {
						const featureRow = {} as FeaturePartial;
						const assignmentRow = {} as AssignmentPartial;
						const taxonomyRow = {} as TaxonomyPartial;

						//iterate over each column
						for (let j = 0; j < assignFileHeaders.length; j++) {
							if (assignFileHeaders[j] === "Confidence\r") {
								console.log("---------");
								console.log(currentLine[j]);
							}
							//feature table
							parseSchemaToObject(
								currentLine[j],
								assignFileHeaders[j],
								featureRow,
								FeatureOptionalDefaultsSchema,
								FeatureScalarFieldEnumSchema
							);

							//assignment table
							parseSchemaToObject(
								currentLine[j],
								assignFileHeaders[j],
								assignmentRow,
								AssignmentOptionalDefaultsSchema,
								AssignmentScalarFieldEnumSchema
							);

							//taxonomy table
							parseSchemaToObject(
								currentLine[j],
								assignFileHeaders[j],
								taxonomyRow,
								TaxonomyOptionalDefaultsSchema,
								TaxonomyScalarFieldEnumSchema
							);
						}

						features.push(
							FeatureOptionalDefaultsSchema.parse(
								{ ...featureRow, sequenceLength: featureRow.dna_sequence!.length },
								{
									errorMap: (error, ctx) => {
										return { message: `FeatureSchema (${analysis_run_name}): ${ctx.defaultError}` };
									}
								}
							)
						);

						assignments.push(
							AssignmentOptionalDefaultsSchema.parse(
								{
									...assignmentRow,
									isPrivate,
									analysis_run_name
								},
								{
									errorMap: (error, ctx) => {
										return {
											message: `AssignmentSchema (${analysis_run_name}, ${assignmentRow.featureid}, ${assignmentRow.Confidence}): ${ctx.defaultError}`
										};
									}
								}
							)
						);

						taxonomies.push(
							TaxonomyOptionalDefaultsSchema.parse(taxonomyRow, {
								errorMap: (error, ctx) => {
									return { message: `TaxonomySchema (${analysis_run_name}): ${ctx.defaultError}` };
								}
							})
						);
					}
				}

				//upload to database
				//features
				// TODO: update isPrivate on entries that are skipped because of skipDuplicates
				console.log("features");
				await tx.feature.createMany({
					data: features,
					skipDuplicates: true
				});

				//taxonomies
				// TODO: update isPrivate on entries that are skipped because of skipDuplicates
				console.log("taxonomies");
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

		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
