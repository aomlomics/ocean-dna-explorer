import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prismaImages/client";
import type { BlobFile } from "@/app/generated/prismaImages/client";
import { prismaImages } from "./prismaImages";
import { prisma } from "./prisma";
import type { ModelName } from "@/types/tableMetadata";
import { capitalizeTable } from "./utils";

export async function validateBlobs(urls: BlobFile["url"][]) {
	//skip check in development only, because onUploadCompleted does not trigger
	if (process.env.NODE_ENV === "development") {
		return true;
	}

	const { userId } = await auth();
	if (!userId) {
		return false;
	}

	try {
		//retry finding blob files
		for (const url of urls) {
			let found = false;
			let attempts = 0;
			while (!found) {
				if (++attempts > 10) {
					return false;
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

		return true;
	} catch (err) {
		// return false only if a blobFile to delete was not found, otherwise raise the error
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
			return false;
		} else {
			throw err;
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

	return Array.from(joins.values());
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
		throw new Error(`No implicit join table found between ${from} and ${to}.`);
	}

	return {
		table: found.table,
		from: found.left.table === capsFrom ? found.left : found.right,
		to: found.left.table === capsFrom ? found.right : found.left
	};
}
