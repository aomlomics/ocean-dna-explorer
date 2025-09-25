"use server";

import { Assignment } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
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
		const dbAnalysis = await prisma.analysis.findUnique({
			where: {
				analysis_run_name
			},
			select: {
				analysisMetadataFileChecksum_ODE: true,
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

		const parseResult = await parseAssignmentFile({
			stream,
			url,
			analysis_run_name,
			oldChecksum: dbAnalysis.analysisMetadataFileChecksum_ODE
		});
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
						project_id: true,
						editHistory: true,
						asvFileUrl_ODE: true,
						asvFileChecksum_ODE: true
					}
				});

				if (!dbAnalysis) {
					throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
				} else if (!dbAnalysis.Project.userIds.includes(userId)) {
					throw new Error("Unauthorized action.");
				} else if (!dbAnalysis.asvFileUrl_ODE || !dbAnalysis.asvFileChecksum_ODE) {
					throw new Error("Invalid Analysis. Missing file for ASVs.");
				}

				await stream.message("All checks passed.", 80);

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

				await stream.message("New entries successfully added to database.", 85);

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

				await stream.message("Existing entries successfully updated in database.", 90);

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

				await stream.message("Removed entries successfully deleted in database.", 95);

				const editHistory = addToHistory("analysis", editId, dbAnalysis.editHistory, [
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

export default async function assignSubmitAction(
	url: string,
	editId: string,
	analysis_run_name: Assignment["analysis_run_name"]
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
