"use server";

import { parseAnalysisFile } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doSubmit(stream: ProgressStream, url: string, isPrivate: boolean) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		//TODO: use checksum to see if new file submitted match old file
		const parseResult = await parseAnalysisFile({ stream, url, isPrivate });
		if (!parseResult) {
			return;
		}
		const { analysis } = parseResult;

		await stream.message("Analysis successfully parsed into database format. Parsing data into database.", 50);

		await prisma.$transaction(async (tx) => {
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
					`Permission denied for adding analysis to Project with project_id of ${analysis.project_id}. Please contact submission owner with a request to be added to the Project.`
				);
			} else if (project.isPrivate && !isPrivate) {
				throw new Error(
					`Project with project_id of ${analysis.project_id} is private. Analyses can't be public if the associated project is private.`
				);
			}

			await tx.analysis.create({
				//@ts-ignore issue with Json database type
				data: analysis
			});
		});

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

export default async function analysisSubmitAction(url: string, isPrivate: boolean) {
	const stream = createProgressStream();

	doSubmit(stream, url, isPrivate).then(stream.close);

	return stream.readable;
}
