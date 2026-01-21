"use server";

import { Occurrence } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseOccurrencesFile } from "@/app/helpers/actions/analysis";
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

		const parseResult = await parseOccurrencesFile({
			channel: { stream, url },
			analysis_run_name,
			oldChecksum: dbAnalysis.occurrenceFileChecksum_ODE || undefined
		});
		if (!parseResult) {
			return;
		}
		const { occurrences, occurrencesMd5 } = parseResult;

		await stream.message("Occurrences successfully parsed into database format. Parsing data into database.", 75);

		const occLibIds = occurrences.map((occ) => occ.lib_id);
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
						assay_name: true,
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

				//check that lib_ids in occurrences are part of the project for this analysis AND they have the assay for this analysis
				const libIds = new Set() as Set<Occurrence["lib_id"]>;
				for (const occ of occurrences) {
					libIds.add(occ.lib_id);
				}
				const dbLibraries = await tx.library.findMany({
					where: {
						project_id: dbAnalysis.project_id,
						assay_name: dbAnalysis.assay_name,
						lib_id: {
							in: Array.from(libIds)
						}
					},
					select: {
						lib_id: true
					}
				});

				//check if any provided libraries are missing from database query
				if (libIds.size !== dbLibraries.length) {
					const invalidLibIds = [] as string[];
					for (const lib_id of libIds) {
						if (!dbLibraries.some((lib) => lib.lib_id === lib_id)) {
							invalidLibIds.push(lib_id);
						}
					}

					if (invalidLibIds.length) {
						if (invalidLibIds.length === 1) {
							throw new Error(`A library in occurrence file is invalid. The invalid lib_id is "${invalidLibIds[0]}".`);
						} else {
							//TODO: length === 2 should have no comma
							throw new Error(
								`Some libraries in occurrence file are invalid. The invalid lib_ids are ${invalidLibIds
									.map((lib_id, i) => (i === invalidLibIds.length - 1 ? `and "${lib_id}"` : `"${lib_id}"`))
									.join(", ")}.`
							);
						}
					}
				}

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
						(occ) => !newOccurrences.some((dbOcc) => dbOcc.lib_id === occ.lib_id && dbOcc.featureid === occ.featureid)
					),
					["analysis_run_name", "lib_id", "featureid"]
				);

				await stream.message("Existing entries successfully updated in database.", 90);

				//delete unused
				const currOccs = await tx.occurrence.findMany({
					where: {
						analysis_run_name
					},
					select: {
						id: true,
						lib_id: true,
						featureid: true
					}
				});

				const occToDelete = currOccs.reduce((acc, occ) => {
					if (!occLibIds.includes(occ.lib_id) || !occFeatureids.includes(occ.featureid)) {
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
						newValue: occurrencesMd5
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
						occurrenceFileChecksum_ODE: occurrencesMd5
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
