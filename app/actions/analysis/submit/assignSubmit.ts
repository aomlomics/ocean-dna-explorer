"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { batchSubmit, handlePrismaError, prisma } from "@/app/helpers/prisma";
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
	isPrivate: ZodBooleanSchema.optional(),
	analysis_run_name: AssignmentSchema.shape.analysis_run_name,
	url: z.string().url()
});

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

	const features = [] as Prisma.FeatureCreateManyInput[];
	const taxonomies = [] as Prisma.TaxonomyCreateManyInput[];
	const assignments = [] as Prisma.AssignmentCreateManyInput[];

	try {
		//Feature file
		console.log(`${parsed.data.analysis_run_name}_assign file`);
		//code block to force garbage collection
		{
			//fetch files from blob storage
			const response = await fetch(parsed.data.url);
			if (!response.ok) {
				return {
					statusMessage: "error",
					error: `Assignment file for ${parsed.data.analysis_run_name} responded ${response.status}: ${response.statusText}.`
				};
			}
			const text = await response.text();
			const assignFileLines = text.replace(/[\r]+/gm, "").split("\n");
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

					//parse feature
					const parsedFeature = FeatureOptionalDefaultsSchema.safeParse(
						{
							...featureRow,
							sequenceLength: featureRow.dna_sequence!.length,
							userIds: [userId],
							isPrivate: parsed.data.isPrivate
						},
						{
							errorMap: (error, ctx) => {
								return {
									message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
										featureRow[error.path[0] as keyof typeof featureRow]
									}`
								};
							}
						}
					);

					if (!parsedFeature.success) {
						return {
							statusMessage: "error",
							error:
								`Table: Feature\n` +
								`Key: ${featureRow.featureid}\n\n` +
								`${parsedFeature.error.issues.map((e) => e.message).join("\n\n")}`
						};
					}
					features.push(parsedFeature.data);

					//parse assignment
					const parsedAssignment = AssignmentOptionalDefaultsSchema.safeParse(
						{
							...assignmentRow,
							userIds: [userId],
							isPrivate: parsed.data.isPrivate,
							analysis_run_name: parsed.data.analysis_run_name
						},
						{
							errorMap: (error, ctx) => {
								return {
									message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
										assignmentRow[error.path[0] as keyof typeof assignmentRow]
									}`
								};
							}
						}
					);

					if (!parsedAssignment.success) {
						return {
							statusMessage: "error",
							error:
								`Table: Assignment\n` +
								`Key: ${assignmentRow.analysis_run_name}\n` +
								`Key: ${assignmentRow.featureid}\n\n` +
								`${parsedAssignment.error.issues.map((e) => e.message).join("\n\n")}`
						};
					}
					assignments.push(parsedAssignment.data);

					//parse taxonomy
					const parsedTaxonomy = TaxonomyOptionalDefaultsSchema.safeParse(
						{ ...taxonomyRow, userIds: [userId], isPrivate: parsed.data.isPrivate },
						{
							errorMap: (error, ctx) => {
								return {
									message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
										taxonomyRow[error.path[0] as keyof typeof taxonomyRow]
									}`
								};
							}
						}
					);

					if (!parsedTaxonomy.success) {
						return {
							statusMessage: "error",
							error:
								`Table: Taxonomy\n` +
								`Key: ${taxonomyRow.taxonomy}\n\n` +
								`${parsedTaxonomy.error.issues.map((e) => e.message).join("\n\n")}`
						};
					}
					taxonomies.push(parsedTaxonomy.data);
				}
			}
		}

		await prisma.$transaction(
			async (tx) => {
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name: parsed.data.analysis_run_name
					},
					select: {
						isPrivate: true,
						userIds: true
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${parsed.data.analysis_run_name} does not exist.`);
				} else if (!analysis.userIds.includes(userId)) {
					throw new Error("Unauthorized");
				} else if (analysis.isPrivate && !parsed.data.isPrivate) {
					throw new Error(
						`Analysis with analysis_run_name of ${parsed.data.analysis_run_name} is private. Assignments can't be public if the associated analysis is private.`
					);
				}

				//upload to database
				//features
				await batchSubmit(tx, features, "feature", "featureid", userId, parsed.data.isPrivate);

				//taxonomies
				await batchSubmit(tx, taxonomies, "taxonomy", "taxonomy", userId, parsed.data.isPrivate);

				//assignments
				console.log("assignments");
				await tx.assignment.createMany({
					data: assignments
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		return { statusMessage: "success" };
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
