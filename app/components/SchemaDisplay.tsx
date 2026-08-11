import TableMetadata, { TableNames } from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "../helpers/schema";
import Link from "next/link";
import { capitalizeTable } from "../helpers/utils";

export default function SchemaDisplay() {
	const tables = TableNames.map((t) => {
		const result = {} as Record<
			string,
			{
				type: string;
				optional?: boolean;
				values?: string[];
			}
		>;

		for (const f of TableMetadata[t].enumSchema.options) {
			const type = getZodType(t, f);
			if (type.type === "json") {
				if (f === "userDefined") {
					result[f] = type;
				} else if (f === "editHistory") {
					result[f] = { ...type, type: "Edit[]" };
				}
			} else {
				result[f] = type;
			}
		}

		return [t, result] as [Uncapitalize<Prisma.ModelName>, typeof result];
	});

	return (
		<div>
			{tables.map(([tableName, fields]) => (
				<div key={tableName} id={tableName} className="collapse collapse-arrow bg-base-100 border-base-300 border">
					<input type="checkbox" />
					<div className="collapse-title font-semibold text-xl">{capitalizeTable(tableName)}</div>
					<div className="collapse-content text-sm overflow-x-auto">
						<div className="text-lg border-t-2 border-primary pt-5">Relations:</div>
						<table className="table table-zebra table-fixed">
							{/* head */}
							<thead>
								<tr>
									<th>Field</th>
									<th>Table</th>
									<th>Type</th>
								</tr>
							</thead>
							<tbody>
								{TableMetadata[tableName].relations.map((relObj) => (
									<tr key={relObj.field}>
										<td>{relObj.field}</td>
										<td>
											<Link className="link link-primary link-hover" href={`#${relObj.table}`}>
												{relObj.table}
											</Link>
										</td>
										<td>{relObj.type}</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="text-lg mt-10 pt-8 border-t-2">Fields:</div>
						<table className="table table-zebra table-fixed">
							{/* head */}
							<thead>
								<tr>
									<th>Field</th>
									<th>Type</th>
									<th>Optional</th>
									<th>Options</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(fields).map(([f, info]) => (
									<tr key={f}>
										<td>{f}</td>
										{info.type === "Edit[]" ? (
											<td>
												<Link href="#editHistoryType" className="link link-primary link-hover">
													editHistory
												</Link>
											</td>
										) : (
											<td>{info.type}</td>
										)}
										<td>{info.optional?.toString()}</td>
										{/* TODO: display all enums separately somewhere */}
										<td>{info.values?.join(" | ")}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			))}
		</div>
	);
}
