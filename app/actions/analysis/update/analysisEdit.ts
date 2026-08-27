"use server";

import type { Analysis, Occurrence, Tag } from "@/app/generated/prisma/client";
import { addToHistory } from "@/app/helpers/actions/actions";
import { parseAnalysisFile } from "@/app/helpers/actions/analysis";
import { prisma } from "@/app/helpers/prisma";
import { createProgressStream } from "@/app/helpers/progress";
import { handlePrismaError } from "@/app/helpers/queries";
import { validateBlobs } from "@/app/helpers/withDb";
import type { AsyncReturnType, ProgressStream } from "@/types/globals";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";

async function doEdit(
	stream: ProgressStream,
	editId: string,
	project_id: Analysis["project_id"],
	analysis_run_name: Analysis["analysis_run_name"],
	{
		url,
		trusted,
		tagNames
	}: {
		url?: string;
		trusted?: boolean;
		tagNames?: Tag["tagName"][];
	}
) {
	const { userId, sessionClaims, getToken } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	try {
		const dbAnalysisUntyped = await prisma.analysis.findUnique({
			where: {
				project_id_analysis_run_name: {
					project_id,
					analysis_run_name
				}
			},
			select: {
				analysisMetadataFileUrl_ODE: true,
				analysisMetadataFileChecksum_ODE: true,
				asvFileUrl_ODE: true,
				occurrenceFileUrl_ODE: true,
				trusted: true,
				editHistory: true,
				assay_name: true,
				project_id: true,
				Project: {
					select: {
						userIds: true
					}
				},
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
		});

		if (!dbAnalysisUntyped) {
			await stream.error(`No Analysis with analysis_run_name of "${analysis_run_name}" found.`);
			return;
		} else if (!dbAnalysisUntyped.Project.userIds.includes(userId)) {
			await stream.error(
				`Permission denied for editing analysis with Project with project_id of ${dbAnalysisUntyped.project_id}. Please contact submission owner with a request to be added to the Project.`
			);
			return;
		}

		const dbAnalysis = dbAnalysisUntyped as unknown as Omit<typeof dbAnalysisUntyped, "Occurrences"> & {
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

		let parseResult = undefined as AsyncReturnType<typeof parseAnalysisFile>;
		if (url) {
			parseResult = await parseAnalysisFile({
				channel: { stream, url },
				assignmentsUrl: dbAnalysis.asvFileUrl_ODE,
				occurrencesUrl: dbAnalysis.occurrenceFileUrl_ODE,
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
				if (parseResult && parseResult.analysis.assay_name !== dbAnalysis.assay_name) {
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
						project_id_analysis_run_name: {
							project_id,
							analysis_run_name
						}
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
								project_id,
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

		//only update assay BLAST database if assay has changed
		if (parseResult && parseResult.analysis.assay_name !== dbAnalysis.assay_name) {
			fetch(
				`${process.env.NEXT_PUBLIC_SERVER_URL}/analysis/${project_id}/${analysis_run_name}/afterSubmission${dbAnalysis.assay_name}?delete=true&skipDiversities=true&skipAllBlast=True`,
				{
					method: "POST",
					headers: {
						Authorization: "Bearer " + (await getToken({ expiresInSeconds: 60 })) //manually set expire time to get fresh token
					}
				}
			);
		}

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
	project_id: Analysis["project_id"],
	analysis_run_name: Analysis["analysis_run_name"],
	{
		url,
		trusted,
		tagNames
	}: {
		url?: string;
		trusted?: boolean;
		tagNames?: Tag["tagName"][];
	}
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

	doEdit(stream, editId, project_id, analysis_run_name, { url, trusted, tagNames }).then((success) => {
		stream.close();

		if (url && !success) {
			del(url);
		}
	});

	return stream.readable;
}
