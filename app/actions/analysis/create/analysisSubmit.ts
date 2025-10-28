"use server";

import { parseAnalysisFiles } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { Channel, createProgressStream } from "@/app/helpers/progress";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doSubmit(
	analysisChannel: Channel,
	assignmentsChannel: Channel,
	occurrencesChannel: Channel,
	isPrivate: boolean
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await analysisChannel.stream.error("Unauthorized");
		return;
	}

	try {
		const parseResult = await parseAnalysisFiles({
			analysisChannel,
			assignmentsChannel,
			occurrencesChannel,
			isPrivate
		});
		if (!parseResult) {
			return;
		}
		const { analysis, features, taxonomies, assignments, occurrences } = parseResult;

		await analysisChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);
		await assignmentsChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);
		await occurrencesChannel.stream.message(
			"All files successfully parsed into database format. Parsing data into database.",
			75
		);

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

				await analysisChannel.stream.success("Analysis sucessfully uploaded to database.");

				//upload to database
				//features
				await tx.feature.createMany({
					data: features,
					skipDuplicates: true
				});

				await assignmentsChannel.stream.message("Features successfully uploaded to database.", 80);

				//taxonomies
				await tx.taxonomy.createMany({
					data: taxonomies,
					skipDuplicates: true
				});

				await assignmentsChannel.stream.message("Taxonomies successfully uploaded to database.", 85);

				//assignments
				await tx.assignment.createMany({
					data: assignments
				});

				await assignmentsChannel.stream.success(
					"Features, Taxonomies, and Assignments successfully uploaded to database."
				);

				//occurrences
				await tx.occurrence.createMany({
					data: occurrences
				});

				await occurrencesChannel.stream.success("Occurrences successfully uploaded to database.");
			},
			{ timeout: 3 * 60 * 1000 }
		);
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			await analysisChannel.stream.error(prismaErr.error);
			await assignmentsChannel.stream.error(prismaErr.error);
			await occurrencesChannel.stream.error(prismaErr.error);
		} else {
			const error = err as Error;
			await analysisChannel.stream.error(error.message);
			await assignmentsChannel.stream.error(error.message);
			await occurrencesChannel.stream.error(error.message);
		}
	}
}

export default async function analysisSubmitAction(
	analysisFileUrl: string,
	assignmentsFileUrl: string,
	occurrencesFileUrl: string,
	isPrivate: boolean
) {
	const analysisStream = createProgressStream();
	const assignmentsStream = createProgressStream();
	const occurrencesStream = createProgressStream();

	if (
		typeof analysisFileUrl !== "string" ||
		typeof assignmentsFileUrl !== "string" ||
		typeof occurrencesFileUrl !== "string"
	) {
		await analysisStream.error("Arguments are not of correct type");
		await assignmentsStream.error("Arguments are not of correct type");
		await occurrencesStream.error("Arguments are not of correct type");

		await analysisStream.close();
		await assignmentsStream.close();
		await occurrencesStream.close();

		return [analysisStream.readable, assignmentsStream.readable, occurrencesStream.readable];
	}

	doSubmit(
		{ url: analysisFileUrl, stream: analysisStream },
		{ url: assignmentsFileUrl, stream: assignmentsStream },
		{ url: occurrencesFileUrl, stream: occurrencesStream },
		isPrivate
	).then(() => {
		analysisStream.close();
		assignmentsStream.close();
		occurrencesStream.close();
	});

	return [analysisStream.readable, assignmentsStream.readable, occurrencesStream.readable];
}
