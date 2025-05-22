"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { batchSubmit, handlePrismaError, prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
	ProjectOptionalDefaultsSchema,
	ProjectScalarFieldEnumSchema,
	PrimerOptionalDefaultsSchema,
	PrimerScalarFieldEnumSchema,
	AssayOptionalDefaultsSchema,
	AssayScalarFieldEnumSchema,
	LibraryOptionalDefaultsSchema,
	LibraryScalarFieldEnumSchema,
	AnalysisOptionalDefaultsSchema,
	AnalysisScalarFieldEnumSchema,
	AssayPartial,
	LibraryPartial,
	SamplePartial,
	SampleOptionalDefaultsSchema,
	SampleScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { NetworkPacket } from "@/types/globals";
import { RolePermissions, ZodFileSchema, ZodBooleanSchema } from "@/types/objects";
import { z } from "zod";

const formSchema = z.object({
	isPrivate: ZodBooleanSchema.optional(),
	project: ZodFileSchema,
	library: ZodFileSchema,
	sample: ZodFileSchema
});

export default async function projectSubmitAction(formData: FormData): Promise<NetworkPacket> {
	console.log("project submit");

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
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
				? parsed.error.issues.map((issue) => `${issue.path[0]}: ${issue.message}`).join(" ")
				: "Invalid data structure."
		};
	}

	let project = {} as Prisma.ProjectCreateInput;
	const primers = [] as Prisma.PrimerCreateManyInput[];
	const assays = {} as Record<string, Prisma.AssayCreateManyInput>;
	const libraries = [] as Prisma.LibraryCreateManyInput[];
	const samples = [] as Prisma.SampleCreateManyInput[];

	const projectCol = {} as Record<string, string>;
	const primerCols = {} as Record<string, Record<string, string>>;
	const assayCols = {} as Record<string, Record<string, string>>;
	const libraryCols = {} as Record<string, Record<string, string>>;

	const sampToAssay = {} as Record<string, string>; //object to relate samples to their assay_name values
	const libToAssay = {} as Record<string, string>; //object to relate libraries to their assay_name values

	const isPrivate = parsed.data.isPrivate ? true : false;

	try {
		//Project file
		console.log("project file");
		//code block to force garbage collection
		{
			//parse file
			//TODO: try using papaparse or csv-parse instead
			const projectFileLines = (await parsed.data.project.text()).replace(/[\r]+/gm, "").split("\n");
			const projectFileHeaders = projectFileLines[0].split("\t");
			const userDefined = {} as PrismaJson.UserDefinedType;
			//iterate over each row
			for (let i = 1; i < projectFileLines.length; i++) {
				const currentLine = projectFileLines[i].split("\t");
				const field = currentLine[projectFileHeaders.indexOf("term_name")];
				const value = currentLine[projectFileHeaders.indexOf("project_level")];
				const section = currentLine[projectFileHeaders.indexOf("section")];

				//User defined
				if (section === "User defined") {
					userDefined[field] = value;
				} else {
					// TODO: move "if (fieldOptionsEnum.options.includes(fieldName))" from parseSchemaToObject into here as an if-else-if block to allow for error handling if NONE of the schemas have this field
					//Project Level
					//project table
					parseSchemaToObject(value, field, projectCol, ProjectOptionalDefaultsSchema, ProjectScalarFieldEnumSchema);

					//primer table
					parseSchemaToObject(value, field, projectCol, PrimerOptionalDefaultsSchema, PrimerScalarFieldEnumSchema);

					//assay table
					parseSchemaToObject(value, field, projectCol, AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema);

					//library table
					parseSchemaToObject(value, field, projectCol, LibraryOptionalDefaultsSchema, LibraryScalarFieldEnumSchema);

					//analysis table
					parseSchemaToObject(value, field, projectCol, AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema);

					//Assay Levels
					for (let i = projectFileHeaders.indexOf("project_level") + 1; i < projectFileHeaders.length; i++) {
						//flip table from long to wide
						//constucting objects whose keys are "levels" (ssu16sv4v5, ssu18sv9)
						//and whose values are an object representing a single "row"
						if (currentLine[i]) {
							//Primers
							if (!primerCols[projectFileHeaders[i]]) {
								primerCols[projectFileHeaders[i]] = {};
							}
							parseSchemaToObject(
								currentLine[i],
								field,
								primerCols[projectFileHeaders[i]],
								PrimerOptionalDefaultsSchema,
								PrimerScalarFieldEnumSchema
							);

							//Assays
							if (!assayCols[projectFileHeaders[i]]) {
								assayCols[projectFileHeaders[i]] = {};
							}
							parseSchemaToObject(
								currentLine[i],
								field,
								assayCols[projectFileHeaders[i]],
								AssayOptionalDefaultsSchema,
								AssayScalarFieldEnumSchema
							);

							//Libraries
							if (!libraryCols[projectFileHeaders[i]]) {
								libraryCols[projectFileHeaders[i]] = {};
							}
							parseSchemaToObject(
								currentLine[i],
								field,
								libraryCols[projectFileHeaders[i]],
								LibraryOptionalDefaultsSchema,
								LibraryScalarFieldEnumSchema
							);
						}
					}
				}
			}

			//@ts-ignore issue with Json database type
			const parsedProject = ProjectOptionalDefaultsSchema.safeParse(
				{
					...projectCol,
					userIds: [userId],
					isPrivate,
					userDefined: Object.keys(userDefined).length ? userDefined : "JsonNull",
					editHistory: "JsonNull"
				},
				{
					errorMap: (error, ctx) => {
						return {
							message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${projectCol[error.path[0]]}`
						};
					}
				}
			);

			if (!parsedProject.success) {
				return {
					statusMessage: "error",
					error:
						`Table: Project\n` +
						`Key: ${projectCol.project_id}\n\n` +
						`${parsedProject.error.issues.map((e) => e.message).join("\n\n")}`
				};
			}

			//@ts-ignore issue with Json database type
			project = parsedProject.data;

			for (let p of Object.values(primerCols)) {
				const parsedPrimer = PrimerOptionalDefaultsSchema.safeParse(
					{
						//most specific overrides least specific
						...projectCol,
						...p,
						userIds: [userId],
						isPrivate
					},
					{
						errorMap: (error, ctx) => {
							return {
								message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
									p[error.path[0]] || projectCol[error.path[0]]
								}`
							};
						}
					}
				);

				if (!parsedPrimer.success) {
					return {
						statusMessage: "error",
						error:
							`Table: Primer\n` +
							`Key: ${p.pcr_primer_forward || projectCol.pcr_primer_forward}\n` +
							`Key: ${p.pcr_primer_reverse || projectCol.pcr_primer_reverse}\n\n` +
							`${parsedPrimer.error.issues.map((e) => e.message).join("\n\n")}`
					};
				}

				primers.push(parsedPrimer.data);
			}
		}

		//Library file
		console.log("library file");
		//code block to force garbage collection
		{
			//parse file
			const libraryFileLines = (await parsed.data.library.text()).replace(/[\r]+/gm, "").split("\n");
			let sectionRow = null as null | string[];
			let libraryFileHeaders = null as null | string[];
			//iterate over each row
			for (let i = 1; i < libraryFileLines.length; i++) {
				const currentLine = libraryFileLines[i].split("\t");

				// remove comments
				if (currentLine[0][0] === "#") {
					if (currentLine[0].toLowerCase() === "# section") {
						sectionRow = currentLine;
					}
				} else {
					if (sectionRow === null) {
						throw new Error("No section information provided for libraries.");
					} else if (libraryFileHeaders === null) {
						libraryFileHeaders = currentLine;
					} else if (currentLine[libraryFileHeaders.indexOf("samp_name")]) {
						const assayRow = {} as AssayPartial;
						const libraryRow = {} as LibraryPartial;
						const userDefined = {} as PrismaJson.UserDefinedType;

						//iterate over each column
						for (let j = 0; j < libraryFileHeaders.length; j++) {
							//User defined
							if (sectionRow[j] === "User defined") {
								userDefined[libraryFileHeaders[j]] = currentLine[j];
							} else {
								//assay table
								parseSchemaToObject(
									currentLine[j],
									libraryFileHeaders[j],
									assayRow,
									AssayOptionalDefaultsSchema,
									AssayScalarFieldEnumSchema
								);

								//library table
								parseSchemaToObject(
									currentLine[j],
									libraryFileHeaders[j],
									libraryRow,
									LibraryOptionalDefaultsSchema,
									LibraryScalarFieldEnumSchema
								);
							}
						}

						if (libraryRow.samp_name && assayRow.assay_name) {
							sampToAssay[libraryRow.samp_name] = assayRow.assay_name;
							libToAssay[currentLine[libraryFileHeaders.indexOf("library_id")]] = assayRow.assay_name;

							//if the assay doesn't exist yet, add it to the assays array
							//TODO: do not create new assays, as they should ALL already exist in the database
							if (!assays[assayRow.assay_name]) {
								//TODO: build assay object from projectMetadata
								const parsedAssay = AssayOptionalDefaultsSchema.safeParse(
									//TODO: use assay_name field, not column header
									{
										//most specific overrides least specific
										...projectCol,
										...assayCols[assayRow.assay_name],
										...assayRow,
										userIds: [userId],
										isPrivate
									},
									{
										errorMap: (error, ctx) => {
											console.log(error);
											console.log(ctx);
											return {
												message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
													assayRow[error.path[0] as keyof typeof assayRow] || projectCol[error.path[0]]
												}`
											};
										}
									}
								);

								if (!parsedAssay.success) {
									return {
										statusMessage: "error",
										error:
											`Table: Assay\n` +
											`Key: ${assayRow.assay_name}\n\n` +
											`${parsedAssay.error.issues.map((e) => e.message).join("\n\n")}`
									};
								}

								assays[assayRow.assay_name] = parsedAssay.data;
							}

							const parsedLibrary = LibraryOptionalDefaultsSchema.safeParse(
								{
									//most specific overrides lease specific
									...projectCol,
									...libraryCols[assayRow.assay_name], //TODO: 10 fields are replicated for every library, inefficient database usage
									...libraryRow,
									userIds: [userId],
									userDefined: Object.keys(userDefined).length ? userDefined : "JsonNull",
									isPrivate
								},
								{
									errorMap: (error, ctx) => {
										return {
											message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
												libraryRow[error.path[0] as keyof typeof libraryRow] || projectCol[error.path[0]]
											}`
										};
									}
								}
							);

							if (!parsedLibrary.success) {
								return {
									statusMessage: "error",
									error:
										`Table: Library\n` +
										`Key: ${libraryRow.lib_id}\n\n` +
										`${parsedLibrary.error.issues.map((e) => e.message).join("\n\n")}`
								};
							}

							//@ts-ignore issue with Json database type
							libraries.push(parsedLibrary.data);
						} else {
							throw new Error("Missing samp_name or assay_name in Library metadata.");
						}
					}
				}
			}
		}

		//Sample file
		console.log("sample file");
		//code block to force garbage collection
		{
			const sampleFileLines = (await parsed.data.sample.text()).replace(/[\r]+/gm, "").split("\n");
			let sectionRow = null as null | string[];
			let sampleFileHeaders = null as null | string[];
			//iterate over each row
			for (let i = 1; i < sampleFileLines.length; i++) {
				const currentLine = sampleFileLines[i].split("\t");

				// remove comments
				if (currentLine[0][0] === "#") {
					if (currentLine[0].toLowerCase() === "# section") {
						sectionRow = currentLine;
					}
				} else {
					if (sectionRow === null) {
						throw new Error("No section information provided for samples.");
					} else if (sampleFileHeaders === null) {
						sampleFileHeaders = currentLine;
					} else if (currentLine[sampleFileHeaders.indexOf("samp_name")]) {
						const sampleRow = {} as SamplePartial;
						const userDefined = {} as PrismaJson.UserDefinedType;

						for (let j = 0; j < sampleFileHeaders.length; j++) {
							//User defined
							if (sectionRow[j] === "User defined") {
								userDefined[sampleFileHeaders[j]] = currentLine[j];
							} else {
								//sample table
								parseSchemaToObject(
									currentLine[j],
									sampleFileHeaders[j],
									sampleRow,
									SampleOptionalDefaultsSchema,
									SampleScalarFieldEnumSchema
								);
							}
						}

						if (sampleRow.samp_name) {
							const parsedSample = SampleOptionalDefaultsSchema.safeParse(
								{
									...sampleRow,
									project_id: projectCol.project_id,
									assay_name: sampToAssay[sampleRow.samp_name],
									userIds: [userId],
									userDefined: Object.keys(userDefined).length ? userDefined : "JsonNull",
									isPrivate
								},
								{
									errorMap: (error, ctx) => {
										return {
											message: `Field: ${error.path[0]}\nIssue: ${ctx.defaultError}\nValue: ${
												sampleRow[error.path[0] as keyof typeof sampleRow]
											}`
										};
									}
								}
							);

							if (!parsedSample.success) {
								return {
									statusMessage: "error",
									error:
										`Table: Sample\n` +
										`Key: ${sampleRow.samp_name}\n\n` +
										`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
								};
							}
							//@ts-ignore issue with Json database type
							samples.push(parsedSample.data);
						}
					}
				}
			}
		}

		console.log("project transaction");
		await prisma.$transaction(
			async (tx) => {
				//project
				console.log("project");
				await tx.project.create({
					data: project
				});

				//primers
				//features
				console.log("primers");
				for (let p of primers) {
					const primer = await tx.primer.upsert({
						where: {
							pcr_primer_forward_pcr_primer_reverse: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							}
						},
						update: {
							...(!isPrivate ? { isPrivate: false } : {}) //only update isPrivate if it's false
						},
						create: p,
						select: {
							userIds: true
						}
					});

					if (!primer.userIds.includes(userId)) {
						await tx.primer.update({
							where: {
								pcr_primer_forward_pcr_primer_reverse: {
									pcr_primer_forward: p.pcr_primer_forward,
									pcr_primer_reverse: p.pcr_primer_reverse
								}
							},
							data: {
								userIds: {
									push: userId
								}
							}
						});
					}
				}

				//assays and samples
				console.log("assays and samples");
				for (let a of Object.values(assays)) {
					const existingAssay = await tx.assay.findUnique({
						where: {
							assay_name: a.assay_name
						},
						select: {
							isPrivate: true,
							userIds: true
						}
					});

					const reducedSamples = samples.reduce((filtered, samp) => {
						if (sampToAssay[samp.samp_name] === a.assay_name) {
							filtered.push({
								where: {
									samp_name: samp.samp_name
								},
								create: samp
							});
						}
						return filtered;
					}, [] as Prisma.SampleCreateOrConnectWithoutAssaysInput[]);

					await tx.assay.upsert({
						where: {
							assay_name: a.assay_name
						},
						update: {
							isPrivate: isPrivate && existingAssay && existingAssay.isPrivate ? true : false,
							Samples: {
								connectOrCreate: reducedSamples
							}
						},
						create: {
							...a,
							Samples: {
								connectOrCreate: reducedSamples
							}
						}
					});

					if (existingAssay && !existingAssay.userIds.includes(userId)) {
						await tx.assay.update({
							where: {
								assay_name: a.assay_name
							},
							data: {
								userIds: {
									push: userId
								}
							}
						});
					}
				}

				//libraries
				await batchSubmit(tx, libraries, "library", "lib_id", userId, isPrivate);
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		revalidatePath("/explore");
		return { statusMessage: "success" };
	} catch (err: any) {
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			return handlePrismaError(err);
		}

		const error = err as Error;
		return { statusMessage: "error", error: error.message };
	}
}
