"use server";

import { Occurrence, Sample } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { handlePrismaError } from "@/app/helpers/queries";
import { ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

export default async function fixDeletedSamplesAction(project_id: Sample["project_id"]): Promise<NetworkPacket> {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const parsed = ProjectSchema.shape.project_id.safeParse(project_id);
	if (!parsed.success) {
		return {
			statusMessage: "error",
			error: parsed.error.issues ? parsed.error.issues.map((issue) => issue.message).join(" ") : "Invalid project_id"
		};
	}

	try {
		await prisma.$transaction(async (tx) => {
			const project = await tx.project.findUnique({
				where: {
					project_id
				},
				select: {
					userIds: true
				}
			});

			if (!project) {
				throw new Error(`No Project with project_id of "${project_id}" found.`);
			} else if (!project.userIds.includes(userId) && (!role || !RolePermissions[role].includes("manageUsers"))) {
				throw new Error("Unauthorized action.");
			}

			//check if analyses with deleted samples were properly fixed
			const badSamples = await tx.sample.findMany({
				where: {
					project_id,
					deleted_ODE: true,
					Libraries: {
						some: {
							Occurrences: {
								some: {}
							}
						}
					}
				},
				select: {
					samp_name: true,
					Libraries: {
						select: {
							Occurrences: {
								distinct: ["analysis_run_name"]
							}
						}
					}
				}
			});

			if (badSamples.length) {
				const sampNames = badSamples.map((samp) => samp.samp_name);
				const lastSample = sampNames.pop();
				const badAnalyses = Array.from(
					badSamples.reduce((acc, samp) => {
						for (const occ of samp.Libraries.reduce((occs, lib) => [...occs, ...lib.Occurrences], [] as Occurrence[])) {
							acc.add(occ.analysis_run_name);
						}
						return acc;
					}, new Set())
				) as string[];
				const lastAnalysis = badAnalyses.pop();

				if (!lastSample || !lastAnalysis) {
					throw new Error("Unknown error when parsing Samples to delete.");
				}

				throw new Error(
					`${
						//plural Sample
						sampNames.length ? "Samples" : "Sample"
					} with the ${
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
						badAnalyses.length ? "Analyses" : "Analysis"
					} with the ${
						//plural analysis_run_name
						badAnalyses.length ? "analysis_run_names" : "analysis_run_name"
					} of${
						//list of analysis_run_names
						badAnalyses.length > 1
							? // at least 3
								' "' + badAnalyses.join('", "') + '", and'
							: badAnalyses.length === 1
								? //exactly 2
									' "' + badAnalyses[0] + '" and'
								: //exactly 1
									""
					} "${lastAnalysis}". Then, click the "Fix" button on the Project with project_id of "${project_id}".`
				);
			}

			//delete samples
			await tx.sample.deleteMany({
				where: {
					project_id,
					deleted_ODE: true,
					//TODO: confirm that this isn't necessary
					Libraries: {
						every: {
							Occurrences: {
								none: {}
							}
						}
					}
				}
			});

			//TODO: confirm that this isn't necessary
			//double check
			const thisShouldNeverHappen = await tx.sample.findMany({
				where: {
					project_id,
					deleted_ODE: true
				},
				select: {
					samp_name: true
				}
			});
			if (thisShouldNeverHappen.length) {
				throw new Error("This should never happen.");
			}
		});

		return { statusMessage: "success" };
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			return prismaErr;
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
