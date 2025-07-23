"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { Occurrence, OccurrenceOptionalDefaultsSchema } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { createProgressStream, deadBooleanToString } from "@/app/helpers/utils";
import { parse } from "csv-parse";

async function doSubmit(stream: ProgressStream, analysis_run_name: Occurrence["analysis_run_name"], url: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

	try {
		//Occurrence file

		console.log(`${analysis_run_name}_occ file`);
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
		const parser = parse(await response.text(), { delimiter: "\t" });
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
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						Project: {
							select: {
								userIds: true
							}
						}
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${analysis_run_name} does not exist.`);
				} else if (!analysis.Project.userIds.includes(userId)) {
					throw new Error("Unauthorized");
				}

				//occurrences
				console.log("occurrences");
				await tx.occurrence.createMany({
					data: occurrences
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

export default async function occSubmitAction(analysis_run_name: Occurrence["analysis_run_name"], url: string) {
	const stream = createProgressStream();

	doSubmit(stream, analysis_run_name, url).then(stream.close);

	return stream.readable;
}
