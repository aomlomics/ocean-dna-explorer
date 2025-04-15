"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/app/helpers/prisma";
import { parseSchemaToObject } from "@/app/helpers/utils";
import {
	AnalysisOptionalDefaultsSchema,
	AnalysisScalarFieldEnumSchema,
	AssayOptionalDefaultsSchema,
	AssayPartial,
	AssayScalarFieldEnumSchema,
	LibraryOptionalDefaultsSchema,
	LibraryPartial,
	LibraryScalarFieldEnumSchema,
	SampleOptionalDefaultsSchema,
	SamplePartial,
	SampleScalarFieldEnumSchema,
	ProjectOptionalDefaultsSchema,
	ProjectScalarFieldEnumSchema
} from "@/prisma/schema/generated/zod";
import { SubmitActionReturn } from "@/types/types";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

//https://clerk.com/docs/organizations/verify-user-permissions
export default async function projectSubmitAction(formData: FormData): SubmitActionReturn {
	console.log("project submit");

	const { userId } = await auth();
	if (!userId) {
		return { message: "Error", error: "Unauthorized" };
	}

	try {
		let project = {} as Prisma.ProjectCreateInput;
		const assays = {} as Record<string, Prisma.AssayCreateManyInput>;
		const libraries = [] as Prisma.LibraryCreateManyInput[];
		const samples = [] as Prisma.SampleCreateManyInput[];

		const projectCol = {} as Record<string, string>;
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
										...projectCol
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
								//assay table
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

				//assays and samples
				console.log("assays and samples");
				for (let a of Object.values(assays)) {
					const existingAssay = await tx.assay.findUnique({
						where: {
							assay_name: a.assay_name
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
							isPrivate: isPrivate && existingAssay && existingAssay.isPrivate,
							Samples: {
								connectOrCreate: reducedSamples
							}
						},
						create: {
							...a,
							isPrivate,
							Samples: {
								connectOrCreate: reducedSamples
							}
						}
					});
				}

				//libraries
				// TODO: update isPrivate on entries that are skipped because of skipDuplicates
				await tx.library.createMany({
					data: libraries,
					skipDuplicates: true
				});
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		revalidatePath("/explore");
		return { message: "Success" };
	} catch (err) {
		const error = err as Error;
		console.error(error.message);
		return { message: "Error", error: error.message };
	}
}
