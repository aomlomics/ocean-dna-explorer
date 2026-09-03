"use server";

import type { OccurrenceModel } from "@/app/generated/prisma/models/Occurrence";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseOccurrencesFile } from "@/app/helpers/actions/analysis";
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
	project_id: OccurrenceModel["project_id"],
	analysis_run_name: OccurrenceModel["analysis_run_name"]
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
				project_id: true,
				occurrenceFileChecksum_ODE: true,
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

		const parseResult = await parseOccurrencesFile({
			channel: { stream, url },
			project_id: dbAnalysis.project_id,
			analysis_run_name,
			oldChecksum: dbAnalysis.occurrenceFileChecksum_ODE || undefined
		});
		if (!parseResult) {
			return;
		}
		const { occurrences, occurrencesMd5, libIds, featureids } = parseResult;

		await stream.message("Occurrences successfully parsed into database format. Parsing data into database.", 75);

		//edit
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
				}

				//check that lib_ids in occurrences are part of the project for this analysis AND they have the assay for this analysis
				const dbLibraries = await tx.library.findMany({
					where: {
						project_id,
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
				if (libIds.length !== dbLibraries.length) {
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
							throw new Error(
								`Some libraries in occurrence file are invalid. The invalid lib_ids are ${invalidLibIds
									.map((lib_id, i) => (i === invalidLibIds.length - 1 ? `and "${lib_id}"` : `"${lib_id}"`))
									.join(", ")}.`
							);
						}
					}
				}

				await stream.message("All checks passed.", 80);

				//get existing occurrence -> assignment relationships before updating occurrences
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

				//get assignments for features in the new occurrence file
				const assignments = await tx.assignment.findMany({
					where: {
						project_id,
						analysis_run_name,
						featureid: {
							in: featureids
						}
					},
					select: {
						featureid: true,
						taxonomy: true
					}
				});

				//map featureid -> taxonomy
				const taxaByFeat = Object.fromEntries(
					assignments.map((assign) => [assign.featureid, assign.taxonomy])
				) as Record<OccurrenceModel["featureid"], string>;

				//create new
				const newOccurrences = await tx.occurrence.createManyAndReturn({
					data: occurrences,
					skipDuplicates: true
				});

				await stream.message("New entries successfully added to database.", 85);

				//update old
				const getOccKey = (lib_id: OccurrenceModel["lib_id"], featureid: OccurrenceModel["featureid"]) =>
					//using null character as separator for efficient set lookup
					`${lib_id}\0${featureid}`;
				await updateManyRaw(
					tx,
					"occurrence",
					occurrences.filter(
						(occ) =>
							!new Set(newOccurrences.map((occ) => getOccKey(occ.lib_id, occ.featureid))).has(
								getOccKey(occ.lib_id, occ.featureid)
							)
					)
				);

				//map new lib_id -> taxonomy relationships
				const taxaByLibId = occurrences.reduce(
					(acc, occ) => {
						const taxonomy = taxaByFeat[occ.featureid];

						if (taxonomy) {
							(acc[occ.lib_id] ??= new Set()).add(taxonomy);
						}

						return acc;
					},
					{} as Record<OccurrenceModel["lib_id"], Set<string>>
				);

				//connect new Sample -> Taxonomy relationships
				await connectTaxaToSamples(tx, project_id, taxaByLibId);

				await stream.message("Existing entries successfully updated in database.", 90);

				//delete unused
				const currOccs = await tx.occurrence.findMany({
					where: {
						project_id,
						analysis_run_name
					},
					select: {
						id: true,
						lib_id: true,
						featureid: true
					}
				});

				const libIdSet = new Set(libIds);
				const featureidSet = new Set(featureids);
				const occToDelete = currOccs.reduce((acc, occ) => {
					if (!libIdSet.has(occ.lib_id) || !featureidSet.has(occ.featureid)) {
						acc.push(occ.id);
					}
					return acc;
				}, [] as number[]);

				await tx.occurrence.deleteMany({
					where: {
						project_id,
						analysis_run_name,
						id: {
							in: occToDelete
						}
					}
				});

				//map old occurrence relationships that were removed
				const occurrenceKeys = new Set(occurrences.map((occ) => `${occ.lib_id}\0${occ.featureid}`));
				const removedTaxaByLibId = oldOccurrences.reduce(
					(acc, occ) => {
						const key = `${occ.lib_id}\0${occ.featureid}`;

						if (!occurrenceKeys.has(key)) {
							(acc[occ.lib_id] ??= new Set()).add(occ.Assignment.taxonomy);
						}

						return acc;
					},
					{} as Record<OccurrenceModel["lib_id"], Set<string>>
				);

				//remove Sample -> Taxonomy relationships that don't exist in any analyses
				await disconnectTaxaFromSamples(tx, project_id, analysis_run_name, removedTaxaByLibId);

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
						project_id_analysis_run_name: {
							project_id,
							analysis_run_name
						}
					},
					data: {
						editHistory,
						occurrenceFileUrl_ODE: url,
						occurrenceFileChecksum_ODE: occurrencesMd5,
						Libraries: {
							set: libIds.map((lib_id) => ({
								project_id_lib_id: {
									project_id,
									lib_id
								}
							}))
						},
						Features: {
							set: featureids.map((featureid) => ({
								featureid
							}))
						}
					}
				});
			},
			{ timeout: 5 * 60 * 1000 }
		);

		await stream.success("Success");

		//update diversities
		fetch(
			`${process.env.NEXT_PUBLIC_SERVER_URL}/analysis/${project_id}/${analysis_run_name}/afterSubmission?delete=true&skipBlast=true`,
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

export default async function occEditAction(
	url: string,
	editId: string,
	project_id: OccurrenceModel["project_id"],
	analysis_run_name: OccurrenceModel["analysis_run_name"]
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
