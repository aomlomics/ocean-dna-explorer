"use server";

import { Analysis, Occurrence, Project, Tag } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseAnalysisFile } from "@/app/helpers/actions/analysis";
import { prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { handlePrismaError } from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import { AsyncReturnType, ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

async function doEdit(
	stream: ProgressStream,
	editId: string,
	project_id: Project["project_id"],
	analysis_run_name: Analysis["analysis_run_name"],
	{
		url,
		isPrivate,
		trusted,
		tagNames
	}: { url?: string; isPrivate?: boolean; trusted?: boolean; tagNames?: Tag["tagName"][] }
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

		let parseResult = undefined as AsyncReturnType<typeof parseAnalysisFile>;
		if (url) {
			parseResult = await parseAnalysisFile({
				channel: { stream, url },
				assignmentsUrl: dbAnalysis.asvFileUrl_ODE,
				occurrencesUrl: dbAnalysis.occurrenceFileUrl_ODE,
				isPrivate,
				trusted,
				oldChecksum: dbAnalysis.analysisMetadataFileChecksum_ODE
			});
			if (!parseResult) {
				return;
			}
		}

		await stream.message("Analysis successfully parsed into database format. Parsing data into database.", 50);

		await prisma.$transaction(
			async (tx) => {
				//check if the associated project is private, and throw an error if it is private but the submission is public
				const project = await tx.project.findUnique({
					where: {
						project_id
					},
					select: {
						isPrivate: true,
						userIds: true
					}
				});
				if (!project) {
					throw new Error(`Project with project_id of ${project_id} does not exist.`);
				} else if (!project.userIds.includes(userId)) {
					throw new Error(
						`Permission denied for editing analysis with Project with project_id of ${project_id}. Please contact submission owner with a request to be added to the Project.`
					);
				} else if (project.isPrivate && !isPrivate) {
					throw new Error(
						`Project with project_id of ${project_id} is private. Analyses can't be public if the associated project is private.`
					);
				}

				const dbAnalysis = (await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						analysisMetadataFileUrl_ODE: true,
						analysisMetadataFileChecksum_ODE: true,
						isPrivate: true,
						trusted: true,
						editHistory: true,
						Tags: {
							select: {
								tagName: true
							}
						},
						Occurrences: trusted
							? {
									select: {
										featureid: true,
										Library: {
											select: {
												Occurrences: {
													where: {
														Analysis: {
															trusted: true
														},
														analysis_run_name: {
															not: analysis_run_name
														}
													},
													select: {
														featureid: true,
														analysis_run_name: true
													}
												}
											}
										}
									}
								}
							: false
					}
				})) as unknown as {
					isPrivate: Analysis["isPrivate"];
					trusted: Analysis["trusted"];
					editHistory: PrismaJson.EditHistoryType | null;
					analysisMetadataFileUrl_ODE: Analysis["analysisMetadataFileUrl_ODE"];
					analysisMetadataFileChecksum_ODE: Analysis["analysisMetadataFileChecksum_ODE"];
					Tags: Tag[];
				} & {
					Occurrences?: {
						featureid: Occurrence["featureid"];
						Library: {
							Occurrences: {
								featureid: Occurrence["featureid"];
								analysis_run_name: Occurrence["analysis_run_name"];
							}[];
						};
					}[];
				};

				if (!dbAnalysis) {
					throw new Error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
				}

				if (parseResult) {
					//check if assay is valid
					const dbAssay = await tx.assay.findUnique({
						where: {
							assay_name: parseResult.analysis.assay_name
						},
						select: {
							assay_name: true
						}
					});
					if (!dbAssay) {
						throw new Error(`The Assay with assay_name of "${parseResult.analysis.assay_name}" does not exist.`);
					}
				}

				let connect = [] as { tagName: string }[];
				let disconnect = [] as { tagName: string }[];
				if (tagNames) {
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
								throw new Error(
									`Some tags are invalid. The invalid tagNames are ${invalidTagNames
										.map((tagName, i) => (i === invalidTagNames.length - 1 ? `and "${tagName}"` : `"${tagName}"`))
										.join(", ")}.`
								);
							}
						}
					}

					connect = dbTags.filter((t) => !dbAnalysis.Tags.some((at) => t.tagName === at.tagName));
					disconnect = dbAnalysis.Tags.filter((at) => !dbTags.some((t) => at.tagName === t.tagName));
				}

				await stream.message("All checks passed.", 80);

				//update analysis
				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						...(parseResult
							? {
									...parseResult.analysis,
									editHistory: addToHistory("analysis", editId, dbAnalysis.editHistory, [
										{
											field: "analysisMetadataFileUrl_ODE",
											oldValue: dbAnalysis.analysisMetadataFileUrl_ODE,
											newValue: url!
										},
										{
											field: "analysisMetadataFileChecksum_ODE",
											oldValue: dbAnalysis.analysisMetadataFileChecksum_ODE,
											newValue: parseResult.analysisMd5
										}
									])
								}
							: {
									isPrivate: isPrivate === undefined ? dbAnalysis.isPrivate : isPrivate,
									trusted: trusted === undefined ? dbAnalysis.trusted : trusted
								}),
						Tags: {
							connect,
							disconnect
						}
					}
				});

				if (trusted) {
					const featureids = new Set(dbAnalysis.Occurrences!.map((occ) => occ.featureid));
					const otherTrusted = [] as Analysis["analysis_run_name"][];
					for (const ourOcc of dbAnalysis.Occurrences!) {
						for (const otherOcc of ourOcc.Library!.Occurrences)
							if (!otherTrusted.includes(otherOcc.analysis_run_name) && featureids.has(otherOcc.featureid)) {
								otherTrusted.push(otherOcc.analysis_run_name);
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
					}
				}

				await stream.success("Analysis file successfully updated in database.");
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		return true;
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
	editId: string,
	project_id: Project["project_id"],
	analysis_run_name: Analysis["analysis_run_name"],
	{
		url,
		isPrivate,
		trusted,
		tagNames
	}: { url?: string; isPrivate?: boolean; trusted?: boolean; tagNames?: Tag["tagName"][] }
) {
	const stream = createProgressStream();

	if (url) {
		const validBlob = await validateBlobs([url]);
		if (!validBlob) {
			stream.error("File is not valid");
			stream.close();
			return stream.readable;
		}
	}

	doEdit(stream, editId, project_id, analysis_run_name, { url, isPrivate, trusted, tagNames }).then((success) => {
		stream.close();

		if (url && !success) {
			del(url);
		}
	});

	return stream.readable;
}
