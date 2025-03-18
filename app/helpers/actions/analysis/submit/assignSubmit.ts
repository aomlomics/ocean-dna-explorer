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
} from "@/prisma/generated/zod";
import { SubmitActionReturn } from "@/types/types";
import { auth } from "@clerk/nextjs/server";

export default async function assignSubmitAction(formData: FormData): SubmitActionReturn {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const analysis_run_name = formData.get("analysis_run_name") as string;
	console.log(`${analysis_run_name} assignment submit`);

	//Feature file
	//parsing file inside transaction to reduce memory usage, since this file is large
	await prisma.$transaction(
		async (tx) => {
			const features = [] as Prisma.FeatureCreateManyInput[];
			const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
			const assignments = [] as AssignmentPartial[];

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
							{ ...featureRow, sequenceLength: featureRow.dna_sequence?.length },
							{
								errorMap: (error, ctx) => {
									return { message: `FeatureSchema (${analysis_run_name}): ${ctx.defaultError}` };
								}
							}
						)
					);

					//assignments can only be parsed after inserting the analyses
					assignments.push(assignmentRow);

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
			console.log("features");
			await tx.feature.createMany({
				data: features,
				skipDuplicates: true
			});

			//taxonomies
			console.log("taxonomies");
			await tx.taxonomy.createMany({
				data: taxonomies,
				skipDuplicates: true
			});

			//assignments
			console.log("assignments");
			await tx.assignment.createMany({
				data: assignments.map((a) =>
					AssignmentOptionalDefaultsSchema.parse(
						{
							...a,
							analysis_run_name
						},
						{
							errorMap: (error, ctx) => {
								return {
									message: `AssignmentSchema (${analysis_run_name}, ${a.featureid}, ${a.Confidence}): ${ctx.defaultError}`
								};
							}
						}
					)
				)
			});
		},
		{
			timeout: 1 * 60 * 1000
		}
	);

	return { message: "Success" };
}
