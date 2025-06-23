import { DeadValueEnum } from "@/types/enums";
import { GlobalOmit } from "@/types/objects";
import Link from "next/link";
import { ReactNode } from "react";
import { Prisma } from "../generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";
import { getZodType } from "../helpers/utils";

export default function DataDisplay({
	table,
	data,
	omit = []
}: {
	table: Uncapitalize<Prisma.ModelName>;
	data: Record<string, any>;
	omit?: (keyof typeof data)[];
}) {
	omit = [...omit, ...GlobalOmit, "id"];

	function ValueNode({ field, value }: { field: string; value: any }) {
		const type = getZodType(TableMetadata[table].schema.shape[field]).type;
		if (!type) {
			throw new Error(
				`Could not find type of '${field}'. Make sure a field named '${field}' exists on table named '${table}'.`
			);
		}

		if (value === null || (Array.isArray(value) && value.length === 0)) {
			return <div className="bg-base-300">{"\u200b"}</div>;
		} else if (typeof value === "number" && value in DeadValueEnum) {
			return <div className="break-words">{DeadValueEnum[value]}</div>;
		} else if (type === "integer[]" || type === "float[]") {
			if (value[0] in DeadValueEnum) {
				return <div className="break-words">{DeadValueEnum[value[0]]}</div>;
			} else {
				if (value[1]) {
					return (
						<div className="break-words">
							{value[0].toString()}-{value[1].toString()}
						</div>
					);
				} else {
					return <div className="break-words">{value[0].toString()}</div>;
				}
			}
		} else {
			const strValue = value.toString();

			//TODO: change once Prisma supports contains on arrays
			return strValue.split("|").map((v: string, i: number) => {
				const trimmed = v.trim();
				if (URL.canParse(trimmed) && trimmed.split(":")[1].startsWith("//")) {
					return (
						<Link key={i} href={trimmed} className="link link-primary link-hover" target="_blank" rel="noreferrer">
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

	return (
		<div className="overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100">
			<table className="table table-zebra bg-base-100 rounded-none">
				<tbody>
					{Object.entries(data).reduce((acc: ReactNode[], [field, value]) => {
						if (!omit.includes(field)) {
							if (field !== "userDefined") {
								acc.push(
									<tr key={field}>
										<td className="flex flex-col gap-1">
											<div className="text-sm font-medium text-base-content/70 break-all">{field}</div>
											<ValueNode field={field} value={value} />
										</td>
									</tr>
								);
							} else if (value) {
								acc.push(
									<tr key={field}>
										<td className="flex flex-col gap-1">
											<div>User Defined:</div>
											<table className="table table-zebra bg-base-100 rounded-none">
												<tbody>
													{Object.entries(value).reduce(
														(acc: ReactNode[], [userDefinedField, userDefinedValue]: [string, any]) => {
															if (!omit.includes(userDefinedField)) {
																acc.push(
																	<tr key={userDefinedField + "_userDefined"}>
																		<td className="flex flex-col gap-1">
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
