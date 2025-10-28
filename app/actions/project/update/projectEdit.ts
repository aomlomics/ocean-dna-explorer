"use server";

import { Project } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { Channel, createProgressStream } from "@/app/helpers/progress";
import { parseProjectFiles } from "@/app/helpers/actions/project";
import { addToHistory } from "@/app/helpers/actions/actions";
import { v4 as uuidv4 } from "uuid";

async function doEdit(
	globalStream: ReturnType<typeof createProgressStream>,
	projectChannel: Channel,
	sampleChannel: Channel,
	libraryChannel: Channel,
	project_id: Project["project_id"],
	isPrivate?: boolean
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
				projectMetadataFileUrl_ODE: missingProjectFile,
				sampleMetadataFileUrl_ODE: missingSampleFile,
				libraryMetadataFileUrl_ODE: missingLibraryFile,
				projectMetadataFileChecksum_ODE: true,
				sampleMetadataFileChecksum_ODE: true,
				libraryMetadataFileChecksum_ODE: true,
				userIds: true,
				isPrivate: true
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
			isPrivate: isPrivate === undefined ? dbProject.isPrivate : isPrivate,
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
		await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbProject = await tx.project.findUnique({
					where: {
						project_id
					},
					select: {
						userIds: true,
						editHistory: true,
						isPrivate: true,
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
					throw new Error(`No Project with project_id of "${project_id}" found.`);
				} else if (!dbProject.userIds.includes(userId)) {
					throw new Error("Unauthorized action.");
				}

				for (const a of assays) {
					const dbAssay = await tx.assay.findUnique({
						where: {
							assay_name: a.assay_name
						}
					});

					if (!dbAssay) {
						await projectChannel.stream.error(`Assay with assay_name of "${a.assay_name}" does not exist.`);
						throw new Error(`Assay with assay_name of "${a.assay_name}" does not exist.`);
					}

					for (const [f, value] of Object.entries(a)) {
						const field = f as keyof typeof dbAssay;
						if (value !== dbAssay[field]) {
							if (!(a.assay_name in badAssayFields)) {
								badAssayFields[a.assay_name] = [];
							}
							badAssayFields[a.assay_name].push({ field, provided: value, actual: dbAssay[field] });
							// throw new Error(
							// 	`Provided Assay with assay_name of "${a.assay_name}" has an invalid value for field named "${field}". Provided value is "${value}", but it should be "${dbAssay[field]}".`
							// );
						}
					}
				}

				for (const prep of assayPreps) {
					const dbMeta = await tx.assayPrep.findUnique({
						where: {
							project_id_assay_name: {
								project_id: prep.project_id,
								assay_name: prep.assay_name
							}
						},
						select: {
							Project: {
								select: {
									userIds: true
								}
							}
						}
					});

					if (dbMeta && !dbMeta.Project.userIds.includes(userId)) {
						await projectChannel.stream.error("Unauthorized action.");
						throw new Error("Unauthorized action.");
					}
				}

				await projectChannel.stream.message("All checks passed.", 80);

				const dbSamples = await tx.sample.findMany({
					where: {
						samp_name: {
							in: sampNames
						}
					},
					select: {
						project_id: true
					}
				});

				if (dbSamples.some((samp) => samp.project_id !== project_id)) {
					await sampleChannel.stream.error(
						`Some Sample in file does not belong to Project with project_id of "${project_id}".`
					);
					throw new Error(`Some Sample in file does not belong to Project with project_id of "${project_id}".`);
				}

				await sampleChannel.stream.message("All checks passed.", 80);

				const dbLibraries = await tx.library.findMany({
					where: {
						lib_id: {
							in: libraries.map((lib) => lib.lib_id)
						}
					},
					select: {
						Sample: {
							select: {
								project_id: true
							}
						}
					}
				});

				if (dbLibraries.some((lib) => lib.Sample.project_id !== project_id)) {
					await libraryChannel.stream.error(
						`Some Library in file does not belong to Project with project_id of "${project_id}".`
					);
					throw new Error(`Some Library in file does not belong to Project with project_id of "${project_id}".`);
				}

				await libraryChannel.stream.message("All checks passed.", 80);

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

				//update project
				await tx.project.update({
					where: {
						project_id
					},
					data: { ...project, editHistory }
				});

				//assayPreps
				let i = 0;
				for (let prep of assayPreps) {
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
				await tx.sample.deleteMany({
					where: {
						project_id,
						samp_name: {
							notIn: sampNames
						},
						Occurrences: {
							none: {}
						}
					}
				});

				//check if any samples need to be flagged as deleted
				const samplesToDelete = await tx.sample.findMany({
					where: {
						project_id,
						samp_name: {
							notIn: sampNames
						},
						Occurrences: {
							some: {}
						}
					},
					select: {
						id: true,
						samp_name: true,
						Occurrences: {
							distinct: ["analysis_run_name"],
							select: {
								analysis_run_name: true
							}
						}
					}
				});

				let sampleSuccessMsg = "Sample file successfully updated in database.";
				if (samplesToDelete.length) {
					//update samples to be marked as deleted
					await tx.sample.updateMany({
						where: {
							id: {
								in: samplesToDelete.map((samp) => samp.id)
							}
						},
						data: {
							deleted_ODE: true
						}
					});

					//retrieve all unique analyses
					const analysesToUpdate = Array.from(
						samplesToDelete.reduce((acc, samp) => {
							for (const occ of samp.Occurrences) {
								acc.add(occ.analysis_run_name);
							}
							return acc;
						}, new Set())
					) as string[];

					//notify user of analyses that need to be fixed
					if (analysesToUpdate.length) {
						const sampNames = samplesToDelete.map((samp) => samp.samp_name);
						const lastSample = sampNames.pop();
						const lastAnalysis = analysesToUpdate.pop();

						sampleSuccessMsg += ` ${
							//plural Sample
							sampNames.length ? "Samples" : "Sample"
						} to delete with the ${
							//plural samp_name
							sampNames.length ? "samp_names" : "samp_name"
						} of${
							//list of samp_names
							sampNames.length > 1
								? //at least 3
								  ' "' + sampNames.join('", "') + '", and'
								: sampNames.length === 1
								? //exactly 2
								  ' "' + sampNames[0] + '" and'
								: //exactly 1
								  ""
						} "${lastSample}" ${
							//plural
							sampNames.length ? "have" : "has"
						} Occurrences and can't be deleted. Please remove ${
							//plural Sample
							sampNames.length ? "these Samples" : "this Sample"
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
						Sample: {
							project_id
						},
						lib_id: {
							notIn: libraries.map((lib) => lib.lib_id)
						}
					}
				});

				await libraryChannel.stream.success("Library file successfully updated in database.");

				await globalStream.success("All files successfully updated.");
			},
			{ timeout: 1.5 * 60 * 1000 } //90 seconds
		);
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

export default async function projectEditAction(
	{
		projectFileUrl,
		sampleFileUrl,
		libraryFileUrl
	}: { projectFileUrl?: string; sampleFileUrl?: string; libraryFileUrl?: string },
	project_id: Project["project_id"],
	isPrivate?: boolean
) {
	const globalStream = createProgressStream();
	const projectStream = createProgressStream();
	const sampleStream = createProgressStream();
	const libraryStream = createProgressStream();

	if (!projectFileUrl && !sampleFileUrl && !libraryFileUrl) {
		await globalStream.error("Must provide at least one new file.");

		await globalStream.close();
		await projectStream.close();
		await sampleStream.close();
		await libraryStream.close();

		return {
			global: globalStream.readable,
			readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
		};
	}

	if (
		(projectFileUrl && typeof projectFileUrl !== "string") ||
		(sampleFileUrl && typeof sampleFileUrl !== "string") ||
		(libraryFileUrl && typeof libraryFileUrl !== "string")
	) {
		await globalStream.error("Arguments are not of correct type.");

		await globalStream.close();
		await projectStream.close();
		await sampleStream.close();
		await libraryStream.close();

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
		project_id,
		isPrivate
	).then(() => {
		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();
	});

	return {
		global: globalStream.readable,
		readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
	};
}
