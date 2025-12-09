import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit, TypeSeparators } from "@/types/objects";
import Link from "next/link";
import { ReactNode } from "react";
import { Prisma } from "../generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { getZodType } from "../helpers/schema";

export default function DataDisplay({
	table,
	data,
	omit = [],
	priorityFields = []
}: {
	table: Uncapitalize<Prisma.ModelName>;
	data: Record<string, any>;
	omit?: (keyof typeof data)[];
	priorityFields?: string[];
}) {
	omit = [...omit, ...GlobalOmit, "id"];

	function ValueNode({ field, value }: { field: string; value: any }) {
		const type = getZodType(TableMetadata[table].schema.shape[field]).type;

		if (value === null || (Array.isArray(value) && value.length === 0)) {
			return <div className="bg-base-300">{"\u200b"}</div>;
		} else if (typeof value === "number" && value in DeadValueEnum) {
			return <div className="break-words">{DeadValueEnum[value]}</div>;
		} else if (type === "date" && value.getTime() in DeadValueEnum) {
			return <div className="break-words">{DeadValueEnum[value.getTime()]}</div>;
		} else {
			const strValue = value.toString();

			//TODO: change once Prisma supports contains on arrays
			return strValue.split(TypeSeparators.string).map((v: string, i: number) => {
				const trimmed = v.trim();
				if (URL.canParse(trimmed) && trimmed.startsWith("https://")) {
					return (
						<Link
							key={i}
							href={trimmed}
							className="link link-primary link-hover self-start"
							target="_blank"
							rel="noreferrer"
						>
							{trimmed}
						</Link>
					);
				} else {
					return (
						<div key={i} className="break-words">
							{trimmed}
						</div>
					);
				}
			});
		}
	}

	// function to check if a value is empty (we want them at the bottom of the table)
	const isEmpty = (value: any): boolean => {
		return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
	};

	// Sorting the field order: priority fields list first, then non-empty fields, then empty fields
	const sortedEntries = Object.entries(data).sort(([fieldA, valueA], [fieldB, valueB]) => {
		// Skip sorting for omitted fields
		if (omit.includes(fieldA) || omit.includes(fieldB)) return 0;

		const priorityIndexA = priorityFields.indexOf(fieldA);
		const priorityIndexB = priorityFields.indexOf(fieldB);
		const isEmptyA = isEmpty(valueA);
		const isEmptyB = isEmpty(valueB);

		// if booth are priority fields - sort by priority order
		if (priorityIndexA !== -1 && priorityIndexB !== -1) {
			return priorityIndexA - priorityIndexB;
		}

		if (priorityIndexA !== -1) return -1;

		if (priorityIndexB !== -1) return 1;

		if (isEmptyA && !isEmptyB) return 1;
		if (!isEmptyA && isEmptyB) return -1;

		return 0;
	});

	return (
		<div className="overflow-x-auto overflow-y-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100">
			<table className="table table-zebra bg-base-100 font-sans">
				<tbody>
					{sortedEntries.reduce((acc: ReactNode[], [field, value]) => {
						if (!omit.includes(field)) {
							if (field !== "userDefined") {
								acc.push(
									<tr key={field} className="hover:bg-base-300/50 transition-colors">
										<td className="flex flex-col gap-1.5">
											<div className="text-sm font-medium text-base-content/70 break-all">{field}</div>
											<ValueNode field={field} value={value} />
										</td>
									</tr>
								);
							} else if (value) {
								acc.push(
									<tr key={field} className="hover:bg-base-300/50 transition-colors">
										<td className="flex flex-col gap-1.5">
											<div className="font-medium">User Defined:</div>
											<table className="table table-zebra bg-base-100 font-sans">
												<tbody>
													{Object.entries(value).reduce(
														(acc: ReactNode[], [userDefinedField, userDefinedValue]: [string, any]) => {
															if (!omit.includes(userDefinedField)) {
																acc.push(
																	<tr key={userDefinedField + "_userDefined"} className="hover:bg-base-300/50 transition-colors">
																		<td className="flex flex-col gap-1.5">
																			<div className="text-sm font-medium text-base-content/70 break-all">
																				{userDefinedField}
																			</div>
																			<ValueNode field={userDefinedField} value={userDefinedValue} />
																		</td>
																	</tr>
																);
															}

															return acc;
														},
														[]
													)}
												</tbody>
											</table>
										</td>
									</tr>
								);
							}
						}

						return acc;
					}, [])}
				</tbody>
			</table>
		</div>
	);
}
