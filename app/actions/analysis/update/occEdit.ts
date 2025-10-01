"use server";

import { Occurrence } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
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
		const dbAnalysis = await prisma.analysis.findUnique({
			where: {
				analysis_run_name
			},
			select: {
				occurrenceFileChecksum_ODE: true,
				Project: { select: { userIds: true } }
			}
		});

		if (!dbAnalysis) {
			await stream.error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
			return;
		} else if (!dbAnalysis.Project.userIds.includes(userId)) {
			await stream.error("Unauthorized action.");
			return;
		}

		const parseResult = await parseOccurrenceFile({
			stream,
			url,
			analysis_run_name,
			oldChecksum: dbAnalysis.occurrenceFileChecksum_ODE || undefined
		});
		if (!parseResult) {
			return;
		}
		const { occurrences, md5Checksum } = parseResult;

		await stream.message("Occurrences successfully parsed into database format. Parsing data into database.", 75);

		const occSampNames = occurrences.map((occ) => occ.samp_name);
		const occFeatureids = occurrences.map((occ) => occ.featureid);

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
						project_id: true,
						editHistory: true,
						occurrenceFileUrl_ODE: true,
						occurrenceFileChecksum_ODE: true
					}
				});

				if (!dbAnalysis) {
					throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					throw new Error("Unauthorized action.");
				} else if (!dbAnalysis.occurrenceFileUrl_ODE || !dbAnalysis.occurrenceFileChecksum_ODE) {
					throw new Error("Invalid Analysis. Missing file for Occurrences.");
				}

				await stream.message("All checks passed.", 80);

				//create new
				const newOccurrences = await tx.occurrence.createManyAndReturn({
					data: occurrences,
					skipDuplicates: true
				});

				await stream.message("New entries successfully added to database.", 85);

				//update old
				await updateManyRaw(
					tx,
					"Occurrence",
					occurrences.filter(
						(occ) =>
							!newOccurrences.some((dbOcc) => dbOcc.samp_name === occ.samp_name && dbOcc.featureid === occ.featureid)
					),
					["analysis_run_name", "samp_name", "featureid"]
				);

				await stream.message("Existing entries successfully updated in database.", 90);

				//delete unused
				const currOccs = await tx.occurrence.findMany({
					where: {
						analysis_run_name
					},
					select: {
						id: true,
						samp_name: true,
						featureid: true
					}
				});

				const occToDelete = currOccs.reduce((acc, occ) => {
					if (!occSampNames.includes(occ.samp_name) || !occFeatureids.includes(occ.featureid)) {
						acc.push(occ.id);
					}
					return acc;
				}, [] as number[]);

				await tx.occurrence.deleteMany({
					where: {
						analysis_run_name,
						id: {
							in: occToDelete
						}
					}
				});

				await stream.message("Removed entries successfully deleted in database.", 95);

				const editHistory = addToHistory("analysis", editId, dbAnalysis.editHistory, [
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

				await stream.success("Success");
			},
			{ timeout: 1 * 60 * 1000 }
		);
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

export default async function occEditAction(
	url: string,
	editId: string,
	analysis_run_name: Occurrence["analysis_run_name"]
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
