import { TableToEnumSchema, TableToSchema } from "@/types/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { getZodType } from "../helpers/utils";

export default function SchemaDisplay() {
	//TODO: display user defined fields currently in the database
	const tables = Object.keys(Prisma.ModelName).map((tableName) => {
		const fields = TableToEnumSchema[tableName.toLowerCase() as keyof typeof TableToEnumSchema]._def.values;
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		const shape = TableToSchema[tableName.toLowerCase() as keyof typeof TableToSchema].shape;
		for (const f of fields) {
			if (f !== "userDefined") {
				const type = getZodType(shape[f as keyof typeof shape]);
				if (!type.type) {
					throw new Error(`Could not find type of ${f}.`);
				}
				result[f] = type;
			}
		}

		return [tableName, result] as [string, typeof result];
	});

	return (
		<div>
			{tables.map(([tableName, fields]) => (
				<div key={tableName} className="collapse collapse-arrow bg-base-100 border-base-300 border">
					<input type="checkbox" />
					<div className="collapse-title font-semibold">{tableName}</div>
					<div className="collapse-content text-sm overflow-x-auto">
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
										<td>{info.type}</td>
										<td>{info.optional?.toString()}</td>
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
