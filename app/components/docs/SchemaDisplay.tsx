import TableMetadata, { DataTableNames, type ModelName, NonDataTableNames } from "@/types/tableMetadata";
import { getZodType } from "@/app/helpers/schema";
import Link from "next/link";
import { capitalizeTable } from "@/app/helpers/utils";

export default function SchemaDisplay() {
	return (
		<div>
			<h2 className="text-2xl pb-2">Data Tables</h2>
			<div className="flex flex-col gap-2">
				{DataTableNames.map((table) => (
					<TableSchema key={table} table={table} />
				))}
			</div>

			<h2 className="text-2xl pb-2 pt-5">Non-Data Tables</h2>
			<div className="flex flex-col gap-2">
				{NonDataTableNames.map((table) => (
					<TableSchema key={table} table={table} />
				))}
			</div>
		</div>
	);
}

function TableSchema({ table }: { table: Uncapitalize<ModelName> }) {
	const fields = {} as Record<
		string,
		{
			type: string;
			optional?: boolean;
			values?: string[];
		}
	>;

	for (const f of TableMetadata[table].enumSchema.options) {
		const type = getZodType(table, f);

		if (type.type === "json") {
			if (f === "userDefined") {
				fields[f] = type;
			} else if (f === "editHistory") {
				fields[f] = { ...type, type: "Edit[]" };
			}
		} else {
			fields[f] = type;
		}
	}

	return (
		<div key={table} id={capitalizeTable(table)} className="collapse collapse-arrow bg-base-100 border-base-300 border">
			<input type="checkbox" />
			<div className="collapse-title font-semibold text-xl">{capitalizeTable(table)}</div>
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
						{TableMetadata[table].relations.map((relObj) => (
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
	);
}
