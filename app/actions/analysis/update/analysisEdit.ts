"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { deadBooleanToString } from "@/app/helpers/utils";
import { AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { parse } from "csv-parse";
import { md5 } from "js-md5";

async function doEdit(stream: ProgressStream, url: string, editId: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const analysisCol = {} as Record<string, string>;
	const userDefined = {} as PrismaJson.UserDefinedType;

	try {
		//fetch file from blob storage
		await stream.message("Downloading file", 10);
		const fileResponse = await fetch(url);
		if (!fileResponse.ok) {
			await stream.error(`Analysis file responded ${fileResponse.status}: ${fileResponse.statusText}.`);
			return;
		}

		await stream.message("Reading file into memory", 15);
		const text = await fileResponse.text();
		const md5Checksum = md5(text);
		const parser = parse(text, { columns: true, delimiter: "\t" });
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
			await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
		}

		const parsedAnalysis = AnalysisOptionalDefaultsSchema.safeParse(
			{
				...analysisCol,
				analysisMetadataFileUrl_ODE: url,
				analysisMetadataFileChecksum_ODE: md5Checksum,
				//override with values from database before submitting
				asvFileUrl_ODE: "",
				asvFileChecksum_ODE: "",
				occurrenceFileUrl_ODE: "",
				occurrenceFileChecksum_ODE: "",
				isPrivate: true,
				editHistory: "JsonNull"
			},
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

		//unset all optional fields that were not provided
		for (const field of AnalysisScalarFieldEnumSchema._def.values) {
			if (field !== "id" && field !== "dateSubmitted" && !(field in parsedAnalysis.data)) {
				//@ts-ignore
				parsedAnalysis.data[field] = null;
			}
		}

		const analysis = parsedAnalysis.data;

		await stream.message("Analysis successfully parsed into database format. Parsing data into database.", 50);

		const dbError = await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbAnalysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name: parsedAnalysis.data.analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						},
						analysisMetadataFileUrl_ODE: true,
						analysisMetadataFileChecksum_ODE: true,
						//get actual values of placeholder fields
						asvFileUrl_ODE: true,
						asvFileChecksum_ODE: true,
						occurrenceFileUrl_ODE: true,
						occurrenceFileChecksum_ODE: true,
						isPrivate: true,
						editHistory: true
					}
				});

				if (!dbAnalysis) {
					return `No Analysis with analysis_run_name of "${analysis.analysis_run_name}" found.`;
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					return "Unauthorized action.";
				}

				await stream.message("All checks passed.", 80);

				const changes = [
					{
						field: "analysisMetadataFileUrl_ODE",
						oldValue: dbAnalysis.analysisMetadataFileUrl_ODE,
						newValue: url
					},
					{
						field: "analysisMetadataFileChecksum_ODE",
						oldValue: dbAnalysis.analysisMetadataFileChecksum_ODE,
						newValue: md5Checksum
					}
				];
				let editHistory;
				if (dbAnalysis.editHistory) {
					const currEditIndex = dbAnalysis.editHistory.findIndex((edit) => edit.id === editId);

					if (currEditIndex === -1) {
						//new edit
						editHistory = [
							{
								id: editId,
								dateEdited: new Date(),
								changes
							},
							...dbAnalysis.editHistory
						];
					} else {
						//group changes together into previously existing edit
						dbAnalysis.editHistory[currEditIndex].changes = [
							...dbAnalysis.editHistory[currEditIndex].changes,
							...changes
						];
						editHistory = dbAnalysis.editHistory;
					}
				} else {
					//new edit AND new editHistory
					editHistory = [
						{
							id: editId,
							dateEdited: new Date(),
							changes
						}
					];
				}

				//project
				await tx.analysis.update({
					where: {
						analysis_run_name: analysis.analysis_run_name
					},
					data: {
						...analysis,
						editHistory,
						analysisMetadataFileUrl_ODE: url,
						analysisMetadataFileChecksum_ODE: md5Checksum,
						//overriding placeholder values
						isPrivate: dbAnalysis.isPrivate,
						asvFileUrl_ODE: dbAnalysis.asvFileUrl_ODE,
						asvFileChecksum_ODE: dbAnalysis.asvFileChecksum_ODE,
						occurrenceFileUrl_ODE: dbAnalysis.occurrenceFileUrl_ODE,
						occurrenceFileChecksum_ODE: dbAnalysis.occurrenceFileChecksum_ODE
					}
				});

				//TODO: move old file to storage
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		if (dbError) {
			await stream.error(dbError);
			return;
		}

		await stream.success("Analysis file successfully updated in database.");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			await stream.error(handlePrismaError(err).error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function analysisSubmitAction(url: string, editId: string) {
	const stream = createProgressStream();

	doEdit(stream, url, editId).then(stream.close);

	return stream.readable;
}
