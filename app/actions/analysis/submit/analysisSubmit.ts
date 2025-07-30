"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { createProgressStream, deadBooleanToString, parseSchemaToObject } from "@/app/helpers/utils";
import { AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { parse } from "csv-parse";

async function doSubmit(stream: ProgressStream, file: File, isPrivate: boolean) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const analysisCol = {} as Record<string, string>;

	try {
		//Analysis file
		console.log("Analysis file");
		const userDefined = {} as PrismaJson.UserDefinedType;

		await stream.message("Reading file into memory", 10);
		const parser = parse(await file.text(), { columns: true, delimiter: "\t" });
		await stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of parser) {
			const field = record.term_name;
			if (field) {
				i++;

				const value = record.values;

				//User defined
				if (!AnalysisScalarFieldEnumSchema.safeParse(field).success) {
					userDefined[field] = value;
				} else {
					parseSchemaToObject(field, value, analysisCol, "analysis");
				}
			}

			//add to progress bar
			await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50);
		}

		const parsedAnalysis = AnalysisOptionalDefaultsSchema.safeParse(
			{ ...analysisCol, isPrivate, editHistory: "JsonNull" },
			{
				errorMap: (error, ctx) => {
					return {
						message: `Field: ${error.path[0]}\nIssue: ${
							ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
						}\nValue: ${analysisCol[error.path[0] as keyof typeof analysisCol]}`
					};
				}
			}
		);

		if (!parsedAnalysis.success) {
			await stream.error(
				`Table: Analysis\n` +
					`Key: ${analysisCol.analysis_run_name}\n\n` +
					`${parsedAnalysis.error.issues.map((e) => e.message).join("\n\n")}`
			);
			return;
		}

		await stream.message("Analysis successfully parsed into database format. Parsing data into database.", 50);

		//analysis
		console.log("analysis");
		await prisma.$transaction(async (tx) => {
			//check if the associated project is private, and throw an error if it is private but the submission is public
			const project = await tx.project.findUnique({
				where: {
					project_id: analysisCol.project_id
				},
				select: {
					isPrivate: true,
					userIds: true
				}
			});
			if (!project) {
				throw new Error(`Project with project_id of ${analysisCol.project_id} does not exist.`);
			} else if (!project.userIds.includes(userId)) {
				throw new Error(
					`Permission denied for adding analysis to Project with project_id of ${analysisCol.project_id}. Please contact submission owner with a request to be added to the Project.`
				);
			} else if (project.isPrivate && !isPrivate) {
				throw new Error(
					`Project with project_id of ${analysisCol.project_id} is private. Analyses can't be public if the associated project is private.`
				);
			}

			await tx.analysis.create({
				//@ts-ignore issue with Json database type
				data: parsedAnalysis.data
			});
		});

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

export default async function analysisSubmitAction(file: File, isPrivate: boolean) {
	const stream = createProgressStream();

	doSubmit(stream, file, isPrivate).then(stream.close);

	return stream.readable;
}
