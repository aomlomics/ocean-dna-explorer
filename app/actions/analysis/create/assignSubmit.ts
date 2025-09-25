"use server";

import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { Assignment } from "@/prisma/generated/zod";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { createProgressStream } from "@/app/helpers/progress";
import { parseAssignmentFile } from "@/app/helpers/actions/analysis";

async function doSubmit(stream: ProgressStream, analysis_run_name: Assignment["analysis_run_name"], url: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const parseResult = await parseAssignmentFile({ stream, url, analysis_run_name });
		if (!parseResult) {
			return;
		}
		const { features, taxonomies, assignments, md5Checksum } = parseResult;

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

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

				//add asv file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						asvFileUrl_ODE: url,
						asvFileChecksum_ODE: md5Checksum
					}
				});

				//upload to database
				//features
				await tx.feature.createMany({
					data: features,
					skipDuplicates: true
				});

				//taxonomies
				await tx.taxonomy.createMany({
					data: taxonomies,
					skipDuplicates: true
				});

				//assignments
				await tx.assignment.createMany({
					data: assignments
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

export default async function assignSubmitAction(analysis_run_name: Assignment["analysis_run_name"], url: string) {
	const stream = createProgressStream();

	doSubmit(stream, analysis_run_name, url).then(stream.close);

	return stream.readable;
}
