"use server";

import { Assignment, Prisma } from "@/app/generated/prisma/client";
import { getNewEditHistory } from "@/app/helpers/actions/actions";
import { parseAssignmentFile } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doEdit(
	stream: ProgressStream,
	url: string,
	editId: string,
	analysis_run_name: Assignment["analysis_run_name"]
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const parseResult = await parseAssignmentFile(stream, url, analysis_run_name, true);
		if (!parseResult) {
			return;
		}
		const { features, taxonomies, assignments, md5Checksum } = parseResult;

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

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
						asvFileUrl_ODE: true,
						asvFileChecksum_ODE: true
					}
				});

				if (!dbAnalysis) {
					return `No Analysis with analysis_run_name of "${analysis_run_name}" found.`;
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					return "Unauthorized action.";
				} else if (!dbAnalysis.asvFileUrl_ODE || !dbAnalysis.asvFileChecksum_ODE) {
					return "Invalid Analysis. Missing file for ASVs.";
				}

				await stream.message("All checks passed.", 80);

				const editHistory = getNewEditHistory(editId, dbAnalysis.editHistory, [
					{
						field: "asvFileUrl_ODE",
						oldValue: dbAnalysis.asvFileUrl_ODE,
						newValue: url
					},
					{
						field: "asvFileChecksum_ODE",
						oldValue: dbAnalysis.asvFileChecksum_ODE,
						newValue: md5Checksum
					}
				]);

				//add asv file to analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						editHistory,
						asvFileUrl_ODE: url,
						asvFileChecksum_ODE: md5Checksum
					}
				});
				await stream.message("Analysis editHistory successfully updated in database.", 85);

				//add new
				const newFeatures = await tx.feature.createManyAndReturn({
					data: features,
					skipDuplicates: true
				});

				const newTaxonomies = await tx.taxonomy.createManyAndReturn({
					data: taxonomies,
					skipDuplicates: true
				});

				const newAssignments = await tx.assignment.createManyAndReturn({
					data: assignments,
					skipDuplicates: true
				});

				await stream.message("New entries successfully added to database.", 90);

				//update old
				await updateManyRaw(
					tx,
					"Feature",
					features.filter((feat) => !newFeatures.some((dbFeat) => dbFeat.featureid === feat.featureid)),
					"featureid"
				);

				await updateManyRaw(
					tx,
					"Taxonomy",
					taxonomies.filter((taxa) => !newTaxonomies.some((dbTaxa) => dbTaxa.taxonomy === taxa.taxonomy)),
					"taxonomy"
				);

				await updateManyRaw(
					tx,
					"Assignment",
					assignments.filter(
						(a) =>
							!newAssignments.some(
								(dbA) => dbA.analysis_run_name === a.analysis_run_name && dbA.featureid === a.featureid
							)
					)
				);

				await stream.message("Existing entries successfully updated in database.", 93);

				//delete unused
				//rely on cron to delete unused features and taxonomies
				await tx.assignment.deleteMany({
					where: {
						analysis_run_name,
						featureid: {
							notIn: assignments.map((a) => a.featureid)
						}
					}
				});
			},
			{ timeout: 1 * 60 * 1000 }
		);

		await stream.success("Success");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			await stream.error(handlePrismaError(err).error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function assignSubmitAction(
	url: string,
	editId: string,
	analysis_run_name: Assignment["analysis_run_name"]
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
