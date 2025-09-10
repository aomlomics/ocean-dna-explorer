"use server";

import { Occurrence, Prisma } from "@/app/generated/prisma/client";
import { getNewEditHistory } from "@/app/helpers/actions/actions";
import { parseOccurrenceFile } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doEdit(
	stream: ProgressStream,
	url: string,
	editId: string,
	analysis_run_name: Occurrence["analysis_run_name"]
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const parseResult = await parseOccurrenceFile(stream, url, analysis_run_name);
		if (!parseResult) {
			return;
		}
		const { occurrences, md5Checksum } = parseResult;

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

				const editHistory = getNewEditHistory(editId, dbAnalysis.editHistory, [
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
				]);

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

export default async function occSubmitAction(
	url: string,
	editId: string,
	analysis_run_name: Occurrence["analysis_run_name"]
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
