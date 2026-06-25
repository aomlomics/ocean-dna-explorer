import {
	AnalysisScalarFieldEnumSchema,
	AssayPrepOptionalDefaultsSchema,
	AssayPrepScalarFieldEnumSchema,
	AssayOptionalDefaultsSchema,
	AssayScalarFieldEnumSchema,
	LibraryOptionalDefaultsSchema,
	LibraryScalarFieldEnumSchema,
	ProjectOptionalDefaultsSchema,
	ProjectScalarFieldEnumSchema,
	SampleOptionalDefaultsSchema,
	SampleScalarFieldEnumSchema
} from "@/prisma/generated/zod";
import { parseSchemaToObject } from "../schema";
import { md5 } from "js-md5";
import { parse } from "csv-parse";
import { Library, Project, Sample } from "@/app/generated/prisma/client";
import { Channel } from "../progress";
import {
	AssayCreateManyInput,
	AssayPrepCreateManyInput,
	LibraryCreateManyInput,
	ProjectCreateInput,
	SampleCreateManyInput
} from "@/app/generated/prisma/models";

async function parseProjectFile({
	channel,
	userIds,
	sampleUrl,
	libraryUrl,
	imageFileUrl,
	oldChecksum
}: {
	channel: Channel;
	userIds: Project["userIds"];
	sampleUrl: Project["sampleMetadataFileUrl_ODE"];
	libraryUrl: Project["libraryMetadataFileUrl_ODE"];
	imageFileUrl?: Project["imageFileUrl_ODE"];
	oldChecksum?: Project["projectMetadataFileChecksum_ODE"];
}) {
	try {
		const projectCol = {} as Record<string, string>;
		const assayCols = {} as Record<string, Record<string, string>>;

		const projectUserDefined = {} as PrismaJson.UserDefinedType;

		let assayNames = [] as string[];

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

		const projectParser = parse(projectText, { columns: true, delimiter: "\t", relax_quotes: true });
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
					!AssayPrepScalarFieldEnumSchema.safeParse(field).success &&
					!LibraryScalarFieldEnumSchema.safeParse(field).success &&
					!AnalysisScalarFieldEnumSchema.safeParse(field).success
				) {
					projectUserDefined[field] = value;
				} else {
					//Project Level
					parseSchemaToObject(field, value, projectCol, "project");
					parseSchemaToObject(field, value, projectCol, "sample");
					parseSchemaToObject(field, value, projectCol, "assay");
					parseSchemaToObject(field, value, projectCol, "assayPrep");
					parseSchemaToObject(field, value, projectCol, "library");
					parseSchemaToObject(field, value, projectCol, "analysis");

					//Assay Levels
					for (const assay_name of assayNames) {
						//flip table from long to wide
						//constucting objects whose keys are "levels" (ssu16sv4v5, ssu18sv9)
						//and whose values are an object representing a single "row"
						if (record[assay_name]) {
							//Assays
							if (!assayCols[assay_name]) {
								assayCols[assay_name] = {};
							}

							parseSchemaToObject(field, record[assay_name], assayCols[assay_name], "assay");
							parseSchemaToObject(field, record[assay_name], assayCols[assay_name], "assayPrep");
							parseSchemaToObject(field, record[assay_name], assayCols[assay_name], "library");
						}
					}
				}

				//add to progress bar every 10 percent
				if (i % (projectParser.info.records / 10) === 0) {
					await channel.stream.message(
						`Processed line ${i} of ${projectParser.info.records}.`,
						(i / projectParser.info.records) * 50 + 25
					);
				}
			}
		}

		const parsedProject = ProjectOptionalDefaultsSchema.safeParse(
			{
				...projectCol,
				userIds: userIds,
				userDefined: Object.keys(projectUserDefined).length ? projectUserDefined : "JsonNull",
				editHistory: "JsonNull",
				projectMetadataFileUrl_ODE: channel.url,
				projectMetadataFileChecksum_ODE: projectMd5,
				imageFileUrl_ODE: imageFileUrl,
				sampleMetadataFileUrl_ODE: sampleUrl,
				libraryMetadataFileUrl_ODE: libraryUrl,
				//placeholders, must override later
				sampleMetadataFileChecksum_ODE: "",
				libraryMetadataFileChecksum_ODE: ""
			},
			{
				error: (iss) => {
					return {
						message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
					};
				}
			}
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

		const assays = [] as AssayCreateManyInput[];
		const assayPreps = [] as AssayPrepCreateManyInput[];
		for (const assay_name of assayNames) {
			//assay
			const parsedAssay = AssayOptionalDefaultsSchema.safeParse({
				...projectCol,
				...assayCols[assay_name],
				assay_name
			});
			if (!parsedAssay.success) {
				await channel.stream.error(
					`Table: Assay\n` + `Key: ${assay_name}\n\n` + `${parsedAssay.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}
			assays.push(parsedAssay.data);

			//assayPrep
			const parsedAssayPrep = AssayPrepOptionalDefaultsSchema.safeParse({
				...projectCol,
				...assayCols[assay_name],
				assay_name,
				project_id: projectCol.project_id
			});
			if (!parsedAssayPrep.success) {
				await channel.stream.error(
					`Table: AssayPrep\n` +
						`Key: ${assay_name}\n\n` +
						`${parsedAssayPrep.error.issues.map((e) => e.message).join("\n\n")}`
				);
				return;
			}
			assayPreps.push(parsedAssayPrep.data);
		}

		await channel.stream.message("All entries successfully parsed into database format.", 75);

		return {
			project: parsedProject.data as unknown as ProjectCreateInput,
			assays,
			assayPreps,
			projectCol,
			assayCols,
			projectMd5
		};
	} catch (err) {
		const error = err as Error;
		await channel.stream.error(error.message);
		throw error;
	}
}

async function parseLibraryFile({
	channel,
	projectCol,
	assayCols,
	oldChecksum
}: {
	channel: Channel;
	projectCol: Record<string, string>;
	assayCols: Record<string, Record<string, string>>;
	oldChecksum?: Project["libraryMetadataFileChecksum_ODE"];
}) {
	try {
		const libraries = [] as LibraryCreateManyInput[];

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
			comment_no_infix: true,
			relax_quotes: true
		});
		await channel.stream.message("File read into memory", 25);

		let i = 0;
		for await (const record of libraryParser) {
			if (record.lib_id) {
				i++;

				const libraryRow = {} as Library;
				const libraryUserDefined = {} as PrismaJson.UserDefinedType;

				//iterate over each column
				for (const [field, v] of Object.entries(record)) {
					const value = v as string;
					//User defined
					if (!LibraryScalarFieldEnumSchema.safeParse(field).success) {
						libraryUserDefined[field] = value;
					} else {
						parseSchemaToObject(field, value, libraryRow, "library");
					}
				}

				const parsedLibrary = LibraryOptionalDefaultsSchema.safeParse(
					{
						//most specific overrides lease specific
						...projectCol,
						...assayCols[libraryRow.assay_name],
						...libraryRow,
						userDefined: Object.keys(libraryUserDefined).length ? libraryUserDefined : "JsonNull"
					},
					{
						error: (iss) => {
							return {
								message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
							};
						}
					}
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
				libraries.push(parsedLibrary.data as LibraryCreateManyInput);

				//add to progress bar every 10 percent
				if (i % (libraryParser.info.records / 10) === 0) {
					await channel.stream.message(
						`Processed Library ${parsedLibrary.data.lib_id}, row ${i} of ${libraryParser.info.records}.`,
						(i / libraryParser.info.records) * 50 + 25
					);
				}
			}
		}

		await channel.stream.message("All entries successfully parsed into database format.", 75);

		return { libraries, libraryMd5 };
	} catch (err) {
		const error = err as Error;
		await channel.stream.error(error.message);
		throw error;
	}
}

async function parseSampleFile({
	channel,
	projectCol,
	oldChecksum
}: {
	channel: Channel;
	projectCol: Record<string, string>;
	oldChecksum?: Project["sampleMetadataFileChecksum_ODE"];
}) {
	try {
		const samples = [] as SampleCreateManyInput[];

		//fetch file from blob storage
		await channel.stream.message("Downloading file", 10);
		const sampleFileResponse = await fetch(channel.url);
		if (!sampleFileResponse.ok) {
			await channel.stream.error(
				`Sample file responded ${sampleFileResponse.status}: ${sampleFileResponse.statusText}.`
			);
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
			comment_no_infix: true,
			relax_quotes: true
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
						...projectCol,
						...sampleRow,
						userDefined: Object.keys(sampleUserDefined).length ? sampleUserDefined : "JsonNull"
					},
					{
						error: (iss) => {
							return {
								message: `Field: ${iss.path![0] as string}\nIssue: ${iss.code}\nValue: ${iss.input}`
							};
						}
					}
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
				samples.push(parsedSample.data as SampleCreateManyInput);

				//add to progress bar every 10 percent
				if (i % (sampleParser.info.records / 10) === 0) {
					await channel.stream.message(
						`Processed Sample ${parsedSample.data.samp_name}, row ${i} of ${sampleParser.info.records}.`,
						(i / sampleParser.info.records) * 50 + 25
					);
				}
			}
		}

		await channel.stream.message("All entries successfully parsed into database format.", 75);

		return { samples, sampleMd5 };
	} catch (err) {
		const error = err as Error;
		await channel.stream.error(error.message);
		throw error;
	}
}

//TODO: allow empty rows in submission files
export async function parseProjectFiles({
	projectChannel,
	sampleChannel,
	libraryChannel,
	userIds,
	imageFileUrl,
	oldChecksums
}: {
	projectChannel: Channel;
	sampleChannel: Channel;
	libraryChannel: Channel;
	userIds: Project["userIds"];
	imageFileUrl?: Project["imageFileUrl_ODE"];
	oldChecksums?: {
		projectMd5?: Project["projectMetadataFileChecksum_ODE"];
		sampleMd5?: Project["sampleMetadataFileChecksum_ODE"];
		libraryMd5?: Project["libraryMetadataFileChecksum_ODE"];
	};
}) {
	const projectParseResult = await parseProjectFile({
		channel: projectChannel,
		userIds,
		sampleUrl: sampleChannel.url,
		libraryUrl: libraryChannel.url,
		imageFileUrl,
		oldChecksum: oldChecksums?.projectMd5
	});
	if (!projectParseResult) {
		return;
	}
	const { project, projectMd5, projectCol, assayCols, assays, assayPreps } = projectParseResult;

	const libraryParseResult = await parseLibraryFile({
		channel: libraryChannel,
		projectCol,
		assayCols,
		oldChecksum: oldChecksums?.libraryMd5
	});
	if (!libraryParseResult) {
		return;
	}
	const { libraries, libraryMd5 } = libraryParseResult;

	const sampleParseResult = await parseSampleFile({
		channel: sampleChannel,
		projectCol,
		oldChecksum: oldChecksums?.sampleMd5
	});
	if (!sampleParseResult) {
		return;
	}
	const { samples, sampleMd5 } = sampleParseResult;

	return {
		project: {
			...project,
			sampleMetadataFileChecksum_ODE: sampleMd5,
			libraryMetadataFileChecksum_ODE: libraryMd5
		},
		assays,
		assayPreps,
		samples,
		libraries,
		checksums: {
			projectMd5,
			sampleMd5,
			libraryMd5
		}
	};
}
