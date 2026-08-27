"use client";

import type { Prisma } from "@/app/generated/prisma/client";
import { capitalizeTable, uncapitalizeTable } from "@/app/helpers/utils";
import TableMetadata, { DataTableNames, NonDataTableNames } from "@/types/tableMetadata";

export type TableColumns = ReturnType<typeof useTableColumns>;

const EXCLUDE_TABLES = NonDataTableNames.filter((t) => t !== "tag") as Uncapitalize<Prisma.ModelName>[];

export default function useTableColumns({
	table,
	where,
	combinedOmit,
	filterHeadersAtStart
}: {
	table: Uncapitalize<Prisma.ModelName>;
	where?: Record<string, any>;
	combinedOmit: string[];
	filterHeadersAtStart?: boolean;
}) {
	const title = TableMetadata[table].titleField;

	const defaultHeadersSet = new Set() as Set<string>;

	//title field array
	if (Array.isArray(title)) {
		title.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}

	//assemble relational data for table
	const manyRelations = [] as string[];
	const oneRelations = [] as string[];
	const oneRelationsWithArrayTitle = {} as Record<Prisma.ModelName, readonly string[]>;
	for (const rel of TableMetadata[table].relations) {
		if (!EXCLUDE_TABLES.includes(uncapitalizeTable(rel.table)))
			if (rel.type.endsWith("many")) {
				manyRelations.push(rel.field);
			} else if (rel.type.endsWith("one")) {
				const meta = TableMetadata[rel.table];
				if (typeof meta.titleField === "string") {
					oneRelations.push(meta.titleField);
				} else {
					oneRelationsWithArrayTitle[rel.table] = meta.titleField;
				}
			}
	}

	//move tags to the front
	const manyRelationsNoTags = manyRelations.filter((r) => r !== "Tags");
	if (manyRelations.length !== manyRelationsNoTags.length) {
		defaultHeadersSet.add("Tags");
	}

	//relation fields with one, array title
	for (const [field, titleFields] of Object.entries(oneRelationsWithArrayTitle)) {
		defaultHeadersSet.add(field);
		titleFields.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}

	//relation fields with one
	if (oneRelations.length) {
		//maintain field order for relation fields
		if (TableMetadata[table].fieldOrder) {
			for (const f of TableMetadata[table].fieldOrder) {
				if (oneRelations.includes(f)) {
					defaultHeadersSet.add(f);
				}
			}
		}

		oneRelations.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}

	//relation fields with many
	manyRelationsNoTags.forEach(defaultHeadersSet.add, defaultHeadersSet);

	//deep relations
	const deepRelations = DataTableNames.reduce(
		(acc, name) => {
			if (name !== table && TableMetadata[table].relations.every((rel) => uncapitalizeTable(rel.table) !== name)) {
				const path = TableMetadata[table].relationPaths[name];
				if (path) {
					let rel: (typeof acc)[number];
					if (path.some((p) => p.type.endsWith("many"))) {
						rel = { label: TableMetadata[name].plural, table: name, type: "many" };
					} else {
						if (typeof TableMetadata[name].titleField === "string") {
							rel = { label: TableMetadata[name].titleField, table: name, type: "field" };
						} else {
							rel = { label: capitalizeTable(name), table: name, type: "table" };
						}
					}
					acc.push(rel);
					defaultHeadersSet.add(rel.label);
				}
			}

			return acc;
		},
		[] as { label: string; table: Uncapitalize<Prisma.ModelName>; type: "field" | "table" | "many" }[]
	);

	//field order
	if (TableMetadata[table].fieldOrder) {
		TableMetadata[table].fieldOrder.forEach(defaultHeadersSet.add, defaultHeadersSet);
	}

	//rest of fields
	TableMetadata[table].enumSchema.options
		.reduce((acc: string[], head) => {
			if (
				//displaying title header differently, so removing it
				head !== title &&
				//displaying userDefined differently, so removing it
				head !== "userDefined" &&
				//remove all headers where the value is assumed to be the same
				!(where && Object.keys(where).includes(head)) &&
				//remove headers that have been omitted
				!combinedOmit.includes(head)
			) {
				acc.push(head);
			}

			return acc;
		}, [])
		.forEach(defaultHeadersSet.add, defaultHeadersSet);

	//apply default filters
	const defaultHeadersFilter = {} as Record<string, boolean>;
	if (filterHeadersAtStart && TableMetadata[table].subFields) {
		for (const head of defaultHeadersSet) {
			if (
				!TableMetadata[table].subFields.includes(head) &&
				!manyRelations.includes(head) &&
				!(Array.isArray(title) && title.includes(head)) &&
				!(
					head in oneRelationsWithArrayTitle &&
					oneRelationsWithArrayTitle[head as Prisma.ModelName].every((f) => TableMetadata[table].subFields!.includes(f))
				) &&
				!deepRelations.find((rel) => head === rel.label)
			) {
				defaultHeadersFilter[head] = true;
			}
		}
	}

	return {
		title,
		defaultHeaders: Array.from(defaultHeadersSet),
		manyRelations,
		oneRelations,
		oneRelationsWithArrayTitle,
		deepRelations,
		defaultHeadersFilter
	};
}
