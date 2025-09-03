"use server";

import { Prisma, Sample } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { deadBooleanToString } from "@/app/helpers/utils";
import { auth } from "@clerk/nextjs/server";
import { SampleScalarFieldEnumSchema, SampleOptionalDefaultsSchema } from "@/prisma/generated/zod";
import { RolePermissions } from "@/types/objects";
import { parse } from "csv-parse";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { md5 } from "js-md5";
import { ProgressStream } from "@/types/globals";

async function doEdit(stream: ProgressStream, url: string, editId: string, project_id: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const samples = [] as Prisma.SampleCreateManyInput[];

	try {
		//fetch file from blob storage
		await stream.message("Downloading file", 10);
		const sampleFileResponse = await fetch(url);
		if (!sampleFileResponse.ok) {
			await stream.error(`Sample file responded ${sampleFileResponse.status}: ${sampleFileResponse.statusText}.`);
			return;
		}

		await stream.message("Reading file into memory", 15);
		const sampleText = await sampleFileResponse.text();
		const md5Checksum = md5(sampleText);
		const sampleParser = parse(sampleText, {
			columns: true,
			delimiter: "\t",
			comment: "#",
			comment_no_infix: true
		});
		await stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of sampleParser) {
			if (record.samp_name) {
				i++;

				const sampleRow = {} as Sample;
				const sampleUserDefined = {} as PrismaJson.UserDefinedType;

				for (const [field, v] of Object.entries(record)) {
					const value = v as string;

					//User defined
					if (!SampleScalarFieldEnumSchema.safeParse(field).success) {
						sampleUserDefined[field] = value;
					} else {
						//sample table
						parseSchemaToObject(field, value, sampleRow, "sample");
					}
				}

				const parsedSample = SampleOptionalDefaultsSchema.safeParse(
					{
						...sampleRow,
						project_id,
						userDefined: Object.keys(sampleUserDefined).length ? sampleUserDefined : "JsonNull"
					},
					{
						errorMap: (error, ctx) => {
							return {
								message: `Field: ${error.path[0]}\nIssue: ${
									ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
								}\nValue: ${sampleRow[error.path[0] as keyof typeof sampleRow]}`
							};
						}
					}
				);

				if (!parsedSample.success) {
					await stream.error(
						`Table: Sample\n` +
							`Key: ${sampleRow.samp_name}\n\n` +
							`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
					);
					return;
				}
				//@ts-ignore issue with Json database type
				samples.push(parsedSample.data);

				//add to progress bar
				await stream.message(
					`Processed Sample ${parsedSample.data.samp_name}, row ${i} of ${sampleParser.info.records}.`,
					(i / sampleParser.info.records) * 50 + 25
				);
			}
		}

		await stream.message("All entries successfully parsed into database format. Parsing data into database.", 75);

		const sampNames = samples.map((samp) => samp.samp_name);

		const dbError = await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbProject = await tx.project.findUnique({
					where: {
						project_id
					},
					select: {
						userIds: true,
						editHistory: true,
						sampleMetadataFileUrl_ODE: true,
						sampleMetadataFileChecksum_ODE: true
					}
				});

				if (!dbProject) {
					return `No Project with project_id of "${project_id}" found.`;
				} else if (!dbProject.userIds.includes(userId)) {
					return "Unauthorized action.";
				}

				const dbSamples = await tx.sample.findMany({
					where: {
						samp_name: {
							in: sampNames
						}
					},
					select: {
						project_id: true
					}
				});

				if (dbSamples.some((samp) => samp.project_id !== project_id)) {
					return `Some Sample in file does not belong to Project with project_id of "${project_id}".`;
				}

				await stream.message("All checks passed.", 80);

				const changes = [
					{
						field: "sampleMetadataFileUrl_ODE",
						oldValue: dbProject.sampleMetadataFileUrl_ODE,
						newValue: url
					},
					{
						field: "sampleMetadataFileChecksum_ODE",
						oldValue: dbProject.sampleMetadataFileChecksum_ODE,
						newValue: md5Checksum
					}
				];
				let editHistory;
				if (dbProject.editHistory) {
					const currEditIndex = dbProject.editHistory.findIndex((edit) => edit.id === editId);

					if (currEditIndex === -1) {
						//new edit
						editHistory = [
							{
								id: editId,
								dateEdited: new Date(),
								changes
							},
							...dbProject.editHistory
						];
					} else {
						//group changes together into previously existing edit
						dbProject.editHistory[currEditIndex].changes = [
							...dbProject.editHistory[currEditIndex].changes,
							...changes
						];
						editHistory = dbProject.editHistory;
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
				await tx.project.update({
					where: {
						project_id
					},
					data: {
						editHistory
					}
				});
				await stream.message("Project editHistory successfully updated in database.", 85);

				const newSamples = await tx.sample.createManyAndReturn({
					data: samples,
					skipDuplicates: true,
					select: {
						samp_name: true
					}
				});
				await stream.message("New Samples successfully added to database.", 90);

				await updateManyRaw(
					tx,
					"Sample",
					samples.filter((samp) => !newSamples.some((dbSamp) => dbSamp.samp_name === samp.samp_name)),
					"samp_name"
				);
				await stream.message("Existing Samples successfully updated in database.", 93);

				//TODO: delete unused samples (and all associated data) ONLY when it's safe to do so
				// await tx.sample.deleteMany({
				// 	where: {
				// 		project_id,
				// 		samp_name: {
				// 			notIn: sampNames
				// 		}
				// 	}
				// });
				await stream.message("Removed Samples successfully deleted from database.", 96);
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		if (dbError) {
			await stream.error(dbError);
			return;
		}

		await stream.success("Sample file successfully updated in database.");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			const error = handlePrismaError(err);
			await stream.error(error.error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function sampleEditAction(url: string, editId: string, project_id: string) {
	const stream = createProgressStream();

	if (typeof url !== "string" || typeof editId !== "string" || typeof project_id !== "string") {
		stream.error("Arguments are not of correct type");

		stream.close();

		return stream.readable;
	}

	doEdit(stream, url, editId, project_id).then(stream.close);

	return stream.readable;
}
