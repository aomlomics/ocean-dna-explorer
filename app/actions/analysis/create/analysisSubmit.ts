"use server";

import { Analysis, Occurrence, Tag } from "@/app/generated/prisma/client";
import { parseAnalysisFiles } from "@/app/helpers/actions/analysis";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { Channel, createProgressStream } from "@/app/helpers/progress";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";

async function doSubmit(
	analysisChannel: Channel,
	assignmentsChannel: Channel,
	occurrencesChannel: Channel,
	isPrivate: Analysis["isPrivate"],
	trusted: Analysis["trusted"],
	tagNames: Tag["tagName"][]
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
			isPrivate,
			trusted
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

				//check if assay is valid
				const dbAssay = await tx.assay.findUnique({
					where: {
						assay_name: analysis.assay_name
					},
					select: {
						assay_name: true
					}
				});
				if (!dbAssay) {
					throw new Error(`The Assay with assay_name of "${analysis.assay_name}" does not exist.`);
				}

				//check that lib_ids in occurrences are part of the project for this analysis AND they have the assay for this analysis
				const libIds = new Set() as Set<Occurrence["lib_id"]>;
				for (const occ of occurrences) {
					libIds.add(occ.lib_id);
				}
				const dbLibraries = await tx.library.findMany({
					where: {
						project_id: analysis.project_id,
						assay_name: analysis.assay_name,
						lib_id: {
							in: Array.from(libIds)
						}
					},
					select: {
						lib_id: true,
						Occurrences: trusted
							? {
									where: {
										Analysis: {
											trusted: true
										}
									},
									select: {
										analysis_run_name: true,
										featureid: true
									}
								}
							: false
					}
				});

				//check if any provided libraries are missing from database query
				if (libIds.size !== dbLibraries.length) {
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
							let join = ", ";
							if (invalidLibIds.length === 2) {
								join = " ";
							}
							throw new Error(
								`Some libraries in occurrence file are invalid. The invalid lib_ids are ${invalidLibIds
									.map((lib_id, i) => (i === invalidLibIds.length - 1 ? `and "${lib_id}"` : `"${lib_id}"`))
									.join(", ")}.`
							);
						}
					}
				}

				//check if all tagNames are valid
				const dbTags = await tx.tag.findMany({
					where: {
						tagName: {
							in: tagNames
						}
					},
					select: {
						tagName: true
					}
				});

				//check if any provided tags are missing from database query
				if (tagNames.length !== dbTags.length) {
					const invalidTagNames = tagNames.filter((tn) => !dbTags.some((tag) => tag.tagName === tn));

					if (invalidTagNames.length) {
						if (invalidTagNames.length === 1) {
							throw new Error(`A tag is invalid. The invalid tagName is "${invalidTagNames[0]}".`);
						} else {
							let join = ", ";
							if (invalidTagNames.length === 2) {
								join = " ";
							}
							throw new Error(
								`Some tags are invalid. The invalid tagNames are ${invalidTagNames
									.map((tagName, i) => (i === invalidTagNames.length - 1 ? `and "${tagName}"` : `"${tagName}"`))
									.join(", ")}.`
							);
						}
					}
				}

				await tx.analysis.create({
					//@ts-ignore issue with Json database type
					data: {
						...analysis,
						Tags: {
							connect: dbTags
						}
					}
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
				//check if any libraries have another trusted analysis with shared features
				const otherTrusted = [] as Analysis["analysis_run_name"][];
				if (trusted) {
					for (const lib of dbLibraries) {
						for (const occ of lib.Occurrences) {
							if (
								!otherTrusted.includes(occ.analysis_run_name) &&
								features.find((feat) => feat.featureid === occ.featureid)
							) {
								otherTrusted.push(occ.analysis_run_name);
							}
						}
					}
				}

				if (otherTrusted.length) {
					//remove trusted from other analyses
					await tx.analysis.updateMany({
						where: {
							analysis_run_name: {
								in: otherTrusted
							}
						},
						data: {
							trusted: false
						}
					});

					if (otherTrusted.length === 1) {
						await occurrencesChannel.stream.message(
							`Trusted has been removed from Analysis with analysis_run_name of "${otherTrusted[0]}".`,
							85
						);
					} else {
						await occurrencesChannel.stream.message(
							`Analyses with analysis_run_names of ${otherTrusted
								.map((analysis_run_name, i) =>
									i === otherTrusted.length - 1 ? `and "${analysis_run_name}"` : `"${analysis_run_name}"`
								)
								.join(", ")}.`,
							85
						);
					}
				}

				await tx.occurrence.createMany({
					data: occurrences
				});

				await occurrencesChannel.stream.success("Occurrences successfully uploaded to database.");
			},
			{ timeout: 5 * 60 * 1000 }
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
	analysisFileUrl: Analysis["analysisMetadataFileUrl_ODE"],
	assignmentsFileUrl: Analysis["asvFileUrl_ODE"],
	occurrencesFileUrl: Analysis["occurrenceFileUrl_ODE"],
	isPrivate: Analysis["isPrivate"],
	trusted: Analysis["trusted"],
	tagNames: Tag["tagName"][]
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
		isPrivate,
		trusted,
		tagNames
	).then(() => {
		analysisStream.close();
		assignmentsStream.close();
		occurrencesStream.close();
	});

	return [analysisStream.readable, assignmentsStream.readable, occurrencesStream.readable];
}
