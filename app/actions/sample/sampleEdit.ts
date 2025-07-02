"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { updateManyRaw, handlePrismaError, prisma } from "@/app/helpers/prisma";
import { createProgressStream, parseSchemaToObject } from "@/app/helpers/utils";
import {
	SampleOptionalDefaultsSchema,
	SamplePartial,
	SamplePartialSchema,
	SampleScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { Parser } from "csv-parse";
import { auth } from "@clerk/nextjs/server";

async function doEdit(stream: ProgressStream, csvParser: Parser) {
	const { userId } = await auth();

	const samples = [] as any[];

	for await (const record of csvParser) {
		const sampleRow = {} as SamplePartial;

		for (const [field, value] of Object.entries(record)) {
			parseSchemaToObject(value as string, field, sampleRow, SampleOptionalDefaultsSchema, SampleScalarFieldEnumSchema);
		}

		const parsedSample = SamplePartialSchema.safeParse(sampleRow, {
			errorMap: (error, ctx) => {
				return {
					message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
						sampleRow[error.path[0] as keyof typeof sampleRow]
					}`
				};
			}
		});

		if (!parsedSample.success) {
			await stream.error(
				`Table: Sample\n` +
					`Key: ${sampleRow.samp_name}\n\n` +
					`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
			);
			return;
		}

		samples.push(parsedSample.data);
	}

	await stream.message("File parsed, uploading data", 50);

	const samp_names = samples.map((samp) => samp.samp_name);
	try {
		await prisma.$transaction(async (tx) => {
			const samplesCount = await tx.sample.count({
				where: {
					samp_name: {
						in: samp_names
					},
					Project: {
						userIds: {
							has: userId
						}
					}
				}
			});
			if (samplesCount !== samples.length) {
				await stream.error("Permission denied for some Samples.");
				return;
			}

			const projectsCount = await tx.sample.findMany({
				where: {
					samp_name: {
						in: samp_names
					}
				},
				distinct: ["project_id"],
				select: {
					id: true
				}
			});
			if (projectsCount.length !== 1) {
				await stream.error("Samples must all be for the same Project.");
				return;
			}

			await updateManyRaw(tx, "Sample", samples, "samp_name");
		});
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			await stream.error(handlePrismaError(err).error);
			return;
		}

		const error = err as Error;
		await stream.error(error.message);
		return;
	}

	await stream.success("Data successfully uploaded");
}

export default async function sampleEditAction(csvParser: Parser) {
	const stream = createProgressStream();

	doEdit(stream, csvParser).then(() => stream.close());

	return stream.readable;
}
