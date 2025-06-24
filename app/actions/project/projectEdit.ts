"use server";

import { auth } from "@clerk/nextjs/server";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { Prisma } from "@/app/generated/prisma/client";
// import { revalidatePath } from "next/cache";
import analysisEditAction from "../analysis/analysisEdit";
import { ProjectPartialSchema, ProjectSchema } from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { ZodBooleanSchema } from "@/types/objects";
import { z } from "zod";

const formSchema = ProjectPartialSchema.merge(
	z.object({
		target: ProjectSchema.shape.project_id,
		isPrivate: ZodBooleanSchema
	})
);

//TODO: test editing all types of fields
export default async function projectEditAction(formData: FormData): Promise<NetworkPacket> {
	console.log("project edit");

	const { userId } = await auth();

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

	const { target: project_id, ...projectChanges } = parsed.data;

	try {
		const projectSelect = Object.keys(projectChanges).reduce(
			(acc, field) => ({ ...acc, [field]: true }),
			{}
		) as Prisma.ProjectSelect;

		const error = await prisma.$transaction(async (tx) => {
			const project = await tx.project.findUnique({
				where: {
					project_id
				},
				select: {
					userIds: true,
					editHistory: true,
					...projectSelect,
					Analyses: {
						select: {
							analysis_run_name: true
						}
					}
				}
			});

			if (!project) {
				return `No Project with project_id of '${project_id}' found.`;
			} else if (!project.userIds.includes(userId)) {
				return "Unauthorized action.";
			}

			const newEdit = {
				dateEdited: new Date(),
				changes: Object.entries(projectChanges).reduce((acc, [field, value]) => {
					if (field === "userDefined" && project.userDefined) {
						for (let [userDefinedField, userDefinedValue] of Object.entries(value as PrismaJson.UserDefinedType)) {
							acc.push({
								field: userDefinedField,
								oldValue: project.userDefined[userDefinedField] || "",
								newValue: userDefinedValue.toString()
							});
						}
					} else {
						acc.push({
							field,
							oldValue: project[field as keyof typeof project]?.toString() || "",
							newValue: value ? value.toString() : ""
						});
					}

					return acc;
				}, [] as PrismaJson.ChangesType)
			};

			const updateData = {
				//make changes to project
				...projectChanges,
				//add edit to start of edit history
				editHistory: project.editHistory ? [newEdit].concat(project.editHistory) : [newEdit]
			} as Prisma.ProjectUpdateInput;
			if (projectChanges.userDefined) {
				//replace changed fields in userDefined with new values
				updateData.userDefined = {
					//keep previous user defined data
					...project.userDefined,
					//override any changed fields
					...(projectChanges.userDefined as PrismaJson.UserDefinedType)
				};
			}

			await tx.project.update({
				where: {
					project_id
				},
				data: updateData
			});

			if (parsed.data.isPrivate !== null) {
				const isPrivate = parsed.data.isPrivate ? true : false;

				await tx.sample.updateMany({
					where: {
						project_id
					},
					data: {
						isPrivate
					}
				});

				await tx.library.updateMany({
					where: {
						Sample: {
							project_id
						}
					},
					data: {
						isPrivate
					}
				});

				if (isPrivate) {
					await tx.assay.updateMany({
						where: {
							Samples: {
								some: {
									project_id
								}
								//TODO: fix this query to get all assays where all the samples that aren't related to the project_id are private
								// every: {
								// 	NOT: {
								// 		project_id
								// 	},
								// 	isPrivate: true
								// }
							}
						},
						data: {
							isPrivate: true
						}
					});

					await tx.primer.updateMany({
						where: {
							Assays: {
								some: {
									Samples: {
										some: {
											project_id
										}
									}
								},
								every: {
									isPrivate: true
								}
							}
						},
						data: {
							isPrivate: true
						}
					});

					//update all analyses of project to be private
					for (let analysis of project.Analyses) {
						const analysisFormData = new FormData();
						analysisFormData.set("isPrivate", "true");
						analysisFormData.set("target", analysis.analysis_run_name);
						analysisEditAction(analysisFormData);
					}
				} else {
					await tx.assay.updateMany({
						where: {
							Samples: {
								some: {
									project_id
								}
							}
						},
						data: {
							isPrivate: false
						}
					});

					await tx.primer.updateMany({
						where: {
							Assays: {
								some: {
									Samples: {
										some: {
											project_id
										}
									},
									isPrivate: false
								}
							}
						},
						data: {
							isPrivate: false
						}
					});
				}
			}
		});

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
