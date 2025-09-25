"use server";

import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { Occurrence } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { createProgressStream } from "@/app/helpers/progress";
import { parseOccurrenceFile } from "@/app/helpers/actions/analysis";

async function doSubmit(stream: ProgressStream, analysis_run_name: Occurrence["analysis_run_name"], url: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const parseResult = await parseOccurrenceFile({ stream, url, analysis_run_name });
		if (!parseResult) {
			return;
		}
		const { occurrences, md5Checksum } = parseResult;

		await stream.message("Occurrences successfully parsed into database format. Parsing data into database.", 75);

		await prisma.$transaction(
			async (tx) => {
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

				//add occurrence file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						occurrenceFileUrl_ODE: url,
						occurrenceFileChecksum_ODE: md5Checksum
					}
				});

				//occurrences
				await tx.occurrence.createMany({
					data: occurrences
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		await stream.success("Success");
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			await stream.error(prismaErr.error);
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
