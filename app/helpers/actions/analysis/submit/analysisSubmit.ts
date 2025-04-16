"use server";

import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import { AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema } from "@/prisma/schema/generated/zod";
import { auth } from "@clerk/nextjs/server";

export default async function analysisSubmitAction(formData: FormData) {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	try {
		const analysisCol = {} as Record<string, string>;

		const isPrivate = formData.get("isPrivate") ? true : false;

		//Analysis file
		console.log("Analysis file");
		//code block to force garbage collection
		{
			//parse file
			const analysisFileLines = (await (formData.get("file") as File).text()).replace(/[\r]+/gm, "").split("\n");
			//iterate over each row
			for (let i = 1; i < analysisFileLines.length; i++) {
				// TODO: get extension of file and split accordingly
				const currentLine = analysisFileLines[i].split("\t");

				//Analysis
				if (currentLine[0]) {
					parseSchemaToObject(
						currentLine[1].replace(/[\r\n]+/gm, ""),
						currentLine[0],
						analysisCol,
						AnalysisOptionalDefaultsSchema,
						AnalysisScalarFieldEnumSchema
					);
				}
			}
		}

		//analysis
		console.log("analysis");
		await prisma.$transaction(async (tx) => {
			//check if the associated project is private, and throw an error if it is private but the submission is public
			const project = await tx.project.findUnique({
				where: {
					project_id: analysisCol.project_id
				},
				select: {
					isPrivate: true
				}
			});
			if (!project) {
				throw new Error(`Project with project_id of ${analysisCol.project_id} does not exist.`);
			} else if (project.isPrivate && !isPrivate) {
				throw new Error(
					`Project with project_id of ${analysisCol.project_id} is private. Analyses can't be public if the associated project is private.`
				);
			}

			await tx.analysis.create({
				//@ts-ignore issue with Json database type
				data: AnalysisOptionalDefaultsSchema.parse(
					{ ...analysisCol, userId: userId, isPrivate, editHistory: "JsonNull" },
					{
						errorMap: (error, ctx) => {
							return { message: `AnalysisSchema: ${ctx.defaultError}` };
						}
					}
				)
			});
		});

		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
