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
	TaxonomyScalarFieldEnumSchema,
	AssignmentSchema
} from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions, ZodBooleanSchema } from "@/types/objects";
import { z } from "zod";

const formSchema = z.object({
	isPrivate: ZodBooleanSchema,
	analysis_run_name: AssignmentSchema.shape.analysis_run_name,
	url: z.string().url()
});

//TODO: test
export default async function assignSubmitAction(formData: FormData): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (!(formData instanceof FormData)) {
		return { statusMessage: "error", error: "Argument must be FormData" };
	}
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = formSchema.safeParse(formDataObject);
	if (!parsed.success) {
		return {
			statusMessage: "error",
			error: parsed.error.issues
				? parsed.error.issues.map((issue) => `${issue.path[0]}: ${issue.message}`).join(" ")
				: "Invalid data structure."
		};
	}

	try {
		console.log(`${parsed.data.analysis_run_name} assignment submit`);

		const features = [] as Prisma.FeatureCreateManyInput[];
		const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
		const assignments = [] as Prisma.AssignmentCreateManyInput[];

		//Feature file
		console.log(`${parsed.data.analysis_run_name}_assign file`);
		//code block to force garbage collection
		{
			let assignFileLines;
			//fetch files from blob storage
			const file = await fetch(parsed.data.url);
			const fileText = await file.text();
			assignFileLines = fileText.replace(/[\r]+/gm, "").split("\n");
			const assignFileHeaders = assignFileLines[0].split("\t");

			//iterate over each row
			for (let i = 1; i < assignFileLines.length; i++) {
				// TODO: get extension of file and split accordingly
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
							{ ...featureRow, sequenceLength: featureRow.dna_sequence!.length, isPrivate: parsed.data.isPrivate },
							{
								errorMap: (error, ctx) => {
									return { message: `FeatureSchema (${parsed.data.analysis_run_name}): ${ctx.defaultError}` };
								}
							}
						)
					);

					assignments.push(
						AssignmentOptionalDefaultsSchema.parse(
							{
								...assignmentRow,
								isPrivate: parsed.data.isPrivate,
								analysis_run_name: parsed.data.analysis_run_name
							},
							{
								errorMap: (error, ctx) => {
									return {
										message: `AssignmentSchema (${parsed.data.analysis_run_name}, ${assignmentRow.featureid}, ${assignmentRow.Confidence}): ${ctx.defaultError}`
									};
								}
							}
						)
					);

					taxonomies.push(
						TaxonomyOptionalDefaultsSchema.parse(
							{ ...taxonomyRow, isPrivate: parsed.data.isPrivate },
							{
								errorMap: (error, ctx) => {
									return { message: `TaxonomySchema (${parsed.data.analysis_run_name}): ${ctx.defaultError}` };
								}
							}
						)
					);
				}
			}
		}

		//parsing file inside transaction to reduce memory usage, since this file is large
		await prisma.$transaction(
			async (tx) => {
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name: parsed.data.analysis_run_name
					},
					select: {
						isPrivate: true
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${parsed.data.analysis_run_name} does not exist.`);
				} else if (analysis.isPrivate && !parsed.data.isPrivate) {
					throw new Error(
						`Analysis with analysis_run_name of ${parsed.data.analysis_run_name} is private. Assignments can't be public if the associated analysis is private.`
					);
				}

				//upload to database
				//features
				console.log("features");
				await tx.feature.createMany({
					data: features,
					skipDuplicates: true
				});
				//private
				if (!parsed.data.isPrivate) {
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
				if (!parsed.data.isPrivate) {
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
