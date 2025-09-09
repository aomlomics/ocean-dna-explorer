"use server";

import { Library, Prisma } from "@/app/generated/prisma/client";
import { handlePrismaError, prisma, updateManyRaw } from "@/app/helpers/prisma";
import { deadBooleanToString } from "@/app/helpers/utils";
import { auth } from "@clerk/nextjs/server";
import { LibraryScalarFieldEnumSchema, LibraryOptionalDefaultsSchema } from "@/prisma/generated/zod";
import { RolePermissions } from "@/types/objects";
import { parse } from "csv-parse";
import { createProgressStream } from "@/app/helpers/progress";
import { parseSchemaToObject } from "@/app/helpers/schema";
import { md5 } from "js-md5";
import { ProgressStream } from "@/types/globals";

async function doEdit(stream: ProgressStream, url: string, editId: string, project_id: string) {
	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;

	if (!userId || !role || !RolePermissions[role].includes("contribute")) {
		await stream.error("Unauthorized");
		return;
	}

	const libraries = [] as Prisma.LibraryCreateManyInput[];

	try {
		//fetch file from blob storage
		//fetch file from blob storage
		await stream.message("Downloading file", 10);
		const libraryFileResponse = await fetch(url);
		if (!libraryFileResponse.ok) {
			await stream.error(`Library file responded ${libraryFileResponse.status}: ${libraryFileResponse.statusText}.`);
			return;
		}

		await stream.message("Reading file into memory", 15);
		const libraryText = await libraryFileResponse.text();
		const md5Checksum = md5(libraryText);
		const libraryParser = parse(libraryText, {
			columns: true,
			delimiter: "\t",
			comment: "#",
			comment_no_infix: true
		});
		await stream.message("File read into memory", 25);

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
						//library table
						parseSchemaToObject(field, value, libraryRow, "library");
					}
				}

				const parsedLibrary = LibraryOptionalDefaultsSchema.safeParse(
					{
						...libraryRow,
						userDefined: Object.keys(libraryUserDefined).length ? libraryUserDefined : "JsonNull"
					},
					{
						errorMap: (error, ctx) => {
							return {
								message: `Field: ${error.path[0]}\nIssue: ${
									ctx.defaultError.includes("enum") ? deadBooleanToString(ctx.defaultError) : ctx.defaultError
								}\nValue: ${libraryRow[error.path[0] as keyof typeof libraryRow]}`
							};
						}
					}
				);

				if (!parsedLibrary.success) {
					await stream.error(
						`Table: Library\n` +
							`Key: ${libraryRow.lib_id}\n\n` +
							`${parsedLibrary.error.issues.map((e) => e.message).join("\n\n")}`
					);
					return;
				}

				//@ts-ignore issue with Json database type
				libraries.push(parsedLibrary.data);

				//add to progress bar
				await stream.message(
					`Processed Library ${parsedLibrary.data.lib_id}, row ${i} of ${libraryParser.info.records}.`,
					(i / libraryParser.info.records) * 50 + 25
				);
			}
		}

		await stream.message("All entries successfully parsed into database format. Parsing data into database.", 75);

		const libIds = libraries.map((lib) => lib.lib_id);

		const dbError = await prisma.$transaction(
			async (tx) => {
				//check if allowed
				const dbProject = await tx.project.findUnique({
					where: {
						project_id
					},
					select: {
						userIds: true,
						editHistory: true,
						libraryMetadataFileUrl_ODE: true,
						libraryMetadataFileChecksum_ODE: true
					}
				});

				if (!dbProject) {
					return `No Project with project_id of "${project_id}" found.`;
				} else if (!dbProject.userIds.includes(userId)) {
					return "Unauthorized action.";
				}

				const dbLibraries = await tx.library.findMany({
					where: {
						lib_id: {
							in: libIds
						}
					},
					select: {
						Sample: {
							select: {
								project_id: true
							}
						}
					}
				});

				if (dbLibraries.some((lib) => lib.Sample.project_id !== project_id)) {
					return `Some Library in file does not belong to Project with project_id of "${project_id}".`;
				}

				await stream.message("All checks passed.", 80);

				const changes = [
					{
						field: "libraryMetadataFileUrl_ODE",
						oldValue: dbProject.libraryMetadataFileUrl_ODE,
						newValue: url
					},
					{
						field: "libraryMetadataFileChecksum_ODE",
						oldValue: dbProject.libraryMetadataFileChecksum_ODE,
						newValue: md5Checksum
					}
				];
				let editHistory;
				if (dbProject.editHistory) {
					const currEditIndex = dbProject.editHistory.findIndex((edit) => edit.id === editId);

					if (currEditIndex === -1) {
						//new edit
						editHistory = [
							{
								id: editId,
								dateEdited: new Date(),
								changes
							},
							...dbProject.editHistory
						];
					} else {
						//group changes together into previously existing edit
						dbProject.editHistory[currEditIndex].changes = [
							...dbProject.editHistory[currEditIndex].changes,
							...changes
						];
						editHistory = dbProject.editHistory;
					}
				} else {
					//new edit AND new editHistory
					editHistory = [
						{
							id: editId,
							dateEdited: new Date(),
							changes
						}
					];
				}

				//project
				await tx.project.update({
					where: {
						project_id
					},
					data: {
						editHistory
					}
				});
				await stream.message("Project editHistory successfully updated in database.", 85);

				const newLibraries = await tx.library.createManyAndReturn({
					data: libraries,
					skipDuplicates: true,
					select: {
						lib_id: true
					}
				});
				await stream.message("New Libraries successfully added to database.", 90);

				await updateManyRaw(
					tx,
					"Library",
					libraries.filter((lib) => !newLibraries.some((dbLib) => dbLib.lib_id === lib.lib_id)),
					"lib_id"
				);
				await stream.message("Existing Libraries successfully updated in database.", 93);

				//TODO: delete unused libraries (and all associated data) ONLY when it's safe to do so
				await stream.message("Removed Libraries successfully deleted from database.", 96);
			},
			{ timeout: 0.5 * 60 * 1000 } //30 seconds
		);

		if (dbError) {
			await stream.error(dbError);
			return;
		}

		await stream.success("Library file successfully updated in database.");
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

export default async function libraryEditAction(url: string, editId: string, project_id: string) {
	const stream = createProgressStream();

	if (typeof url !== "string" || typeof editId !== "string" || typeof project_id !== "string") {
		stream.error("Arguments are not of correct type");

		stream.close();

		return stream.readable;
	}

	doEdit(stream, url, editId, project_id).then(stream.close);

	return stream.readable;
}
