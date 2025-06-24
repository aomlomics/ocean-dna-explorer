import TableMetadata from "@/types/tableMetadata";
import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "../helpers/utils";
import Link from "next/link";
import { stripSecureFields } from "../helpers/prisma";

export default function SchemaDisplay() {
	const tables = Object.keys(Prisma.ModelName).map((t) => {
		const tableName = t.toLowerCase() as Uncapitalize<Prisma.ModelName>;

		const fields = TableMetadata[tableName].enumSchema._def.values;
		const result = {} as Record<
			string,
			{
				type: string;
				optional?: boolean;
				values?: string[];
			}
		>;
		const shape = TableMetadata[tableName].schema.shape;
		for (const f of fields) {
			const type = getZodType(shape[f as keyof typeof shape]);
			if (!type.type) {
				throw new Error(`Could not find type of ${f}.`);
			}
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

		stripSecureFields(result);
		return [t, result] as [Prisma.ModelName, typeof result];
	});

	return (
		<div>
			{tables.map(([tableName, fields]) => (
				<div
					key={tableName}
					id={tableName.toLowerCase()}
					className="collapse collapse-arrow bg-base-100 border-base-300 border"
				>
					<input type="checkbox" />
					<div className="collapse-title font-semibold text-xl">{tableName}</div>
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
								{TableMetadata[tableName.toLowerCase() as Uncapitalize<Prisma.ModelName>].relations.map((relObj) => (
									<tr key={relObj.field}>
										<td>{relObj.field}</td>
										<td>
											<Link className="link link-primary link-hover" href={`#${relObj.table.toLowerCase()}`}>
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
