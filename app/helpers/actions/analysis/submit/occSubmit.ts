"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { OccurrenceOptionalDefaultsSchema } from "@/prisma/generated/zod";

export default async function OccSubmitAction(formData: FormData) {
	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	try {
		const analysis_run_name = formData.get("analysis_run_name") as string;
		console.log(`${analysis_run_name} occurrences submit`);

		const isPrivate = formData.get("isPrivate") === "true" ? true : false;

		//Occurrence file
		//parsing file inside transaction to reduce memory usage, since this file is large
		//TODO: move computation out of transaction
		await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				//check if the associated analysis is private, and throw an error if it is private but the submission is public
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						isPrivate: true
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${analysis_run_name} does not exist.`);
				} else if (analysis.isPrivate && !isPrivate) {
					throw new Error(
						`Analysis with analysis_run_name of ${analysis_run_name} is private. Occurrences can't be public if the associated analysis is private.`
					);
				}

				const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

				console.log(`${analysis_run_name}_occ file`);
				let occFileLines;
				//fetch from blob storage
				const url = JSON.parse(formData.get("file") as string).url;
				const file = await fetch(url);
				const fileText = await file.text();
				occFileLines = fileText.replace(/[\r]+/gm, "").split("\n");
				occFileLines.splice(0, 1); //TODO: parse comments out logically instead of hard-coded
				const occFileHeaders = occFileLines[0].split("\t");

				//iterate over each row
				for (let i = 1; i < occFileLines.length; i++) {
					const currentLine = occFileLines[i].split("\t");

					if (currentLine[0]) {
						//iterate over each column
						for (let j = 1; j < occFileHeaders.length; j++) {
							const samp_name = occFileHeaders[j];
							const featureid = currentLine[0];
							const organismQuantity = parseInt(currentLine[j]);

							if (organismQuantity) {
								//occurrence table
								occurrences.push(
									OccurrenceOptionalDefaultsSchema.parse(
										{
											samp_name,
											featureid,
											organismQuantity,
											analysis_run_name,
											isPrivate
										},
										{
											errorMap: (error, ctx) => {
												return {
													message: `OccurrenceSchema (${analysis_run_name}, ${samp_name}, ${featureid}): ${ctx.defaultError}`
												};
											}
										}
									)
								);
							}
						}
					}
				}

				//occurrences
				console.log("occurrences");
				await tx.occurrence.createMany({
					data: occurrences
				});
			},
			{
				timeout: 1 * 60 * 1000
			}
		);

		revalidatePath("/explore");
		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
