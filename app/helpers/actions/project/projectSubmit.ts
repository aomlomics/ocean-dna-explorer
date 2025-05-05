"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/helpers/prisma";
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
import { RolePermissions } from "@/types/objects";

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
	//TODO: use zod to validate the shape of the formData

	try {
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

		const isPrivate = formData.get("isPrivate") ? true : false;

		//Project file
		console.log("project file");
		//code block to force garbage collection
		{
			//parse file
			const projectFileLines = (await (formData.get("project") as File).text()).replace(/[\r]+/gm, "").split("\n");
			const projectFileHeaders = projectFileLines[0].split("\t");
			const userDefined = {} as PrismaJson.UserDefinedType;
			//iterate over each row
			for (let i = 1; i < projectFileLines.length; i++) {
				const currentLine = projectFileLines[i].split("\t");
				const field = currentLine[projectFileHeaders.indexOf("field_name")];
				const value = currentLine[projectFileHeaders.indexOf("project_level")];

				//User defined
				if (currentLine[projectFileHeaders.indexOf("section")] === "User defined") {
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
			project = ProjectOptionalDefaultsSchema.parse(
				{
					...projectCol,
					userId,
					isPrivate,
					userDefined,
					editHistory: "JsonNull"
				},
				{
					errorMap: (error, ctx) => {
						return { message: `ProjectSchema: ${ctx.defaultError}` };
					}
				}
			);

			for (let p of Object.values(primerCols)) {
				primers.push(
					PrimerOptionalDefaultsSchema.parse(
						{
							...p,
							...projectCol,
							isPrivate
						},
						{
							errorMap: (error, ctx) => {
								return { message: `PrimerSchema: ${ctx.defaultError}` };
							}
						}
					)
				);
			}
		}

		//Library file
		console.log("library file");
		//code block to force garbage collection
		{
			//parse file
			const libraryFileLines = (await (formData.get("library") as File).text()).replace(/[\r]+/gm, "").split("\n");
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
								assays[assayRow.assay_name] = AssayOptionalDefaultsSchema.parse(
									//TODO: use assay_name field, not column header
									{
										//least specific overrides most specific
										...assayRow,
										...assayCols[assayRow.assay_name],
										...projectCol,
										isPrivate
									},
									{
										errorMap: (error, ctx) => {
											return { message: `AssaySchema: ${ctx.defaultError}` };
										}
									}
								);
							}

							libraries.push(
								//@ts-ignore issue with JSON database type
								LibraryOptionalDefaultsSchema.parse(
									{
										//least specific overrides most specific
										...libraryRow,
										...libraryCols[assayRow.assay_name], //TODO: 10 fields are replicated for every library, inefficient database usage
										...projectCol,
										userDefined,
										isPrivate
									},
									{
										errorMap: (error, ctx) => {
											return { message: `LibrarySchema: ${ctx.defaultError}` };
										}
									}
								)
							);
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
			const sampleFileLines = (await (formData.get("sample") as File).text()).replace(/[\r]+/gm, "").split("\n");
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
							samples.push(
								//@ts-ignore issue with Json database type
								SampleOptionalDefaultsSchema.parse(
									{
										//construct from least specific to most specific
										...sampleRow,
										project_id: projectCol.project_id,
										assay_name: sampToAssay[sampleRow.samp_name],
										userDefined,
										isPrivate
									},
									{
										errorMap: (error, ctx) => {
											return { message: `SampleSchema: ${ctx.defaultError}` };
										}
									}
								)
							);
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
				console.log("primers");
				await tx.primer.createMany({
					data: primers,
					skipDuplicates: true
				});
				//private
				if (!isPrivate) {
					for (let p of primers) {
						await tx.primer.updateMany({
							where: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							},
							data: {
								isPrivate: false
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
							isPrivate: true
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
				}

				//libraries
				await tx.library.createMany({
					data: libraries,
					skipDuplicates: true
				});
				//private
				if (!isPrivate) {
					await tx.library.updateMany({
						where: {
							lib_id: {
								in: libraries.map((lib) => lib.lib_id)
							},
							isPrivate: true
						},
						data: {
							isPrivate: false
						}
					});
				}
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		revalidatePath("/explore");
		return { statusMessage: "success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { statusMessage: "error", error: error.message };
	}
}
