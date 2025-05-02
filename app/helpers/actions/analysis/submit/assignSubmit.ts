"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import { auth } from "@clerk/nextjs/server";
import {
	FeaturePartial,
	AssignmentPartial,
	TaxonomyPartial,
	FeatureOptionalDefaultsSchema,
	FeatureScalarFieldEnumSchema,
	AssignmentOptionalDefaultsSchema,
	AssignmentScalarFieldEnumSchema,
	TaxonomyOptionalDefaultsSchema,
	TaxonomyScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";

export default async function assignSubmitAction(formData: FormData): Promise<NetworkPacket> {
	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	try {
		const analysis_run_name = formData.get("analysis_run_name") as string;
		console.log(`${analysis_run_name} assignment submit`);

		const isPrivate = formData.get("isPrivate") === "true" ? true : false;

		//Feature file
		//parsing file inside transaction to reduce memory usage, since this file is large
		//TODO: move computation out of transaction
		await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
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
								{ ...featureRow, sequenceLength: featureRow.dna_sequence!.length, isPrivate },
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
							TaxonomyOptionalDefaultsSchema.parse(
								{ ...taxonomyRow, isPrivate },
								{
									errorMap: (error, ctx) => {
										return { message: `TaxonomySchema (${analysis_run_name}): ${ctx.defaultError}` };
									}
								}
							)
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
				//private
				if (!isPrivate) {
					await tx.feature.updateMany({
						where: {
							featureid: {
								in: features.map((feat) => feat.featureid)
							},
							isPrivate: true
						},
						data: {
							isPrivate: false
						}
					});
				}

				//taxonomies
				console.log("taxonomies");
				await tx.taxonomy.createMany({
					data: taxonomies,
					skipDuplicates: true
				});
				//private
				if (!isPrivate) {
					await tx.taxonomy.updateMany({
						where: {
							taxonomy: {
								in: taxonomies.map((taxa) => taxa.taxonomy)
							},
							isPrivate: true
						},
						data: {
							isPrivate: false
						}
					});
				}

				//assignments
				console.log("assignments");
				await tx.assignment.createMany({
					data: assignments
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
