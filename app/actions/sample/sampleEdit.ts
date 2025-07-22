"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { updateManyRaw, handlePrismaError, prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import {
	SampleOptionalDefaultsSchema,
	SamplePartial,
	SamplePartialSchema,
	SampleScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { Parser } from "csv-parse";
import { auth } from "@clerk/nextjs/server";

export default async function sampleEditAction(csvParser: Parser): Promise<NetworkPacket> {
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
			return {
				statusMessage: "error",
				error:
					`Table: Sample\n` +
					`Key: ${sampleRow.samp_name}\n\n` +
					`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
			};
		}

		samples.push(parsedSample.data);
	}

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
				return { statusMessage: "error", error: "Permission denied for some Samples." };
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
				return { statusMessage: "error", error: "Samples must all be for the same Project." };
			}

			await updateManyRaw(tx, "Sample", samples, "samp_name");
		});
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}

	return { statusMessage: "success" };
}
