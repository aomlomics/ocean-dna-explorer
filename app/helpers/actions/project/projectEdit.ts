"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/helpers/prisma";
import { Prisma } from "@/app/generated/prisma/client";
// import { revalidatePath } from "next/cache";
import analysisEditAction from "../analysis/edit/analysisEdit";
import { ProjectPartialSchema } from "@/prisma/generated/zod";

export default async function projectEditAction(formData: FormData) {
	console.log("project edit");

	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	const project_id = formData.get("target") as string;
	if (!project_id) {
		return { message: "error", error: "No target specified" };
	}
	formData.delete("target");

	//TODO: validate all fields are valid project fields

	try {
		//TODO: move computation out of transaction
		const error = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const project = await tx.project.findUnique({
				where: {
					project_id
				},
				select: {
					userId: true,
					editHistory: true,
					...(Array.from(formData.keys()).reduce((acc, field) => {
						if (field.startsWith("userDefined") && !acc.userDefined) {
							acc.userDefined = true;
						} else {
							acc[field] = true;
						}

						return acc;
					}, {} as Record<string, true>) as Prisma.ProjectSelect),
					Analyses: {
						select: {
							analysis_run_name: true
						}
					}
				}
			});

			if (!project) {
				return `No project with project_id of '${project_id}' found.`;
			} else if (userId !== project.userId) {
				return "Unauthorized action. You are not the owner of this project.";
			}

			const newEdit = {
				dateEdited: new Date(),
				changes: Array.from(formData.entries()).map(([field, value]) => {
					if (field.startsWith("userDefined") && project.userDefined) {
						const userDefinedField = field.split(":")[1];
						return {
							field: userDefinedField,
							oldValue: project.userDefined[userDefinedField] || "",
							newValue: value as string
						};
					} else {
						return {
							field,
							oldValue: project[field as keyof typeof project]?.toString() || "",
							newValue: value.toString()
						};
					}
				})
			};

			await tx.project.update({
				where: {
					project_id
				},
				data: {
					//make changes to project
					...ProjectPartialSchema.parse(
						Object.fromEntries(Array.from(formData).map(([key, value]) => [key, value === "" ? null : value]))
					),
					//replace changed fields in userDefined with new values
					userDefined: {
						//keep previous user defined data
						...project.userDefined,
						//override any changed fields
						...Array.from(formData.entries()).reduce((acc, [field, value]) => {
							if (project.userDefined && field.startsWith("userDefined")) {
								const userDefinedField = field.split(":")[1];
								if (userDefinedField in project.userDefined) {
									acc[userDefinedField] = value as string;
								}
							}

							return acc;
						}, {} as PrismaJson.UserDefinedType)
					},
					//add edit to start of edit history
					editHistory: project.editHistory ? [newEdit].concat(project.editHistory) : [newEdit]
				}
			});

			const isPrivateForm = formData.get("isPrivate");
			if (isPrivateForm !== null) {
				const isPrivate = isPrivateForm === "true" ? true : false;

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
			return { message: "Error", error };
		}

		// revalidatePath("/explore");
		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
