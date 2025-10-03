import {
	AnalysisScalarFieldEnumSchema,
	AssayOptionalDefaultsSchema,
	AssayScalarFieldEnumSchema,
	LibraryOptionalDefaultsSchema,
	LibraryScalarFieldEnumSchema,
	ProjectOptionalDefaultsSchema,
	ProjectScalarFieldEnumSchema,
	SampleOptionalDefaultsSchema,
	SampleScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { createProgressStream } from "../progress";
import { parseSchemaToObject } from "../schema";
import { md5 } from "js-md5";
import { parse } from "csv-parse";
import { Assay, Library, Prisma, Sample } from "@/app/generated/prisma/client";

export type Channel = { url: string; stream: ReturnType<typeof createProgressStream> };

async function parseProjectFile({
	channel,
	userIds,
	sampleUrl,
	libraryUrl,
	isPrivate,
	oldChecksum
}: {
	channel: Channel;
	userIds: string[];
	sampleUrl: string;
	libraryUrl: string;
	isPrivate?: boolean;
	oldChecksum?: string;
}) {
	const projectCol = {} as Record<string, string>;
	const primerCols = {} as Record<string, Record<string, string>>;
	const assayCols = {} as Record<string, Record<string, string>>;
	const libraryCols = {} as Record<string, Record<string, string>>;

	const projectUserDefined = {} as PrismaJson.UserDefinedType;

	let assayNames = [] as string[];
	const primers = [] as Prisma.PrimerCreateManyInput[];

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const projectFileResponse = await fetch(channel.url);
	if (!projectFileResponse.ok) {
		await channel.stream.error(
			`Project file responded ${projectFileResponse.status}: ${projectFileResponse.statusText}.`
		);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const projectText = await projectFileResponse.text();
	const projectMd5 = md5(projectText);

	if (oldChecksum === projectMd5) {
		await channel.stream.error(
			"Checksum for submitted projectMetadata file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const projectParser = parse(projectText, { columns: true, delimiter: "\t" });
	await channel.stream.message("File read into memory", 25);

	let i = 0;
	for await (const record of projectParser) {
		if (!assayNames.length) {
			const fileHeaders = Object.keys(record);

			//check if headers have term_name
			if (!fileHeaders.includes("term_name")) {
				await channel.stream.error('No column with title "term_name" found.');
				return;
			}

			//check if headers have project_level
			if (!fileHeaders.includes("project_level")) {
				await channel.stream.error('No column with title "project_level" found.');
				return;
			}

			assayNames = fileHeaders.slice(fileHeaders.indexOf("project_level") + 1);
			if (!assayNames.length) {
				await channel.stream.error("No Assays found.");
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
				!SampleScalarFieldEnumSchema.safeParse(field).success &&
				!AssayScalarFieldEnumSchema.safeParse(field).success &&
				!PrimerScalarFieldEnumSchema.safeParse(field).success &&
				!LibraryScalarFieldEnumSchema.safeParse(field).success &&
				!AnalysisScalarFieldEnumSchema.safeParse(field).success
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

				//library table
				parseSchemaToObject(field, value, projectCol, "library");

				//analysis table
				parseSchemaToObject(field, value, projectCol, "analysis");

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

						//Libraries
						if (!libraryCols[assay_name]) {
							libraryCols[assay_name] = {};
						}
						parseSchemaToObject(field, record[assay_name], libraryCols[assay_name], "library");
					}
				}
			}

			//add to progress bar
			await channel.stream.message(
				`Processed line ${i} of ${projectParser.info.records}.`,
				(i / projectParser.info.records) * 50 + 25
			);
		}
	}

	for (let p of Object.values(primerCols)) {
		const parsedPrimer = PrimerOptionalDefaultsSchema.safeParse(
			{
				//most specific overrides least specific
				...projectCol,
				...p
			}
			// {
			// 	errorMap: (error, ctx) => {
			// 		return {
			// 			message: `Field: ${error.path[0]}\nIssue: ${
			// 				ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
			// 			}\nValue: ${p[error.path[0]] || projectCol[error.path[0]]}`
			// 		};
			// 	}
			// }
		);

		if (!parsedPrimer.success) {
			await channel.stream.error(
				`Table: Primer\n` +
					`Key: ${p.pcr_primer_forward || projectCol.pcr_primer_forward}\n` +
					`Key: ${p.pcr_primer_reverse || projectCol.pcr_primer_reverse}\n\n` +
					`${parsedPrimer.error.issues.map((e) => e.message).join("\n\n")}`
			);
			return;
		}

		//unset all optional fields that were not provided
		for (const field of PrimerScalarFieldEnumSchema.options) {
			if (field !== "id" && !(field in parsedPrimer.data)) {
				//@ts-ignore
				parsedPrimer.data[field] = null;
			}
		}

		primers.push(parsedPrimer.data);
	}

	const parsedProject = ProjectOptionalDefaultsSchema.safeParse(
		{
			...projectCol,
			userIds: userIds,
			isPrivate: isPrivate === undefined ? false : isPrivate,
			userDefined: Object.keys(projectUserDefined).length ? projectUserDefined : "JsonNull",
			editHistory: "JsonNull",
			projectMetadataFileUrl_ODE: channel.url,
			projectMetadataFileChecksum_ODE: projectMd5,
			sampleMetadataFileUrl_ODE: sampleUrl,
			libraryMetadataFileUrl_ODE: libraryUrl,
			//placeholders, must override later
			sampleMetadataFileChecksum_ODE: "",
			libraryMetadataFileChecksum_ODE: ""
		}
		// {
		// 	errorMap: (error, ctx) => {
		// 		return {
		// 			message: `Field: ${error.path[0]}\nIssue: ${
		// 				ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
		// 			}\nValue: ${projectCol[error.path[0]]}`
		// 		};
		// 	}
		// }
	);

	if (!parsedProject.success) {
		await channel.stream.error(
			`Table: Project\n` +
				`Key: ${projectCol.project_id}\n\n` +
				`${parsedProject.error.issues.map((e) => e.message).join("\n\n")}`
		);
		return;
	}

	//unset all optional fields that were not provided
	for (const field of ProjectScalarFieldEnumSchema.options) {
		if (field !== "id" && field !== "dateSubmitted" && !(field in parsedProject.data)) {
			//@ts-ignore
			parsedProject.data[field] = null;
		}
	}

	await channel.stream.message("All entries successfully parsed into database format.", 75);

	return {
		project: parsedProject.data as unknown as Prisma.ProjectCreateInput,
		projectMd5,
		primers,
		projectCol,
		assayCols,
		libraryCols
	};
}

async function parseLibraryFile({
	channel,
	projectCol,
	assayCols,
	libraryCols,
	oldChecksum
}: {
	channel: Channel;
	projectCol: Record<string, string>;
	assayCols: Record<string, Record<string, string>>;
	libraryCols: Record<string, Record<string, string>>;
	oldChecksum?: string;
}) {
	const libraries = [] as Prisma.LibraryCreateManyInput[];
	const assaysByName = {} as Record<string, Prisma.AssayCreateManyInput>;
	const sampToAssay = {} as Record<string, string>; //object to relate samples to their assay_name values

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const libraryFileResponse = await fetch(channel.url);
	if (!libraryFileResponse.ok) {
		await channel.stream.error(
			`Library file responded ${libraryFileResponse.status}: ${libraryFileResponse.statusText}.`
		);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const libraryText = await libraryFileResponse.text();
	const libraryMd5 = md5(libraryText);

	if (oldChecksum === libraryMd5) {
		await channel.stream.error(
			"Checksum for submitted libraryMetadata file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const libraryParser = parse(libraryText, {
		columns: true,
		delimiter: "\t",
		comment: "#",
		comment_no_infix: true
	});
	await channel.stream.message("File read into memory", 25);

	let i = 0;
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
					parseSchemaToObject(field, value, assayRow, "assay");

					//library table
					parseSchemaToObject(field, value, libraryRow, "library");
				}
			}

			//TODO: assay_name for assays is being gotten from libraryMetadata file, should get it elsewhere

			sampToAssay[libraryRow.samp_name] = assayRow.assay_name;

			//if the assay doesn't exist yet, add it to the assays array
			//TODO: do not create new assays, as they should ALL already exist in the database
			if (!assaysByName[assayRow.assay_name]) {
				//TODO: build assay object from projectMetadata
				const parsedAssay = AssayOptionalDefaultsSchema.safeParse(
					//TODO: use assay_name field, not column header
					{
						//most specific overrides least specific
						...projectCol,
						...assayCols[assayRow.assay_name],
						...assayRow
					}
					// {
					// 	errorMap: (error, ctx) => {
					// 		return {
					// 			message: `Field: ${error.path[0]}\nIssue: ${
					// 				ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
					// 			}\nValue: ${
					// 				assayRow[error.path[0] as keyof typeof assayRow] ||
					// 				projectCol[error.path[0] as keyof typeof projectCol]
					// 			}`
					// 		};
					// 	}
					// }
				);

				if (!parsedAssay.success) {
					await channel.stream.error(
						`Table: Assay\n` +
							`Key: ${assayRow.assay_name}\n\n` +
							`${parsedAssay.error.issues.map((e) => e.message).join("\n\n")}`
					);
					return;
				}

				for (const field of AssayScalarFieldEnumSchema.options) {
					if (field !== "id" && !(field in parsedAssay.data)) {
						//@ts-ignore
						parsedAssay.data[field] = null;
					}
				}

				assaysByName[assayRow.assay_name] = parsedAssay.data;
			}

			const parsedLibrary = LibraryOptionalDefaultsSchema.safeParse(
				{
					//most specific overrides lease specific
					...projectCol,
					...libraryCols[assayRow.assay_name], //TODO: 10 fields are replicated for every library, inefficient database usage
					...libraryRow,
					userDefined: Object.keys(libraryUserDefined).length ? libraryUserDefined : "JsonNull"
				}
				// {
				// 	errorMap: (error, ctx) => {
				// 		return {
				// 			message: `Field: ${error.path[0]}\nIssue: ${
				// 				ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
				// 			}\nValue: ${
				// 				libraryRow[error.path[0] as keyof typeof libraryRow] ||
				// 				projectCol[error.path[0] as keyof typeof projectCol]
				// 			}`
				// 		};
				// 	}
				// }
			);

			if (!parsedLibrary.success) {
				await channel.stream.error(
					`Table: Library\n` +
						`Key: ${libraryRow.lib_id}\n\n` +
						`${parsedLibrary.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//unset all optional fields that were not provided
			for (const field of LibraryScalarFieldEnumSchema.options) {
				if (field !== "id" && !(field in parsedLibrary.data)) {
					//@ts-ignore
					parsedLibrary.data[field] = null;
				}
			}

			libraries.push(parsedLibrary.data as Prisma.LibraryCreateManyInput);

			//add to progress bar
			await channel.stream.message(
				`Processed Library ${parsedLibrary.data.lib_id}, row ${i} of ${libraryParser.info.records}.`,
				(i / libraryParser.info.records) * 50 + 25
			);
		}
	}

	await channel.stream.message("All entries successfully parsed into database format.", 75);

	return { libraries, libraryMd5, assaysByName, sampToAssay };
}

async function parseSampleFile({
	channel,
	project_id,
	assaysByName,
	sampToAssay,
	oldChecksum
}: {
	channel: Channel;
	project_id: Sample["project_id"];
	assaysByName: Record<string, Prisma.AssayCreateManyInput>;
	sampToAssay: Record<string, string>;
	oldChecksum?: string;
}) {
	const samples = [] as Prisma.SampleCreateManyInput[];

	//fetch file from blob storage
	await channel.stream.message("Downloading file", 10);
	const sampleFileResponse = await fetch(channel.url);
	if (!sampleFileResponse.ok) {
		await channel.stream.error(`Sample file responded ${sampleFileResponse.status}: ${sampleFileResponse.statusText}.`);
		return;
	}

	await channel.stream.message("Reading file into memory", 15);
	const sampleText = await sampleFileResponse.text();
	const sampleMd5 = md5(sampleText);

	if (oldChecksum === sampleMd5) {
		await channel.stream.error(
			"Checksum for submitted sampleMetadata file matches the checksum of the previous file. Please submit a new file."
		);
		return;
	}

	const sampleParser = parse(sampleText, {
		columns: true,
		delimiter: "\t",
		comment: "#",
		comment_no_infix: true
	});
	await channel.stream.message("File read into memory", 25);

	let i = 0;
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
					parseSchemaToObject(field, value, sampleRow, "sample");
				}
			}

			const parsedSample = SampleOptionalDefaultsSchema.safeParse(
				{
					...sampleRow,
					project_id,
					assay_name: sampToAssay[sampleRow.samp_name],
					userDefined: Object.keys(sampleUserDefined).length ? sampleUserDefined : "JsonNull"
				}
				// {
				// 	errorMap: (error, ctx) => {
				// 		return {
				// 			message: `Field: ${error.path[0]}\nIssue: ${
				// 				ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
				// 			}\nValue: ${sampleRow[error.path[0] as keyof typeof sampleRow]}`
				// 		};
				// 	}
				// }
			);

			if (!parsedSample.success) {
				await channel.stream.error(
					`Table: Sample\n` +
						`Key: ${sampleRow.samp_name}\n\n` +
						`${parsedSample.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}

			//unset all optional fields that were not provided
			for (const field of SampleScalarFieldEnumSchema.options) {
				if (field !== "id" && !(field in parsedSample.data)) {
					//@ts-ignore
					parsedSample.data[field] = null;
				}
			}

			//@ts-ignore issue with Json database type
			samples.push(parsedSample.data);

			//add to progress bar
			await channel.stream.message(
				`Processed Sample ${parsedSample.data.samp_name}, row ${i} of ${sampleParser.info.records}.`,
				(i / sampleParser.info.records) * 50 + 25
			);
		}
	}

	const reducedSamples = {} as Record<string, Prisma.SampleCreateOrConnectWithoutAssaysInput[]>;
	for (let a of Object.values(assaysByName)) {
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

	await channel.stream.message("All entries successfully parsed into database format.", 75);

	return { samples, samplesByAssay: reducedSamples, sampleMd5 };
}

export async function parseProjectFiles({
	projectChannel,
	sampleChannel,
	libraryChannel,
	userIds,
	isPrivate,
	oldChecksums
}: {
	projectChannel: Channel;
	sampleChannel: Channel;
	libraryChannel: Channel;
	userIds: string[];
	isPrivate?: boolean;
	oldChecksums?: { projectMd5?: string; sampleMd5?: string; libraryMd5?: string };
}) {
	const projectParseResult = await parseProjectFile({
		channel: projectChannel,
		userIds,
		sampleUrl: sampleChannel.url,
		libraryUrl: libraryChannel.url,
		isPrivate,
		oldChecksum: oldChecksums?.projectMd5
	});
	if (!projectParseResult) {
		return;
	}
	const { project, projectMd5, primers, projectCol, assayCols, libraryCols } = projectParseResult;

	const libraryParseResult = await parseLibraryFile({
		channel: libraryChannel,
		projectCol,
		assayCols,
		libraryCols,
		oldChecksum: oldChecksums?.libraryMd5
	});
	if (!libraryParseResult) {
		return;
	}
	const { libraries, libraryMd5, assaysByName, sampToAssay } = libraryParseResult;

	const sampleParseResult = await parseSampleFile({
		channel: sampleChannel,
		project_id: project.project_id,
		assaysByName,
		sampToAssay,
		oldChecksum: oldChecksums?.sampleMd5
	});
	if (!sampleParseResult) {
		return;
	}
	const { samples, samplesByAssay, sampleMd5 } = sampleParseResult;

	return {
		project: {
			...project,
			sampleMetadataFileChecksum_ODE: sampleMd5,
			libraryMetadataFileChecksum_ODE: libraryMd5
		},
		primers,
		assays: Object.values(assaysByName),
		samples,
		samplesByAssay,
		libraries,
		checksums: {
			projectMd5,
			sampleMd5,
			libraryMd5
		}
	};
}
