"use server";

import { Project } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { Channel, createProgressStream } from "@/app/helpers/progress";
import { parseProjectFiles } from "@/app/helpers/actions/project";
import { addToHistory } from "@/app/helpers/actions/actions";
import { v4 as uuidv4 } from "uuid";
import { handlePrismaError, updateManyRaw } from "@/app/helpers/queries";
import { del } from "@vercel/blob";
import { validateBlobs } from "@/app/helpers/withDb";

async function doEdit(
	globalStream: ReturnType<typeof createProgressStream>,
	projectChannel: Channel,
	sampleChannel: Channel,
	libraryChannel: Channel,
	project_id: Project["project_id"]
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await globalStream.error("Unauthorized");
		return;
	}

	try {
		const missingProjectFile = !projectChannel.url;
		const missingSampleFile = !sampleChannel.url;
		const missingLibraryFile = !libraryChannel.url;

		const dbProject = await prisma.project.findUnique({
			where: {
				project_id
			},
			select: {
				imageFileUrl_ODE: true,
				userIds: true,
				editHistory: true,
				projectMetadataFileUrl_ODE: true,
				projectMetadataFileChecksum_ODE: true,
				sampleMetadataFileUrl_ODE: true,
				sampleMetadataFileChecksum_ODE: true,
				libraryMetadataFileUrl_ODE: true,
				libraryMetadataFileChecksum_ODE: true,
				_count: {
					select: {
						Analyses: true
					}
				}
			}
		});

		if (!dbProject) {
			await globalStream.error(`No Project with project_id of "${project_id}" found.`);
			return;
		} else if (!dbProject.userIds.includes(userId)) {
			await globalStream.error("Unauthorized action.");
			return;
		}

		//retrieve files that were not provided
		const oldChecksums = {
			projectMd5: dbProject.projectMetadataFileChecksum_ODE,
			sampleMd5: dbProject.sampleMetadataFileChecksum_ODE,
			libraryMd5: dbProject.libraryMetadataFileChecksum_ODE
		} as {
			projectMd5?: string;
			sampleMd5?: string;
			libraryMd5?: string;
		};
		if (missingProjectFile) {
			projectChannel.url = dbProject.projectMetadataFileUrl_ODE;
			delete oldChecksums.projectMd5;
		}
		if (missingSampleFile) {
			sampleChannel.url = dbProject.sampleMetadataFileUrl_ODE;
			delete oldChecksums.sampleMd5;
		}
		if (missingLibraryFile) {
			libraryChannel.url = dbProject.libraryMetadataFileUrl_ODE;
			delete oldChecksums.libraryMd5;
		}

		const parseResult = await parseProjectFiles({
			projectChannel,
			sampleChannel,
			libraryChannel,
			userIds: dbProject.userIds,
			oldChecksums
		});
		if (!parseResult) {
			return;
		}
		const { project, assays, assayPreps, samples, libraries, checksums } = parseResult;

		await projectChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);
		await sampleChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);
		await libraryChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);

		const sampNames = samples.map((samp) => samp.samp_name);

		const badAssayFields = {} as Record<string, { field: string; provided: any; actual: any }[]>;

		//TODO: only do updates if relevant file was provided
		//error checks
		const dbAssays = await prisma.assay.findMany({
			where: {
				assay_name: {
					in: assays.map((a) => a.assay_name)
				}
			}
		});

		//check if assay data is correct
		for (const a of assays) {
			const dbA = dbAssays.find((db) => a.assay_name === db.assay_name);

			if (!dbA) {
				//assay does not exist
				await projectChannel.stream.error(`Assay with assay_name of "${a.assay_name}" does not exist.`);
				throw new Error(`Assay with assay_name of "${a.assay_name}" does not exist.`);
			} else if (dbA.pcr_primer_forward !== a.pcr_primer_forward) {
				//assay has incorrect pcr_primer_forward
				await projectChannel.stream.error(
					`Assay with assay_name of "${a.assay_name}" does not have the correct pcr_primer_forward. It should be "${a.pcr_primer_forward}", but it has "${dbA.pcr_primer_forward}".`
				);
				throw new Error(
					`Assay with assay_name of "${a.assay_name}" does not have the correct pcr_primer_forward. It should be "${a.pcr_primer_forward}", but it has "${dbA.pcr_primer_forward}".`
				);
			} else if (dbA.pcr_primer_reverse !== a.pcr_primer_reverse) {
				//assay has incorrect pcr_primer_reverse
				await projectChannel.stream.error(
					`Assay with assay_name of "${a.assay_name}" does not have the correct pcr_primer_reverse. It should be "${a.pcr_primer_reverse}", but it has "${dbA.pcr_primer_reverse}".`
				);
				throw new Error(
					`Assay with assay_name of "${a.assay_name}" does not have the correct pcr_primer_reverse. It should be "${a.pcr_primer_reverse}", but it has "${dbA.pcr_primer_reverse}".`
				);
			} else {
				//get all non-essential fields that do not match
				for (const [f, value] of Object.entries(a)) {
					const field = f as keyof (typeof dbAssays)[0];
					if (value !== dbA[field]) {
						const fields = (badAssayFields[a.assay_name] ??= []);
						fields.push({ field, provided: value, actual: dbA[field] });
					}
				}
			}
		}

		await projectChannel.stream.message("All checks passed.", 80);

		await sampleChannel.stream.message("All checks passed.", 80);

		await libraryChannel.stream.message("All checks passed.", 80);

		//assemble edit history
		const change = [] as PrismaJson.ChangesType;
		if (!missingProjectFile) {
			change.push(
				{
					field: "projectMetadataFileUrl_ODE",
					oldValue: dbProject.projectMetadataFileUrl_ODE,
					newValue: projectChannel.url
				},
				{
					field: "projectMetadataFileChecksum_ODE",
					oldValue: dbProject.projectMetadataFileChecksum_ODE,
					newValue: checksums.projectMd5
				}
			);
		}

		if (!missingSampleFile) {
			change.push(
				{
					field: "sampleMetadataFileUrl_ODE",
					oldValue: dbProject.sampleMetadataFileUrl_ODE,
					newValue: sampleChannel.url
				},
				{
					field: "sampleMetadataFileChecksum_ODE",
					oldValue: dbProject.sampleMetadataFileChecksum_ODE,
					newValue: checksums.sampleMd5
				}
			);
		}

		if (!missingLibraryFile) {
			change.push(
				{
					field: "libraryMetadataFileUrl_ODE",
					oldValue: dbProject.libraryMetadataFileUrl_ODE,
					newValue: libraryChannel.url
				},
				{
					field: "libraryMetadataFileChecksum_ODE",
					oldValue: dbProject.libraryMetadataFileChecksum_ODE,
					newValue: checksums.libraryMd5
				}
			);
		}

		const editHistory = addToHistory("project", uuidv4(), dbProject.editHistory, change);

		//edit
		await prisma.$transaction(
			async (tx) => {
				//update project
				await tx.project.update({
					where: {
						project_id
					},
					data: { ...project, editHistory }
				});

				//assayPreps
				let i = 0;
				for (const prep of assayPreps) {
					await tx.assayPrep.upsert({
						where: {
							project_id_assay_name: {
								project_id: prep.project_id,
								assay_name: prep.assay_name
							}
						},
						update: prep,
						create: prep
					});

					i++;
					await projectChannel.stream.message(
						`AssayPrep with nucl_acid_amp of "${prep.nucl_acid_amp}" successfully updated in database.`,
						85 + (5 / assayPreps.length) * i
					);
				}

				await projectChannel.stream.success("Project file successfully updated in database.");

				//add new
				//samples
				const newSamples = await tx.sample.createManyAndReturn({
					data: samples,
					skipDuplicates: true,
					select: {
						samp_name: true
					}
				});
				await sampleChannel.stream.message("New Samples successfully added to database.", 90);

				//libraries
				const newLibraries = await tx.library.createManyAndReturn({
					data: libraries,
					skipDuplicates: true,
					select: {
						lib_id: true
					}
				});
				await libraryChannel.stream.message("New Libraries successfully added to database.", 90);

				//update old
				//samples
				await updateManyRaw(
					tx,
					"Sample",
					samples.filter((samp) => !newSamples.some((dbSamp) => dbSamp.samp_name === samp.samp_name)),
					"samp_name"
				);
				await sampleChannel.stream.message("Existing Samples successfully updated in database.", 93);

				//libraries
				await updateManyRaw(
					tx,
					"Library",
					libraries.filter((lib) => !newLibraries.some((dbLib) => dbLib.lib_id === lib.lib_id)),
					"lib_id"
				);
				await libraryChannel.stream.message("Existing Libraries successfully updated in database.", 93);

				//delete unused
				//samples
				//get samples to flag as deleted
				const occsWithDeletedSamps = await tx.occurrence.findMany({
					where: {
						project_id,
						Library: {
							samp_name: {
								notIn: sampNames
							}
						}
					},
					select: {
						analysis_run_name: true,
						Library: {
							select: {
								samp_name: true
							}
						}
					}
				});
				const samplesToDelete = Array.from(new Set(occsWithDeletedSamps.map((occ) => occ.Library.samp_name)));

				//delete samples that were removed and don't need to be flagged
				await tx.sample.deleteMany({
					where: {
						project_id,
						samp_name: {
							notIn: [...sampNames, ...samplesToDelete]
						}
					}
				});

				let sampleSuccessMsg = "Sample file successfully updated in database.";
				if (samplesToDelete.length) {
					//update samples to be marked as deleted
					await tx.sample.updateMany({
						where: {
							project_id,
							samp_name: {
								in: samplesToDelete
							}
						},
						data: {
							deleted_ODE: true
						}
					});

					//retrieve all unique analyses
					const analysesToUpdate = Array.from(new Set(occsWithDeletedSamps.map((occ) => occ.analysis_run_name)));

					//TODO: sort the samples by analysis in response
					//notify user of analyses that need to be fixed
					if (analysesToUpdate.length) {
						const lastSample = samplesToDelete.pop();
						const lastAnalysis = analysesToUpdate.pop();

						sampleSuccessMsg += ` ${
							//plural Sample
							samplesToDelete.length ? "Samples" : "Sample"
						} to delete with the ${
							//plural samp_name
							samplesToDelete.length ? "samp_names" : "samp_name"
						} of${
							//list of samp_names
							samplesToDelete.length > 1
								? //at least 3
									' "' + samplesToDelete.join('", "') + '", and'
								: samplesToDelete.length === 1
									? //exactly 2
										' "' + samplesToDelete[0] + '" and'
									: //exactly 1
										""
						} "${lastSample}" ${
							//plural
							samplesToDelete.length ? "have" : "has"
						} Occurrences and can't be deleted. Please remove ${
							//plural Sample
							samplesToDelete.length ? "these Samples" : "this Sample"
						} from the ${
							//plural Analysis
							analysesToUpdate.length ? "Analyses" : "Analysis"
						} with the ${
							//plural analysis_run_name
							analysesToUpdate.length ? "analysis_run_names" : "analysis_run_name"
						} of${
							//list of analysis_run_names
							analysesToUpdate.length > 1
								? // at least 3
									' "' + analysesToUpdate.join('", "') + '", and'
								: analysesToUpdate.length === 1
									? //exactly 2
										' "' + analysesToUpdate[0] + '" and'
									: //exactly 1
										""
						} "${lastAnalysis}". Then, click the "Fix" button on the Project with project_id of "${project_id}".`; //TODO: change name of button to match the UI
					}
				}

				await sampleChannel.stream.success(sampleSuccessMsg);

				//libraries
				await tx.library.deleteMany({
					where: {
						project_id,
						lib_id: {
							notIn: libraries.map((lib) => lib.lib_id)
						}
					}
				});

				await libraryChannel.stream.success("Library file successfully updated in database.");

				await globalStream.success("All files successfully updated.");
			},
			{ timeout: 3 * 60 * 1000 } //3 minutes
		);

		return true;
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			await globalStream.error(prismaErr.error);
		} else {
			const error = err as Error;
			await globalStream.error(error.message);
		}
	}
}

export default async function projectEditAction({
	project_id,
	projectFileUrl,
	sampleFileUrl,
	libraryFileUrl
}: {
	project_id: Project["project_id"];
	projectFileUrl?: Project["projectMetadataFileUrl_ODE"];
	sampleFileUrl?: Project["sampleMetadataFileUrl_ODE"];
	libraryFileUrl?: Project["libraryMetadataFileUrl_ODE"];
}) {
	const globalStream = createProgressStream();
	const projectStream = createProgressStream();
	const sampleStream = createProgressStream();
	const libraryStream = createProgressStream();

	let errorMsg;
	const urls = [projectFileUrl, sampleFileUrl, libraryFileUrl].filter(Boolean) as string[];
	const validBlobs = await validateBlobs(urls);
	if (!urls.length) {
		errorMsg = "Must provide at least one new file.";
	} else if (!validBlobs) {
		errorMsg = "Files are not valid";
	}
	if (errorMsg) {
		globalStream.error(errorMsg);

		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();

		return {
			global: globalStream.readable,
			readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
		};
	}

	doEdit(
		globalStream,
		{ url: projectFileUrl || "", stream: projectStream },
		{ url: sampleFileUrl || "", stream: sampleStream },
		{ url: libraryFileUrl || "", stream: libraryStream },
		project_id
	).then((success) => {
		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();

		if (!success) {
			del([projectFileUrl, sampleFileUrl, libraryFileUrl].filter(Boolean) as string[]);
		}
	});

	return {
		global: globalStream.readable,
		readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
	};
}
