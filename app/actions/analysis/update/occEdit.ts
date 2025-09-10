"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { deadBooleanToString } from "@/app/helpers/utils";
import { OccurrenceOptionalDefaultsSchema } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { parse } from "csv-parse";
import { md5 } from "js-md5";

async function doEdit(stream: ProgressStream, url: string, editId: string, analysis_run_name: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

	try {
		//fetch from blob storage
		await stream.message("Downloading file", 10);
		const response = await fetch(url);
		if (!response.ok) {
			await stream.error(
				`Occurrence file for ${analysis_run_name} responded ${response.status}: ${response.statusText}.`
			);
			return;
		}

		let headers = [] as string[];

		await stream.message("Reading file into memory", 15);
		const text = await response.text();
		const md5Checksum = md5(text);
		const parser = parse(text, { delimiter: "\t" });
		await stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of parser) {
			//get first row as headers
			if (!headers.length) {
				headers = record;
			} else {
				i++;

				//iterate over each column
				const featureid = record[0];
				if (!featureid) {
					await stream.error(`No "featureid" found for row ${i}.`);
					return;
				}
				for (let j = 1; j < headers.length; j++) {
					const samp_name = headers[j];
					if (!samp_name) {
						await stream.error(`No "samp_name" found for column ${j}.`);
						return;
					}
					const organismQuantity = parseInt(record[j]);
					if (isNaN(organismQuantity)) {
						await stream.error(
							`Organism quantity is not an integer for Feature ${featureid} (row ${i}) and Sample ${samp_name} (column ${j}). Value is ${record[j]}.`
						);
						return;
					}

					if (organismQuantity) {
						//parse occurrence
						const parsedOccurrence = OccurrenceOptionalDefaultsSchema.safeParse(
							{
								samp_name,
								featureid,
								organismQuantity,
								analysis_run_name
							},
							{
								errorMap: (error, ctx) => {
									return {
										message: `Field: ${error.path[0]}\nIssue: ${
											ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
										}\nValue: ${
											error.path[0] === "samp_name"
												? samp_name
												: error.path[0] === "featureid"
												? featureid
												: error.path[0] === "organismQuantity"
												? organismQuantity
												: undefined
										}`
									};
								}
							}
						);

						if (!parsedOccurrence.success) {
							await stream.error(
								`Table: Occurrence\n` +
									`Key: ${analysis_run_name}\n` +
									`Key: ${samp_name}\n` +
									`Key: ${featureid}\n\n` +
									`${parsedOccurrence.error.issues.map((e) => e.message).join("\n\n")}`
							);
							return;
						}

						//no optional fields

						occurrences.push(parsedOccurrence.data);
					}
				}
			}

			//add to progress bar
			await stream.message(`Processed line ${i} of ${parser.info.records}.`, (i / parser.info.records) * 50 + 25);
		}

		await stream.message("Occurrences successfully parsed into database format. Parsing data into database.", 75);

		await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbAnalysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						},
						editHistory: true,
						occurrenceFileUrl_ODE: true,
						occurrenceFileChecksum_ODE: true
					}
				});

				if (!dbAnalysis) {
					return `No Analysis with analysis_run_name of "${analysis_run_name}" found.`;
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					return "Unauthorized action.";
				} else if (!dbAnalysis.occurrenceFileUrl_ODE || !dbAnalysis.occurrenceFileChecksum_ODE) {
					return "Invalid Analysis. Missing file for Occurrences.";
				}

				await stream.message("All checks passed.", 80);

				const changes = [
					{
						field: "occurrenceFileUrl_ODE",
						oldValue: dbAnalysis.occurrenceFileUrl_ODE,
						newValue: url
					},
					{
						field: "occurrenceFileChecksum_ODE",
						oldValue: dbAnalysis.occurrenceFileChecksum_ODE,
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

				//add occurrence file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						editHistory,
						occurrenceFileUrl_ODE: url,
						occurrenceFileChecksum_ODE: md5Checksum
					}
				});
				await stream.message("Analysis editHistory successfully updated in database.", 85);

				//create new
				const newOccurrences = await tx.occurrence.createManyAndReturn({
					data: occurrences,
					skipDuplicates: true
				});

				//update old
				await updateManyRaw(
					tx,
					"Occurrence",
					occurrences.filter(
						(occ) =>
							!newOccurrences.some((dbOcc) => dbOcc.samp_name === occ.samp_name && dbOcc.featureid === occ.featureid)
					)
				);

				//delete unused
				await tx.occurrence.deleteMany({
					where: {
						analysis_run_name,
						featureid: {
							notIn: occurrences.map((occ) => occ.featureid)
						}
					}
				});

				await tx.occurrence.deleteMany({
					where: {
						analysis_run_name,
						samp_name: {
							notIn: occurrences.map((occ) => occ.samp_name)
						}
					}
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

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

export default async function occSubmitAction(url: string, editId: string, analysis_run_name: string) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
