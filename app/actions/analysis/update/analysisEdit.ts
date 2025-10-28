"use server";

import { Analysis } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseAnalysisFile } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doEdit(
	stream: ProgressStream,
	url: string,
	editId: string,
	analysis_run_name: Analysis["analysis_run_name"],
	isPrivate?: boolean
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
				asvFileUrl_ODE: true,
				occurrenceFileUrl_ODE: true,
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

		const parseResult = await parseAnalysisFile({
			channel: { stream, url },
			assignmentsUrl: dbAnalysis.asvFileUrl_ODE,
			occurrencesUrl: dbAnalysis.occurrenceFileUrl_ODE,
			isPrivate,
			oldChecksum: dbAnalysis.analysisMetadataFileChecksum_ODE
		});
		if (!parseResult) {
			return;
		}
		const { analysis, analysisMd5 } = parseResult;

		await stream.message("Analysis successfully parsed into database format. Parsing data into database.", 50);

		await prisma.$transaction(
			async (tx) => {
				//check if the associated project is private, and throw an error if it is private but the submission is public
				const project = await tx.project.findUnique({
					where: {
						project_id: analysis.project_id
					},
					select: {
						isPrivate: true,
						userIds: true
					}
				});
				if (!project) {
					throw new Error(`Project with project_id of ${analysis.project_id} does not exist.`);
				} else if (!project.userIds.includes(userId)) {
					throw new Error(
						`Permission denied for editing analysis with Project with project_id of ${analysis.project_id}. Please contact submission owner with a request to be added to the Project.`
					);
				} else if (project.isPrivate && !isPrivate) {
					throw new Error(
						`Project with project_id of ${analysis.project_id} is private. Analyses can't be public if the associated project is private.`
					);
				}

				const dbAnalysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						analysisMetadataFileUrl_ODE: true,
						analysisMetadataFileChecksum_ODE: true,
						isPrivate: true,
						editHistory: true
					}
				});

				if (!dbAnalysis) {
					throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
				}

				await stream.message("All checks passed.", 80);

				const editHistory = addToHistory("analysis", editId, dbAnalysis.editHistory, [
					{
						field: "analysisMetadataFileUrl_ODE",
						oldValue: dbAnalysis.analysisMetadataFileUrl_ODE,
						newValue: url
					},
					{
						field: "analysisMetadataFileChecksum_ODE",
						oldValue: dbAnalysis.analysisMetadataFileChecksum_ODE,
						newValue: analysisMd5
					}
				]);

				//update analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						...analysis,
						editHistory,
						isPrivate: isPrivate === undefined ? dbAnalysis.isPrivate : isPrivate
					}
				});

				await stream.success("Analysis file successfully updated in database.");
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
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

export default async function analysisEditAction(
	url: string,
	editId: string,
	analysis_run_name: Analysis["analysis_run_name"],
	isPrivate?: boolean
) {
	const stream = createProgressStream();

	doEdit(stream, url, editId, analysis_run_name, isPrivate).then(stream.close);

	return stream.readable;
}
