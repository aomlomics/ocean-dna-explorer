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
		const { project, assays, assayMetadatas, samplesByAssay, libraries } = parseResult;

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

		const badAssayFields = {} as Record<string, { field: string; provided: any; actual: any }[]>;

		await prisma.$transaction(
			async (tx) => {
				//check if assay data is correct
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
							// await projectChannel.stream.error(
							// 	`Provided Assay with assay_name of "${a.assay_name}" has an invalid value for field named "${field}". Provided value is "${value}", but it should be "${dbAssay[field]}".`
							// );
							// throw new Error(
							// 	`Provided Assay with assay_name of "${a.assay_name}" has an invalid value for field named "${field}". Provided value is "${value}", but it should be "${dbAssay[field]}".`
							// );
						}
					}
				}

				await projectChannel.stream.message("All checks successful.", 85);

				await tx.project.create({
					data: project
				});

				await tx.assayMetadata.createMany({
					data: assayMetadatas
				});

				await projectChannel.stream.success("Project and AssayMetadatas successfully uploaded to database.");

				for (const a of assays) {
					await tx.assay.update({
						where: {
							assay_name: a.assay_name
						},
						data: {
							Samples: {
								connectOrCreate: samplesByAssay[a.assay_name]
							}
						}
					});
				}

				await sampleChannel.stream.success("Samples successfully uploaded to database.");

				await tx.library.createMany({
					data: libraries
				});

				await libraryChannel.stream.success("Libraries successfully uploaded to database.");
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		await globalStream.success(
			"Project successfully submitted!" + Object.keys(badAssayFields).length
				? "\n\nWARNING: Some Assays had provided fields that did not match the master list located at __ASSAY_MASTER_LIST_URL__. The following fields will have the values from the submission replaced with the values from the master list.\n\n" +
						Object.entries(badAssayFields)
							.map(
								([assay_name, fieldInfos]) =>
									assay_name +
									"\n" +
									fieldInfos
										.map((info) => "Field: " + info.field + "\tProvided: " + info.provided + "\tActual: " + info.actual)
										.join("\n")
							)
							.join("\n\n")
				: ""
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
