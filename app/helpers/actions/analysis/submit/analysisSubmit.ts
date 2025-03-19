"use server";

import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import { AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { SubmitActionReturn } from "@/types/types";
import { auth } from "@clerk/nextjs/server";

export default async function analysisSubmitAction(formData: FormData): SubmitActionReturn {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const analysisCol = {} as Record<string, string>;

	//Analysis file
	console.log("Analysis file");
	//code block to force garbage collection
	{
		//parse file
		const analysisFileLines = (await (formData.get("file") as File).text()).replace(/[\r]+/gm, "").split("\n");
		//iterate over each row
		for (let i = 1; i < analysisFileLines.length; i++) {
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
	const dbAnalysis = await prisma.analysis.create({
		//@ts-ignore issue with Json database type
		data: AnalysisOptionalDefaultsSchema.parse(
			{ ...analysisCol, userId: userId, editHistory: "JsonNull" },
			{
				errorMap: (error, ctx) => {
					return { message: `AnalysisSchema: ${ctx.defaultError}` };
				}
			}
		),
		select: {
			analysis_run_name: true
		}
	});

	return { message: "Success", result: { analysis_run_name: dbAnalysis.analysis_run_name } };
}
