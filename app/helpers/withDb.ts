import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prismaImages/client";
import type { BlobFileModel } from "@/app/generated/prismaImages/models/BlobFile";
import { prismaImages } from "./prismaImages";
import { prisma } from "./prisma";
import type { ModelName } from "@/types/tableMetadata";
import { capitalizeTable } from "./utils";
import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { AppError, RolePermissions } from "@/types/objects";

export async function validateBlobs(urls: BlobFileModel["url"][]) {
	//skip check in development only, because onUploadCompleted does not trigger
	if (process.env.NODE_ENV === "development") {
		return;
	}

	const { userId, sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role;
	if (!userId) {
		throw new AppError("Must be signed in to submit files.", 401);
	}
	if (!role || (!RolePermissions[role].includes("contribute") && !RolePermissions[role].includes("manageDatabase"))) {
		throw new AppError("Invalid permissions for submitting files.", 403);
	}

	if (!urls.length) {
		throw new AppError("Must provide at least one file.");
	}

	try {
		//retry finding blob files
		for (const url of urls) {
			let found = false;
			let attempts = 0;
			while (!found) {
				if (++attempts > 10) {
					throw new AppError(`Could not find the submitted file with url "${url}" in the database.`, 400);
				}

				found = !!(await prismaImages.blobFile.findUnique({
					where: {
						url
					}
				}));

				//retry after 1/5 of a second
				if (!found) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}
		}

		await prismaImages.$transaction(
			urls.map((url) =>
				prismaImages.blobFile.delete({
					where: {
						url,
						userId
					}
				})
			)
		);
	} catch (err) {
		// return false only if a blobFile to delete was not found, otherwise raise the error
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
			throw new AppError("One or more files could not be deleted from the database.", 400);
		} else {
			throw new AppError("An unexpected error occurred while validating the submitted files.", 500);
		}
	}
}

type ImplicitJoin = {
	table: string;
	left: {
		table: ModelName;
		column: string;
		joinColumn: string;
	};
	right: {
		table: ModelName;
		column: string;
		joinColumn: string;
	};
};

async function getAllImplicitJoinTables(): Promise<ImplicitJoin[]> {
	const rows = await prisma.$queryRaw<
		{
			table_name: string;
			column_name: string;
			referenced_table: string;
			referenced_column: string;
		}[]
	>`
		SELECT
			tc.table_name,
			kcu.column_name,
			ccu.table_name AS referenced_table,
			ccu.column_name AS referenced_column
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
		JOIN information_schema.constraint_column_usage AS ccu
			ON tc.constraint_name = ccu.constraint_name
			AND tc.table_schema = ccu.table_schema
		WHERE tc.constraint_type = 'FOREIGN KEY'
			AND tc.table_schema = 'public'
			AND tc.table_name LIKE '_%To%';
	`;

	const joins = new Map<string, ImplicitJoin>();

	for (const row of rows) {
		let join = joins.get(row.table_name);

		if (!join) {
			join = {
				table: row.table_name,
				left: {
					table: "" as ModelName,
					column: "",
					joinColumn: ""
				},
				right: {
					table: "" as ModelName,
					column: "",
					joinColumn: ""
				}
			};

			joins.set(row.table_name, join);
		}

		const side = row.column_name === "A" ? "left" : row.column_name === "B" ? "right" : undefined;

		if (side) {
			join[side] = {
				table: row.referenced_table as ModelName,
				column: row.referenced_column,
				joinColumn: row.column_name
			};
		}
	}

	const joinTables = Array.from(joins.values());

	//validate that all many-to-many relations are represented
	for (const table of TableNames) {
		const capsTable = capitalizeTable(table);
		for (const rel of TableMetadata[table].relations) {
			if (rel.type === "many-to-many") {
				if (
					!joinTables.find(
						(join) =>
							(join.left.table === capsTable && join.right.table === rel.table) ||
							(join.left.table === rel.table && join.right.table === capsTable)
					)
				) {
					throw new Error(`Implicit join table missing for ${capsTable} <-> ${rel.table}`);
				}
			}
		}
	}

	return joinTables;
}

const implicitJoinTables = getAllImplicitJoinTables();
export async function getImplicitJoinTable({
	from,
	to
}: {
	from: Uncapitalize<ModelName>;
	to: Uncapitalize<ModelName>;
}) {
	const joins = await implicitJoinTables;

	const capsFrom = capitalizeTable(from);
	const capsTo = capitalizeTable(to);

	const found = joins.find(
		(join) =>
			(join.left.table === capsFrom && join.right.table === capsTo) ||
			(join.left.table === capsTo && join.right.table === capsFrom)
	);
	if (!found) {
		throw new AppError(`No implicit join table found between ${from} and ${to}.`);
	}

	return {
		table: found.table,
		from: found.left.table === capsFrom ? found.left : found.right,
		to: found.left.table === capsFrom ? found.right : found.left
	};
}
