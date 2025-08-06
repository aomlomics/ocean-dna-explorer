"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma } from "@/app/helpers/prisma";
import { deadBooleanToString } from "@/app/helpers/utils";
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
	SampleOptionalDefaultsSchema,
	SampleScalarFieldEnumSchema,
	Library,
	Assay,
	Sample
} from "@/prisma/generated/zod";
import { RolePermissions } from "@/types/objects";
import { parse } from "csv-parse";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";

type Channel = { file: File; stream: ReturnType<typeof createProgressStream> };

async function doSubmit(
	globalStream: ReturnType<typeof createProgressStream>,
	projectChannel: Channel,
	sampleChannel: Channel,
	libraryChannel: Channel,
	userIds: string[],
	isPrivate: boolean
) {
	console.log("project submit");

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await globalStream.error("Unauthorized");
		return;
	}

	if (!userIds.includes(userId)) {
		await globalStream.error("Must include self as a user.");
		return;
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

	try {
		//Project file
		console.log("project file");

		let assayNames = [] as string[];
		const projectUserDefined = {} as PrismaJson.UserDefinedType;

		await projectChannel.stream.message("Reading file into memory", 10);
		const projectParser = parse(await projectChannel.file.text(), { columns: true, delimiter: "\t" });
		await projectChannel.stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of projectParser) {
			if (!assayNames.length) {
				const fileHeaders = Object.keys(record);

				//check if headers have term_name
				if (!fileHeaders.includes("term_name")) {
					await projectChannel.stream.error('No column with title "term_name" found.');
					return;
				}

				//check if headers have project_level
				if (!fileHeaders.includes("project_level")) {
					await projectChannel.stream.error('No column with title "project_level" found.');
					return;
				}

				assayNames = fileHeaders.slice(fileHeaders.indexOf("project_level") + 1);
				if (!assayNames.length) {
					await projectChannel.stream.error("No Assays found.");
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
					parseSchemaToObject(
						record.term_name,
						record.project_level,
						projectCol,
						ProjectOptionalDefaultsSchema,
						ProjectScalarFieldEnumSchema
					);

					//primer table
					parseSchemaToObject(field, value, projectCol, PrimerOptionalDefaultsSchema, PrimerScalarFieldEnumSchema);

					//assay table
					parseSchemaToObject(field, value, projectCol, AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema);

					//library table
					parseSchemaToObject(field, value, projectCol, LibraryOptionalDefaultsSchema, LibraryScalarFieldEnumSchema);

					//analysis table
					parseSchemaToObject(field, value, projectCol, AnalysisOptionalDefaultsSchema, AnalysisScalarFieldEnumSchema);

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
							parseSchemaToObject(
								field,
								record[assay_name],
								primerCols[assay_name],
								PrimerOptionalDefaultsSchema,
								PrimerScalarFieldEnumSchema
							);

							//Assays
							if (!assayCols[assay_name]) {
								assayCols[assay_name] = {};
							}
							parseSchemaToObject(
								field,
								record[assay_name],
								assayCols[assay_name],
								AssayOptionalDefaultsSchema,
								AssayScalarFieldEnumSchema
							);

							//Libraries
							if (!libraryCols[assay_name]) {
								libraryCols[assay_name] = {};
							}
							parseSchemaToObject(
								field,
								record[assay_name],
								libraryCols[assay_name],
								LibraryOptionalDefaultsSchema,
								LibraryScalarFieldEnumSchema
							);
						}
					}
				}

				//add to progress bar
				await projectChannel.stream.message(
					`Processed line ${i} of ${projectParser.info.records}.`,
					(i / projectParser.info.records) * 50 + 25
				);
			}
		}

		//@ts-ignore issue with Json database type
		const parsedProject = ProjectOptionalDefaultsSchema.safeParse(
			{
				...projectCol,
				userIds: userIds,
				isPrivate,
				userDefined: Object.keys(projectUserDefined).length ? projectUserDefined : "JsonNull",
				editHistory: "JsonNull"
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
			await projectChannel.stream.error(
				`Table: Project\n` +
					`Key: ${projectCol.project_id}\n\n` +
					`${parsedProject.error.issues.map((e) => e.message).join("\n\n")}`
			);
			return;
		}

		//@ts-ignore issue with Json database type
		project = parsedProject.data;

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
				await projectChannel.stream.error(
					`Table: Primer\n` +
						`Key: ${p.pcr_primer_forward || projectCol.pcr_primer_forward}\n` +
						`Key: ${p.pcr_primer_reverse || projectCol.pcr_primer_reverse}\n\n` +
						`${parsedPrimer.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			primers.push(parsedPrimer.data);
		}

		await projectChannel.stream.message(
			"All entries successfully parsed into database format. Awaiting parsing of other files to upload to database.",
			75
		);

		//Library file
		console.log("library file");

		await libraryChannel.stream.message("Reading file into memory", 10);
		const libraryParser = parse(await libraryChannel.file.text(), {
			columns: true,
			delimiter: "\t",
			comment: "#",
			comment_no_infix: true
		});
		await libraryChannel.stream.message("File read into memory", 25);

		i = 0;
		for await (const record of libraryParser) {
			if (record.lib_id) {
				i++;

				const assayRow = {} as Assay;
				const libraryRow = {} as Library;
				const libraryUserDefined = {} as PrismaJson.UserDefinedType;

				//iterate over each column
				for (const [field, v] of Object.entries(record)) {
					const value = v as string;
					//User defined
					if (!LibraryScalarFieldEnumSchema.safeParse(field).success) {
						libraryUserDefined[field] = value;
					} else {
						//assay table
						parseSchemaToObject(field, value, assayRow, AssayOptionalDefaultsSchema, AssayScalarFieldEnumSchema);

						//library table
						parseSchemaToObject(field, value, libraryRow, LibraryOptionalDefaultsSchema, LibraryScalarFieldEnumSchema);
					}
				}

				sampToAssay[libraryRow.samp_name] = assayRow.assay_name;

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
							...assayRow
						},
						{
							errorMap: (error, ctx) => {
								return {
									message: `Field: ${error.path[0]}\nIssue: ${
										ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
									}\nValue: ${assayRow[error.path[0] as keyof typeof assayRow] || projectCol[error.path[0]]}`
								};
							}
						}
					);

					if (!parsedAssay.success) {
						await libraryChannel.stream.error(
							`Table: Assay\n` +
								`Key: ${assayRow.assay_name}\n\n` +
								`${parsedAssay.error.issues.map((e) => e.message).join("\n\n")}`
						);
						return;
					}

					assays[assayRow.assay_name] = parsedAssay.data;
				}

				const parsedLibrary = LibraryOptionalDefaultsSchema.safeParse(
					{
						//most specific overrides lease specific
						...projectCol,
						...libraryCols[assayRow.assay_name], //TODO: 10 fields are replicated for every library, inefficient database usage
						...libraryRow,
						userDefined: Object.keys(libraryUserDefined).length ? libraryUserDefined : "JsonNull"
					},
					{
						errorMap: (error, ctx) => {
							return {
								message: `Field: ${error.path[0]}\nIssue: ${
									ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
								}\nValue: ${libraryRow[error.path[0] as keyof typeof libraryRow] || projectCol[error.path[0]]}`
							};
						}
					}
				);

				if (!parsedLibrary.success) {
					await libraryChannel.stream.error(
						`Table: Library\n` +
							`Key: ${libraryRow.lib_id}\n\n` +
							`${parsedLibrary.error.issues.map((e) => e.message).join("\n\n")}`
					);
					return;
				}

				//@ts-ignore issue with Json database type
				libraries.push(parsedLibrary.data);

				//add to progress bar
				await libraryChannel.stream.message(
					`Processed Library ${parsedLibrary.data.lib_id}, row ${i} of ${libraryParser.info.records}.`,
					(i / libraryParser.info.records) * 50 + 25
				);
			}
		}

		await libraryChannel.stream.message(
			"All entries successfully parsed into database format. Awaiting parsing of other files to upload to database.",
			75
		);

		//Sample file
		console.log("sample file");

		await sampleChannel.stream.message("Reading file into memory", 10);
		const sampleParser = parse(await sampleChannel.file.text(), {
			columns: true,
			delimiter: "\t",
			comment: "#",
			comment_no_infix: true
		});
		await sampleChannel.stream.message("File read into memory", 25);

		i = 0;
		for await (const record of sampleParser) {
			if (record.samp_name) {
				i++;

				const sampleRow = {} as Sample;
				const sampleUserDefined = {} as PrismaJson.UserDefinedType;

				for (const [field, v] of Object.entries(record)) {
					const value = v as string;

					//User defined
					if (!SampleScalarFieldEnumSchema.safeParse(field).success) {
						sampleUserDefined[field] = value;
					} else {
						//sample table
						parseSchemaToObject(field, value, sampleRow, SampleOptionalDefaultsSchema, SampleScalarFieldEnumSchema);
					}
				}

				const parsedSample = SampleOptionalDefaultsSchema.safeParse(
					{
						...sampleRow,
						project_id: projectCol.project_id,
						assay_name: sampToAssay[sampleRow.samp_name],
						userDefined: Object.keys(sampleUserDefined).length ? sampleUserDefined : "JsonNull"
					},
					{
						errorMap: (error, ctx) => {
							return {
								message: `Field: ${error.path[0]}\nIssue: ${
									ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
								}\nValue: ${sampleRow[error.path[0] as keyof typeof sampleRow]}`
							};
						}
					}
				);

				if (!parsedSample.success) {
					await sampleChannel.stream.error(
						`Table: Sample\n` +
							`Key: ${sampleRow.samp_name}\n\n` +
							`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
					);
					return;
				}
				//@ts-ignore issue with Json database type
				samples.push(parsedSample.data);

				//add to progress bar
				await sampleChannel.stream.message(
					`Processed Sample ${parsedSample.data.samp_name}, row ${i} of ${sampleParser.info.records}.`,
					(i / sampleParser.info.records) * 50 + 25
				);
			}
		}

		const reducedSamples = {} as Record<string, Prisma.SampleCreateOrConnectWithoutAssaysInput[]>;
		for (let a of Object.values(assays)) {
			reducedSamples[a.assay_name] = samples.reduce((filtered, samp) => {
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
		}

		await projectChannel.stream.message(
			"All entries successfully parsed into database format. Parsing data into database.",
			75
		);
		await sampleChannel.stream.message(
			"All entries successfully parsed into database format. Parsing data into database.",
			75
		);
		await libraryChannel.stream.message(
			"All entries successfully parsed into database format. Parsing data into database.",
			75
		);

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
				for (let p of primers) {
					await tx.primer.upsert({
						where: {
							pcr_primer_forward_pcr_primer_reverse: {
								pcr_primer_forward: p.pcr_primer_forward,
								pcr_primer_reverse: p.pcr_primer_reverse
							}
						},
						update: {},
						create: p
					});
				}

				await projectChannel.stream.success("Project successfully uploaded to database.");

				//assays and samples
				console.log("assays and samples");
				for (let a of Object.values(assays)) {
					await tx.assay.upsert({
						where: {
							assay_name: a.assay_name
						},
						update: {
							Samples: {
								connectOrCreate: reducedSamples[a.assay_name]
							}
						},
						create: {
							...a,
							Samples: {
								connectOrCreate: reducedSamples[a.assay_name]
							}
						}
					});
				}

				await sampleChannel.stream.success("Samples successfully uploaded to database.");

				//libraries
				await tx.library.createMany({
					data: libraries,
					skipDuplicates: true
				});

				await libraryChannel.stream.success("Libraries successfully uploaded to database.");
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		await globalStream.success("Success");
	} catch (err: any) {
		console.log(err.message);
		if (err.constructor.name === Prisma.PrismaClientKnownRequestError.name) {
			const error = handlePrismaError(err);
			await globalStream.error(error.error);
		} else {
			const error = err as Error;
			await globalStream.error(error.message);
		}
	}
}

export default async function projectSubmitAction(
	projectFile: File,
	sampleFile: File,
	libraryFile: File,
	userIds: string[],
	isPrivate: boolean
) {
	const globalStream = createProgressStream();
	const projectStream = createProgressStream();
	const sampleStream = createProgressStream();
	const libraryStream = createProgressStream();

	doSubmit(
		globalStream,
		{ file: projectFile, stream: projectStream },
		{ file: sampleFile, stream: sampleStream },
		{ file: libraryFile, stream: libraryStream },
		userIds,
		isPrivate
	).then(() => {
		globalStream.close();
		projectStream.close();
		sampleStream.close();
		libraryStream.close();
	});

	return {
		global: globalStream.readable,
		readables: [projectStream.readable, sampleStream.readable, libraryStream.readable]
	};
}
