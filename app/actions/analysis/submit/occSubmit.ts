"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { OccurrenceOptionalDefaultsSchema, OccurrenceSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { z } from "zod";

const formSchema = z.object({
	analysis_run_name: OccurrenceSchema.shape.analysis_run_name,
	url: z.string().url()
});

export default async function OccSubmitAction(formData: FormData): Promise<NetworkPacket> {
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

	const occurrences = [] as Prisma.OccurrenceCreateManyInput[];

	try {
		//Occurrence file

		console.log(`${parsed.data.analysis_run_name}_occ file`);
		//code block to force garbage collection
		{
			//fetch from blob storage
			const response = await fetch(parsed.data.url);
			if (!response.ok) {
				return {
					statusMessage: "error",
					error: `Occurrence file for ${parsed.data.analysis_run_name} responded ${response.status}: ${response.statusText}.`
				};
			}
			const text = await response.text();
			const occFileLines = text.replace(/[\r]+/gm, "").split("\n");
			const occFileHeaders = occFileLines[0].split("\t");

			//iterate over each row
			for (let i = 1; i < occFileLines.length; i++) {
				// TODO: get extension of file and split accordingly
				const currentLine = occFileLines[i].split("\t");

				if (currentLine[0]) {
					//iterate over each column
					for (let j = 1; j < occFileHeaders.length; j++) {
						const samp_name = occFileHeaders[j];
						const featureid = currentLine[0];
						const organismQuantity = parseInt(currentLine[j]);

						if (organismQuantity) {
							//parse occurrence
							const parsedOccurrence = OccurrenceOptionalDefaultsSchema.safeParse(
								{
									samp_name,
									featureid,
									organismQuantity,
									analysis_run_name: parsed.data.analysis_run_name
								},
								{
									errorMap: (error, ctx) => {
										return {
											message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
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
								return {
									statusMessage: "error",
									error:
										`Table: Occurrence\n` +
										`Key: ${parsed.data.analysis_run_name}\n` +
										`Key: ${samp_name}\n` +
										`Key: ${featureid}\n\n` +
										`${parsedOccurrence.error.issues.map((e) => e.message).join("\n\n")}`
								};
							}
							occurrences.push(parsedOccurrence.data);
						}
					}
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
						Project: {
							select: {
								userIds: true
							}
						}
					}
				});
				if (!analysis) {
					throw new Error(`Analysis with analysis_run_name of ${parsed.data.analysis_run_name} does not exist.`);
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

		revalidatePath("/explore");
		return { statusMessage: "success" };
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
