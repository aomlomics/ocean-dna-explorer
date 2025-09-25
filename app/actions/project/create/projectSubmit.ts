"use server";

import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { auth } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { createProgressStream } from "@/app/helpers/progress";
import { Channel, parseProjectFiles } from "@/app/helpers/actions/project";

async function doSubmit(
	globalStream: ReturnType<typeof createProgressStream>,
	projectChannel: Channel,
	sampleChannel: Channel,
	libraryChannel: Channel,
	userIds: string[],
	isPrivate: boolean
) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await globalStream.error("Unauthorized");
		return;
	}

	if (!userIds.includes(userId)) {
		await globalStream.error("Must include self as a user.");
		return;
	}

	try {
		const parseResult = await parseProjectFiles({ projectChannel, sampleChannel, libraryChannel, userIds, isPrivate });
		if (!parseResult) {
			return;
		}
		const { project, primers, assays, samplesByAssay, libraries } = parseResult;

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

		await prisma.$transaction(
			async (tx) => {
				await tx.project.create({
					data: project
				});

				for (let p of primers) {
					await tx.primer.upsert({
						where: {
							pcr_primer_forward_pcr_primer_reverse: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							}
						},
						update: {},
						create: p
					});
				}

				await projectChannel.stream.success("Project successfully uploaded to database.");

				for (let a of assays) {
					await tx.assay.upsert({
						where: {
							assay_name: a.assay_name
						},
						update: {
							Samples: {
								connectOrCreate: samplesByAssay[a.assay_name]
							}
						},
						create: {
							...a,
							Samples: {
								connectOrCreate: samplesByAssay[a.assay_name]
							}
						}
					});
				}

				await sampleChannel.stream.success("Samples successfully uploaded to database.");

				await tx.library.createMany({
					data: libraries,
					skipDuplicates: true
				});

				await libraryChannel.stream.success("Libraries successfully uploaded to database.");
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		await globalStream.success("Success");
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

export default async function projectSubmitAction(
	projectFileUrl: string,
	sampleFileUrl: string,
	libraryFileUrl: string,
	userIds: string[],
	isPrivate: boolean
) {
	const globalStream = createProgressStream();
	const projectStream = createProgressStream();
	const sampleStream = createProgressStream();
	const libraryStream = createProgressStream();

	if (typeof projectFileUrl !== "string" || typeof sampleFileUrl !== "string" || typeof libraryFileUrl !== "string") {
		await globalStream.error("Arguments are not of correct type");

		await globalStream.close();
		await projectStream.close();
		await sampleStream.close();
		await libraryStream.close();

		return {
			global: globalStream.readable,
			readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
		};
	}

	doSubmit(
		globalStream,
		{ url: projectFileUrl, stream: projectStream },
		{ url: sampleFileUrl, stream: sampleStream },
		{ url: libraryFileUrl, stream: libraryStream },
		userIds,
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
