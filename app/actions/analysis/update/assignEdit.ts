"use server";

import type { AssignmentModel } from "@/app/generated/prisma/models/Assignment";
import type { OccurrenceModel } from "@/app/generated/prisma/models/Occurrence";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseAssignmentsFile } from "@/app/helpers/actions/analysis";
import { prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import {
	connectTaxaToSamples,
	disconnectTaxaFromSamples,
	handlePrismaError,
	updateManyRaw
} from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import type { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

async function doEdit(
	stream: ProgressStream,
	url: string,
	editId: string,
	project_id: AssignmentModel["project_id"],
	analysis_run_name: AssignmentModel["analysis_run_name"]
) {
	const { userId, sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const dbAnalysis = await prisma.analysis.findUnique({
			where: {
				project_id_analysis_run_name: {
					project_id,
					analysis_run_name
				}
			},
			select: {
				analysisMetadataFileChecksum_ODE: true,
				Project: {
					select: {
						userIds: true
					}
				}
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
			project_id,
			analysis_run_name,
			oldChecksum: dbAnalysis.analysisMetadataFileChecksum_ODE
		});
		if (!parseResult) {
			return;
		}
		const { features, taxonomies, assignments, assignmentsMd5 } = parseResult;

		await stream.message("Assignments successfully parsed into database format. Parsing data into database.", 75);

		const featureids = new Set(features.map((feat) => feat.featureid));

		await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbAnalysis = await tx.analysis.findUnique({
					where: {
						project_id_analysis_run_name: {
							project_id,
							analysis_run_name
						}
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

				//get existing occurrence -> assignment relationships before updating assignments
				const oldOccurrences = await tx.occurrence.findMany({
					where: {
						project_id,
						analysis_run_name
					},
					select: {
						lib_id: true,
						featureid: true,
						Assignment: {
							select: {
								taxonomy: true
							}
						}
					}
				});

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
					"feature",
					features.filter((feat) => !new Set(newFeatures.map((f) => f.featureid)).has(feat.featureid))
				);

				await updateManyRaw(
					tx,
					"taxonomy",
					taxonomies.filter((taxa) => !new Set(newTaxonomies.map((t) => t.taxonomy)).has(taxa.taxonomy))
				);

				await updateManyRaw(
					tx,
					"assignment",
					assignments.filter((a) => !new Set(newAssignments.map((a) => a.featureid)).has(a.featureid))
				);

				const newTaxaByFeat = assignments.reduce(
					(acc, assign) => {
						acc[assign.featureid] = assign.taxonomy;
						return acc;
					},
					{} as Record<AssignmentModel["featureid"], AssignmentModel["taxonomy"]>
				);

				const taxaByLibId = oldOccurrences.reduce(
					(acc, occ) => {
						const taxonomy = newTaxaByFeat[occ.featureid];

						if (taxonomy) {
							(acc[occ.lib_id] ??= new Set()).add(taxonomy);
						}

						return acc;
					},
					{} as Record<OccurrenceModel["lib_id"], Set<AssignmentModel["taxonomy"]>>
				);

				await connectTaxaToSamples(tx, project_id, taxaByLibId);

				await stream.message("Existing entries successfully updated in database.", 90);

				//delete unused
				//rely on cron to delete unused features and taxonomies
				const currAssigns = await tx.assignment.findMany({
					where: {
						project_id,
						analysis_run_name
					},
					select: {
						id: true,
						featureid: true
					}
				});

				const assignsToDelete = currAssigns.reduce((acc, assign) => {
					if (!featureids.has(assign.featureid)) {
						acc.push(assign.id);
					}
					return acc;
				}, [] as number[]);

				await tx.assignment.deleteMany({
					where: {
						project_id,
						analysis_run_name,
						id: {
							in: assignsToDelete
						}
					}
				});

				//map removed lib_id -> taxonomy relationships
				const removedTaxaByLibId = oldOccurrences.reduce(
					(acc, occ) => {
						const oldTaxonomy = occ.Assignment.taxonomy;
						const newTaxonomy = newTaxaByFeat[occ.featureid];

						if (newTaxonomy !== oldTaxonomy) {
							(acc[occ.lib_id] ??= new Set()).add(oldTaxonomy);
						}

						return acc;
					},
					{} as Record<OccurrenceModel["lib_id"], Set<AssignmentModel["taxonomy"]>>
				);

				//remove Sample -> Taxonomy relationships that are not in any other analyses
				await disconnectTaxaFromSamples(tx, project_id, analysis_run_name, removedTaxaByLibId);

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
						project_id_analysis_run_name: {
							project_id,
							analysis_run_name
						}
					},
					data: {
						editHistory,
						asvFileUrl_ODE: url,
						asvFileChecksum_ODE: assignmentsMd5,
						Features: {
							set: features.map((feat) => ({ featureid: feat.featureid }))
						},
						Taxonomies: {
							set: taxonomies.map((taxa) => ({ taxonomy: taxa.taxonomy }))
						}
					}
				});
			},
			{ timeout: 5 * 60 * 1000 }
		);

		await stream.success("Success");

		//update BLAST databases
		fetch(
			`${process.env.NEXT_PUBLIC_SERVER_URL}/analysis/${project_id}/${analysis_run_name}/afterSubmission?delete=true&skipDiversities=true`,
			{
				method: "POST",
				headers: {
					Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
				}
			}
		);

		return true;
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
	project_id: AssignmentModel["project_id"],
	analysis_run_name: AssignmentModel["analysis_run_name"]
) {
	const stream = createProgressStream();

	if (url) {
		const validBlob = await validateBlobs([url]);
		if (!validBlob) {
			stream.error("File is not valid");
			stream.close();
			return stream.readable;
		}
	}

	doEdit(stream, url, editId, project_id, analysis_run_name).then((success) => {
		stream.close();

		if (url && !success) {
			del(url);
		}
	});

	return stream.readable;
}
