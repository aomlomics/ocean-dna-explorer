import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit, TypeSeparators } from "@/types/objects";
import Link from "next/link";
import { ReactNode } from "react";
import { Prisma } from "../../generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { getZodType } from "../../helpers/schema";

export default function DataDisplay({
	table,
	data,
	omit = []
}: {
	table: Uncapitalize<Prisma.ModelName>;
	data: Record<string, any>;
	omit?: string[];
}) {
	const combinedOmit = [...omit, ...GlobalOmit, "id"];

	// Sort the fields
	const fields = new Set() as Set<string>;
	//field order
	if (TableMetadata[table].fieldOrder) {
		for (const f of TableMetadata[table].fieldOrder) {
			if (!combinedOmit.includes(f)) {
				fields.add(f);
			}
		}
		TableMetadata[table].fieldOrder.forEach(fields.add, fields);
	}
	//move empty fields to bottom
	const emptyFields = [];
	for (const [f, val] of Object.entries(data)) {
		if (!combinedOmit.includes(f)) {
			if (val == null) {
				emptyFields.push(f);
			} else {
				fields.add(f);
			}
		}
	}
	emptyFields.forEach(fields.add, fields);

	return (
		<div className="overflow-x-auto overflow-y-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100">
			<table className="table table-zebra bg-base-100 font-sans">
				<tbody>
					{Array.from(fields).reduce((acc: ReactNode[], f) => {
						if (f !== "userDefined") {
							acc.push(
								<tr key={f} className="hover:bg-base-300/50 transition-colors">
									<td className="flex flex-col gap-1.5">
										<div className="text-sm font-medium text-base-content/70 break-all">{f}</div>
										<ValueNode table={table} field={f} value={data[f]} />
									</td>
								</tr>
							);
						} else if (data[f]) {
							acc.push(
								<tr key={f} className="hover:bg-base-300/50 transition-colors">
									<td className="flex flex-col gap-1.5">
										<div className="font-medium">User Defined:</div>
										<table className="table table-zebra bg-base-100 font-sans">
											<tbody>
												{Object.entries(data[f]).reduce(
													(acc: ReactNode[], [userDefinedField, userDefinedValue]: [string, any]) => {
														if (!combinedOmit.includes(userDefinedField)) {
															acc.push(
																<tr
																	key={userDefinedField + "_userDefined"}
																	className="hover:bg-base-300/50 transition-colors"
																>
																	<td className="flex flex-col gap-1.5">
																		<div className="text-sm font-medium text-base-content/70 break-all">
																			{userDefinedField}
																		</div>
																		<ValueNode
																			table={table}
																			field={userDefinedField}
																			value={userDefinedValue}
																			userDefined
																		/>
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

						return acc;
					}, [])}
				</tbody>
			</table>
		</div>
	);
}

function ValueNode({
	table,
	field,
	value,
	userDefined
}: {
	table: Uncapitalize<Prisma.ModelName>;
	field: string;
	value: any;
	userDefined?: true;
}) {
	if (!userDefined) {
		const type = getZodType(table, field).type;

		if (value === null || (Array.isArray(value) && value.length === 0)) {
			return <div className="bg-base-300">{"\u200b"}</div>;
		} else if (typeof value === "number" && value in DeadValueEnum) {
			return <div className="wrap-break-word">{DeadValueEnum[value]}</div>;
		} else if (type === "date" && value.getTime() in DeadValueEnum) {
			return <div className="wrap-break-word">{DeadValueEnum[value.getTime()]}</div>;
		}
	}

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
				<div key={i} className="wrap-break-word">
					{trimmed}
				</div>
			);
		}
	});
}
