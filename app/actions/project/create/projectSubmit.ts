"use server";

import { prisma } from "@/app/helpers/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { RolePermissions } from "@/types/objects";
import { parseProjectFiles } from "@/app/helpers/actions/project";
import { Channel, createProgressStream } from "@/app/helpers/progress";
import { UserMetadata } from "@/types/globals";
import { handlePrismaError } from "@/app/helpers/queries";
import { del } from "@vercel/blob";
import { Project } from "@/app/generated/prisma/client";
import { validateBlobs } from "@/app/helpers/withDb";
import {
	AttributionOptionalDefaults,
	AttributionOptionalDefaultsSchema,
	ImageOptionalDefaults,
	ImageOptionalDefaultsSchema
} from "@/prismaImages/generated/zod";
import { prismaImages } from "@/app/helpers/prismaImages";

async function doSubmit(
	globalStream: ReturnType<typeof createProgressStream>,
	projectChannel: Channel,
	sampleChannel: Channel,
	libraryChannel: Channel,
	userIds: Project["userIds"],
	imageInfo?: { image: ImageOptionalDefaults; attribution?: AttributionOptionalDefaults }
) {
	const client = await clerkClient();
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

	const users = (await client.users.getUserList({ userId: userIds })).data;
	for (const u of users) {
		const uRole = (u.publicMetadata as UserMetadata).role;
		if (!uRole || !RolePermissions[uRole].includes("contribute")) {
			await globalStream.error(`${u.fullName} does not have permission to contribute.`);
			return;
		}
	}

	if (imageInfo) {
		try {
			for (const k in imageInfo.image) {
				const key = k as keyof typeof imageInfo.image;
				if (imageInfo.image[key] === "") {
					delete imageInfo.image[key];
				}
			}
			if (imageInfo.image.homePage) {
				await globalStream.error("Not allowed to submit home page images.");
				return;
			} else {
				imageInfo.image.homePage = false;
			}
			imageInfo.image.userId = userId;
			const parsedImage = ImageOptionalDefaultsSchema.parse(imageInfo.image);

			const parsedAttribution = imageInfo.attribution && AttributionOptionalDefaultsSchema.parse(imageInfo.attribution);

			await prismaImages.$transaction([
				...(parsedAttribution
					? [
							prismaImages.attribution.create({
								data: parsedAttribution
							})
						]
					: []),
				prismaImages.image.create({
					data: parsedImage
				})
			]);
		} catch (err: any) {
			const prismaErr = handlePrismaError(err);
			if (prismaErr) {
				await globalStream.error(prismaErr.error);
			} else {
				const error = err as Error;
				await globalStream.error(error.message);
			}

			return;
		}
	}

	try {
		const parseResult = await parseProjectFiles({
			projectChannel,
			sampleChannel,
			libraryChannel,
			userIds,
			imageFileUrl: imageInfo?.image.url
		});
		if (!parseResult) {
			return;
		}
		const { project, samples, assays, assayPreps, libraries } = parseResult;

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
						if (!(a.assay_name in badAssayFields)) {
							badAssayFields[a.assay_name] = [];
						}
						badAssayFields[a.assay_name].push({ field, provided: value, actual: dbA[field] });
					}
				}
			}
		}

		await projectChannel.stream.message("All checks successful.", 85);

		//submission
		await prisma.$transaction([
			prisma.project.create({
				data: project
			}),
			prisma.sample.createMany({
				data: samples
			}),
			prisma.assayPrep.createMany({
				data: assayPreps
			}),
			prisma.library.createMany({
				data: libraries
			})
		]);

		await projectChannel.stream.success("Project and AssayPreps successfully uploaded to database.");
		await sampleChannel.stream.success("Samples successfully uploaded to database.");
		await libraryChannel.stream.success("Libraries successfully uploaded to database.");

		let successMsg = "Project successfully submitted!";
		if (Object.keys(badAssayFields).length) {
			successMsg +=
				"\n\nWARNING: Some Assays had provided fields that did not match the __ASSAY_MASTER_LIST_URL__. The following fields will have the values from the submission replaced with the values from the master list.\n\n" +
				Object.entries(badAssayFields)
					.map(
						([assay_name, fieldInfos]) =>
							assay_name +
							"\n" +
							fieldInfos
								.map((info) => "Field: " + info.field + "\tProvided: " + info.provided + "\tActual: " + info.actual)
								.join("\n")
					)
					.join("\n\n");
		}
		await globalStream.success(successMsg);

		return true;
	} catch (err: any) {
		const prismaErr = handlePrismaError(err);
		if (prismaErr) {
			await globalStream.error(prismaErr.error);
		} else {
			const error = err as Error;
			await globalStream.error(error.message);
		}

		if (imageInfo) {
			await prismaImages.$transaction(async (tx) => {
				if (imageInfo.attribution) {
					await tx.attribution.delete({
						where: {
							attributionTitle: imageInfo.attribution.attributionTitle
						}
					});
				}

				await tx.image.delete({
					where: {
						url: imageInfo.image.url
					}
				});
			});
		}
	}
}

export default async function projectSubmitAction(
	projectFileUrl: Project["projectMetadataFileUrl_ODE"],
	sampleFileUrl: Project["sampleMetadataFileUrl_ODE"],
	libraryFileUrl: Project["libraryMetadataFileUrl_ODE"],
	userIds: Project["userIds"],
	imageInfo?: { image: ImageOptionalDefaults; attribution?: AttributionOptionalDefaults }
) {
	const globalStream = createProgressStream();
	const projectStream = createProgressStream();
	const sampleStream = createProgressStream();
	const libraryStream = createProgressStream();

	const validBlobs = await validateBlobs(
		[projectFileUrl, sampleFileUrl, libraryFileUrl, imageInfo?.image.url].filter(Boolean) as string[]
	);
	if (!validBlobs) {
		globalStream.error("Files are not valid");

		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();

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
		imageInfo
	).then((success) => {
		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();

		if (!success) {
			del([projectFileUrl, sampleFileUrl, libraryFileUrl, imageInfo?.image.url].filter(Boolean) as string[]);
		}
	});

	return {
		global: globalStream.readable,
		readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
	};
}
