"use server";

import { auth } from "@clerk/nextjs/server";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { AnalysisPartialSchema, AnalysisSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions, ZodBooleanSchema } from "@/types/objects";
import { z } from "zod";
// import { revalidatePath } from "next/cache";

const formSchema = AnalysisPartialSchema.merge(
	z.object({
		target: AnalysisSchema.shape.analysis_run_name,
		isPrivate: ZodBooleanSchema
	})
);

export default async function analysisEditAction(formData: FormData): Promise<NetworkPacket> {
	console.log("analysis edit");

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId) {
		return { statusMessage: "error", error: "Unauthorized" };
	}

	if (!(formData instanceof FormData)) {
		return { statusMessage: "error", error: "Argument must be FormData" };
	}
	const formDataObject = Object.fromEntries(formData.entries());
	const parsed = formSchema.safeParse(formDataObject);
	if (!parsed.success) {
		return {
			statusMessage: "error",
			error: parsed.error.issues
				? parsed.error.issues.map((issue) => issue.message).join(" ")
				: "Invalid data structure"
		};
	}

	const { target: analysis_run_name, ...analysisChanges } = parsed.data;

	try {
		const analysisSelect = Object.keys(analysisChanges).reduce(
			(acc, field) => ({ ...acc, [field]: true }),
			{}
		) as Prisma.AnalysisSelect;

		const error = await prisma.$transaction(
			async (tx) => {
				const analysis = await tx.analysis.findUnique({
					where: {
						analysis_run_name
					},
					select: {
						userIds: true,
						Project: true,
						editHistory: true,
						...analysisSelect
					}
				});

				if (!analysis) {
					return `No Analysis with analysis_run_name of '${analysis_run_name}' found.`;
				} else if (!analysis.userIds.includes(userId) && (!role || !RolePermissions[role].includes("manageUsers"))) {
					return "Unauthorized action.";
				}

				if (analysis.Project!.isPrivate && parsed.data.isPrivate === false) {
					return "Analysis cannot be made public because parent Project is private. You must first make the parent Project public before making this Analysis public.";
				}

				const newEdit = {
					dateEdited: new Date(),
					changes: Object.entries(analysisChanges).map(([field, value]) => ({
						field,
						oldValue: analysis[field as keyof typeof analysis]?.toString() || "",
						newValue: value ? value.toString() : ""
					}))
				};

				await tx.analysis.update({
					where: {
						analysis_run_name
					},
					data: {
						//make changes to analysis
						...analysisChanges,
						//add edit to start of edit history
						editHistory: analysis.editHistory ? [newEdit].concat(analysis.editHistory) : [newEdit]
					}
				});

				if (parsed.data.isPrivate !== null) {
					const isPrivate = parsed.data.isPrivate ? true : false;

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
			{ timeout: 1.5 * 60 * 1000 }
		);

		if (error) {
			return { statusMessage: "error", error };
		}

		// revalidatePath("/explore");
		return { statusMessage: "success" };
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
