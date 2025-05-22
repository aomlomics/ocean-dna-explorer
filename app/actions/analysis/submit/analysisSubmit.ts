"use server";

import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import { AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions, ZodBooleanSchema, ZodFileSchema } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const formSchema = z.object({
	isPrivate: ZodBooleanSchema.optional(),
	file: ZodFileSchema
});

export default async function analysisSubmitAction(formData: FormData): Promise<NetworkPacket> {
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

	const analysisCol = {} as Record<string, string>;

	try {
		//Analysis file
		console.log("Analysis file");
		//code block to force garbage collection
		{
			//parse file
			const analysisFileLines = (await parsed.data.file.text()).replace(/[\r]+/gm, "").split("\n");
			const analysisFileHeaders = analysisFileLines[0].split("\t");
			const userDefined = {} as PrismaJson.UserDefinedType;
			//iterate over each row
			for (let i = 1; i < analysisFileLines.length; i++) {
				// TODO: get extension of file and split accordingly
				const currentLine = analysisFileLines[i].split("\t");
				const field = currentLine[analysisFileHeaders.indexOf("term_name")];
				const value = currentLine[analysisFileHeaders.indexOf("values")];
				const section = currentLine[analysisFileHeaders.indexOf("section")];

				//Analysis
				//User defined
				if (section === "User defined") {
					userDefined[field] = value;
				} else {
					parseSchemaToObject(value, field, analysisCol, AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema);
				}
			}
		}

		const data = AnalysisOptionalDefaultsSchema.parse(
			{ ...analysisCol, userIds: [userId], isPrivate: parsed.data.isPrivate, editHistory: "JsonNull" },
			{
				errorMap: (error, ctx) => {
					return { message: `AnalysisSchema: ${ctx.defaultError}` };
				}
			}
		);

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
			} else if (project.isPrivate && !parsed.data.isPrivate) {
				throw new Error(
					`Project with project_id of ${analysisCol.project_id} is private. Analyses can't be public if the associated project is private.`
				);
			}

			await tx.analysis.create({
				//@ts-ignore issue with Json database type
				data
			});
		});

		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
