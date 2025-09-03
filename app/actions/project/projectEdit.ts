"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { deadBooleanToString } from "@/app/helpers/utils";
import { auth } from "@clerk/nextjs/server";
import {
	ProjectScalarFieldEnumSchema,
	PrimerOptionalDefaultsSchema,
	PrimerScalarFieldEnumSchema,
	AssayOptionalDefaultsSchema,
	AssayScalarFieldEnumSchema,
	ProjectPartialSchema
} from "@/prisma/generated/zod";
import { RolePermissions } from "@/types/objects";
import { parse } from "csv-parse";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { md5 } from "js-md5";
import { ProgressStream } from "@/types/globals";

async function doEdit(stream: ProgressStream, url: string, editId: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	let project = {} as Prisma.ProjectCreateInput;
	const primers = [] as Prisma.PrimerCreateManyInput[];
	const assays = [] as Prisma.AssayCreateManyInput[];

	const projectCol = {} as Record<string, string>;
	const primerCols = {} as Record<string, Record<string, string>>;
	const assayCols = {} as Record<string, Record<string, string>>;

	try {
		let assayNames = [] as string[];
		const projectUserDefined = {} as PrismaJson.UserDefinedType;

		//fetch file from blob storage
		await stream.message("Downloading file", 10);
		const projectFileResponse = await fetch(url);
		if (!projectFileResponse.ok) {
			await stream.error(`Project file responded ${projectFileResponse.status}: ${projectFileResponse.statusText}.`);
			return;
		}

		await stream.message("Reading file into memory", 15);
		const projectText = await projectFileResponse.text();
		const md5Checksum = md5(projectText);
		const projectParser = parse(projectText, { columns: true, delimiter: "\t" });
		await stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of projectParser) {
			if (!assayNames.length) {
				const fileHeaders = Object.keys(record);

				//check if headers have term_name
				if (!fileHeaders.includes("term_name")) {
					await stream.error('No column with title "term_name" found.');
					return;
				}

				//check if headers have project_level
				if (!fileHeaders.includes("project_level")) {
					await stream.error('No column with title "project_level" found.');
					return;
				}

				assayNames = fileHeaders.slice(fileHeaders.indexOf("project_level") + 1);
				if (!assayNames.length) {
					await stream.error("No Assays found.");
					return;
				}
			}

			//TODO: make the parsing specific for each table, instead of stamping every table on every row
			const field = record.term_name;
			if (field) {
				i++;

				const value = record.project_level;

				//User defined
				if (
					!ProjectScalarFieldEnumSchema.safeParse(field).success &&
					!AssayScalarFieldEnumSchema.safeParse(field).success &&
					!PrimerScalarFieldEnumSchema.safeParse(field).success
				) {
					projectUserDefined[field] = value;
				} else {
					//Project Level
					//project table
					parseSchemaToObject(field, value, projectCol, "project");

					//primer table
					parseSchemaToObject(field, value, projectCol, "primer");

					//assay table
					parseSchemaToObject(field, value, projectCol, "assay");

					//Assay Levels
					for (const assay_name of assayNames) {
						//flip table from long to wide
						//constucting objects whose keys are "levels" (ssu16sv4v5, ssu18sv9)
						//and whose values are an object representing a single "row"
						if (record[assay_name]) {
							//Primers
							if (!primerCols[assay_name]) {
								primerCols[assay_name] = {};
							}
							parseSchemaToObject(field, record[assay_name], primerCols[assay_name], "primer");

							//Assays
							if (!assayCols[assay_name]) {
								assayCols[assay_name] = {};
							}
							parseSchemaToObject(field, record[assay_name], assayCols[assay_name], "assay");
						}
					}
				}

				//add to progress bar
				await stream.message(
					`Processed line ${i} of ${projectParser.info.records}.`,
					(i / projectParser.info.records) * 50 + 25
				);
			}
		}

		for (let a of Object.values(assayCols)) {
			const parsedAssay = AssayOptionalDefaultsSchema.safeParse(
				{
					//most specific overrides least specific
					...projectCol,
					...a
				},
				{
					errorMap: (error, ctx) => {
						return {
							message: `Field: ${error.path[0]}\nIssue: ${
								ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
							}\nValue: ${a[error.path[0]] || projectCol[error.path[0]]}`
						};
					}
				}
			);

			if (!parsedAssay.success) {
				await stream.error(
					`Table: Primer\n` +
						`Key: ${a.pcr_primer_forward || projectCol.pcr_primer_forward}\n` +
						`Key: ${a.pcr_primer_reverse || projectCol.pcr_primer_reverse}\n\n` +
						`${parsedAssay.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			assays.push(parsedAssay.data);
		}

		for (let p of Object.values(primerCols)) {
			const parsedPrimer = PrimerOptionalDefaultsSchema.safeParse(
				{
					//most specific overrides least specific
					...projectCol,
					...p
				},
				{
					errorMap: (error, ctx) => {
						return {
							message: `Field: ${error.path[0]}\nIssue: ${
								ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
							}\nValue: ${p[error.path[0]] || projectCol[error.path[0]]}`
						};
					}
				}
			);

			if (!parsedPrimer.success) {
				await stream.error(
					`Table: Primer\n` +
						`Key: ${p.pcr_primer_forward || projectCol.pcr_primer_forward}\n` +
						`Key: ${p.pcr_primer_reverse || projectCol.pcr_primer_reverse}\n\n` +
						`${parsedPrimer.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			primers.push(parsedPrimer.data);
		}

		//@ts-ignore issue with Json database type
		const parsedProject = ProjectPartialSchema.safeParse(
			{
				...projectCol,
				userDefined: Object.keys(projectUserDefined).length ? projectUserDefined : "JsonNull",
				projectMetadataFileUrl_ODE: url,
				projectMetadataFileChecksum_ODE: md5Checksum
			},
			{
				errorMap: (error, ctx) => {
					return {
						message: `Field: ${error.path[0]}\nIssue: ${
							ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
						}\nValue: ${projectCol[error.path[0]]}`
					};
				}
			}
		);

		if (!parsedProject.success) {
			await stream.error(
				`Table: Project\n` +
					`Key: ${projectCol.project_id}\n\n` +
					`${parsedProject.error.issues.map((e) => e.message).join("\n\n")}`
			);
			return;
		}

		//@ts-ignore issue with Json database type
		project = parsedProject.data;

		await stream.message("All entries successfully parsed into database format. Parsing data into database.", 75);

		const dbError = await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbProject = await tx.project.findUnique({
					where: {
						project_id: project.project_id
					},
					select: {
						userIds: true,
						editHistory: true,
						projectMetadataFileUrl_ODE: true,
						projectMetadataFileChecksum_ODE: true
					}
				});

				if (!dbProject) {
					return `No Project with project_id of "${project.project_id}" found.`;
				} else if (!dbProject.userIds.includes(userId)) {
					return "Unauthorized action.";
				}

				for (let p of primers) {
					const dbPrimer = await tx.primer.findUnique({
						where: {
							pcr_primer_forward_pcr_primer_reverse: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							}
						},
						select: {
							Assays: {
								select: {
									Samples: {
										select: {
											Project: {
												select: {
													userIds: true
												}
											}
										}
									}
								}
							}
						}
					});

					if (
						dbPrimer &&
						!dbPrimer.Assays.some((a) => a.Samples.some((samp) => samp.Project.userIds.includes(userId)))
					) {
						return "Unauthorized action.";
					}
				}

				for (let a of assays) {
					const dbAssay = await tx.assay.findUnique({
						where: {
							assay_name: a.assay_name
						},
						select: {
							Samples: {
								select: {
									Project: {
										select: {
											userIds: true
										}
									}
								}
							}
						}
					});

					if (dbAssay && !dbAssay.Samples.some((samp) => samp.Project.userIds.includes(userId))) {
						return "Unauthorized action.";
					}
				}

				if (dbProject.editHistory?.some((edit) => edit.id === editId)) {
					return "Bad editId.";
				}

				await stream.message("All checks passed.", 80);

				const newEdit = {
					id: editId,
					dateEdited: new Date(),
					changes: [
						{
							field: "projectMetadataFileUrl_ODE",
							oldValue: dbProject.projectMetadataFileUrl_ODE,
							newValue: url
						},
						{
							field: "projectMetadataFileChecksum_ODE",
							oldValue: dbProject.projectMetadataFileChecksum_ODE,
							newValue: md5Checksum
						}
					]
				};

				//project
				await tx.project.update({
					where: {
						project_id: project.project_id
					},
					data: {
						...project,
						editHistory: dbProject.editHistory ? [newEdit, ...dbProject.editHistory] : [newEdit]
					}
				});

				await stream.message("Project successfully updated in database.", 85);

				//primers
				let i = 0;
				for (let p of primers) {
					await tx.primer.upsert({
						where: {
							pcr_primer_forward_pcr_primer_reverse: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							}
						},
						update: p,
						create: p
					});

					i++;
					await stream.message(
						`Primer with pcr_primer_forward of "${p.pcr_primer_forward}" and pcr_primer_reverse of "${p.pcr_primer_reverse}" successfully updated in database.`,
						85 + (5 / primers.length) * i
					);
				}

				//assays
				i = 0;
				for (let a of assays) {
					await tx.assay.upsert({
						where: {
							assay_name: a.assay_name
						},
						update: a,
						create: a
					});

					i++;
					await stream.message(
						`Assay with assay_name of "${a.assay_name}" successfully updated in database.`,
						90 + (5 / assays.length) * i
					);
				}
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		if (dbError) {
			await stream.error(dbError);
			return;
		}

		await stream.success("Project file successfully updated in database.");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			const error = handlePrismaError(err);
			await stream.error(error.error);
		} else {
			const error = err as Error;
			await stream.error(error.message);
		}
	}
}

export default async function projectEditAction(url: string, editId: string) {
	const stream = createProgressStream();

	if (typeof url !== "string" || typeof editId !== "string") {
		stream.error("Arguments are not of correct type");

		stream.close();

		return stream.readable;
	}

	doEdit(stream, url, editId).then(stream.close);

	return stream.readable;
}
