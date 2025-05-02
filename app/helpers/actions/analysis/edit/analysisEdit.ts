"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/helpers/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { AnalysisPartialSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
// import { revalidatePath } from "next/cache";

export default async function analysisEditAction(formData: FormData): Promise<NetworkPacket> {
	console.log("analysis edit");

	const { userId } = await auth();
	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	const analysis_run_name = formData.get("target") as string;
	if (!analysis_run_name) {
		return { statusMessage: "error", error: "No target specified" };
	}
	formData.delete("target");

	const isPrivateForm = formData.get("isPrivate");

	//TODO: validate all fields are valid analysis fields

	try {
		const error = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						userId: true,
						project_id: true,
						editHistory: true,
						...(Array.from(formData.keys()).reduce(
							(acc, field) => ({ ...acc, [field]: true }),
							{}
						) as Prisma.AnalysisSelect)
					}
				});

				if (!analysis) {
					return `No analysis with analysis_run_name of '${analysis_run_name}' found.`;
				} else if (userId !== analysis.userId) {
					return "Unauthorized action. You are not the owner of this analysis.";
				}

				const project = await tx.project.findUnique({
					where: {
						project_id: analysis.project_id
					},
					select: {
						isPrivate: true
					}
				});

				if (project!.isPrivate && isPrivateForm === "false") {
					return "Analysis cannot be made public because parent Project is private. You must first make the parent Project public before making this Analysis public.";
				}

				const newEdit = {
					dateEdited: new Date(),
					changes: Array.from(formData.entries()).map(([field, value]) => ({
						field,
						oldValue: analysis[field as keyof typeof analysis]
							? analysis[field as keyof typeof analysis]!.toString()
							: "",
						newValue: value.toString()
					}))
				};

				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						//make changes to analysis
						...AnalysisPartialSchema.parse(
							Object.fromEntries(Array.from(formData).map(([key, value]) => [key, value === "" ? null : value]))
						),
						//add edit to start of edit history
						editHistory: analysis.editHistory ? [newEdit].concat(analysis.editHistory) : [newEdit]
					}
				});

				if (isPrivateForm !== null) {
					const isPrivate = isPrivateForm === "true" ? true : false;

					await tx.occurrence.updateMany({
						where: {
							analysis_run_name
						},
						data: {
							isPrivate
						}
					});

					await tx.assignment.updateMany({
						where: {
							analysis_run_name
						},
						data: {
							isPrivate
						}
					});

					if (isPrivate) {
						await tx.feature.updateMany({
							where: {
								Assignments: {
									some: {
										analysis_run_name
									}
									//TODO: fix this query to get all features where all the assignments that aren't related to the analysis_run_name are private
									// every: {
									// 	NOT: {
									// 		analysis_run_name
									// 	},
									// 	isPrivate: true
									// }
								}
							},
							data: {
								isPrivate: true
							}
						});

						await tx.taxonomy.updateMany({
							where: {
								Assignments: {
									some: {
										analysis_run_name
									}
									//TODO: fix this query to get all taxonomies where all the assignments that aren't related to the analysis_run_name are private
									// every: {
									// 	NOT: {
									// 		analysis_run_name
									// 	},
									// 	isPrivate: true
									// }
								}
							},
							data: {
								isPrivate: true
							}
						});
					} else {
						await tx.feature.updateMany({
							where: {
								Assignments: {
									some: {
										analysis_run_name
									}
								}
							},
							data: {
								isPrivate: false
							}
						});

						await tx.taxonomy.updateMany({
							where: {
								Assignments: {
									some: {
										analysis_run_name
									}
								}
							},
							data: {
								isPrivate: false
							}
						});
					}
				}
			},
			{ timeout: 0.5 * 60 * 1000 }
		);

		if (error) {
			return { statusMessage: "error", error };
		}

		// revalidatePath("/explore");
		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
