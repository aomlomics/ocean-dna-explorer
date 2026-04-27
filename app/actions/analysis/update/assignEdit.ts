"use server";

import { Assignment } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseAssignmentsFile } from "@/app/helpers/actions/analysis";
import { prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { handlePrismaError, updateManyRaw } from "@/app/helpers/queries";
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

		const parseResult = await parseAssignmentsFile({
			channel: { stream, url },
			analysis_run_name,
			oldChecksum: dbAnalysis.analysisMetadataFileChecksum_ODE
		});
		if (!parseResult) {
			return;
		}
		const { features, taxonomies, assignments, assignmentsMd5 } = parseResult;

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

		const assignFeatureids = assignments.map((a) => a.featureid);

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
					skipDuplicates: true,
					select: {
						featureid: true
					}
				});

				const newTaxonomies = await tx.taxonomy.createManyAndReturn({
					data: taxonomies,
					skipDuplicates: true,
					select: {
						taxonomy: true
					}
				});

				const newAssignments = await tx.assignment.createManyAndReturn({
					data: assignments,
					skipDuplicates: true,
					select: {
						analysis_run_name: true,
						featureid: true
					}
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
					),
					["analysis_run_name", "featureid"]
				);

				await stream.message("Existing entries successfully updated in database.", 90);

				//delete unused
				//rely on cron to delete unused features and taxonomies
				const currAssigns = await tx.assignment.findMany({
					where: {
						analysis_run_name
					},
					select: {
						id: true,
						featureid: true
					}
				});

				const assignsToDelete = currAssigns.reduce((acc, assign) => {
					if (!assignFeatureids.includes(assign.featureid)) {
						acc.push(assign.id);
					}
					return acc;
				}, [] as number[]);

				await tx.assignment.deleteMany({
					where: {
						analysis_run_name,
						id: {
							in: assignsToDelete
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
						newValue: assignmentsMd5
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
						asvFileChecksum_ODE: assignmentsMd5
					}
				});

				await stream.message("Analysis successfully updated with new file URL.", 99);
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

export default async function assignEditAction(
	url: string,
	editId: string,
	analysis_run_name: Assignment["analysis_run_name"]
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name).then(stream.close);

	return stream.readable;
}
