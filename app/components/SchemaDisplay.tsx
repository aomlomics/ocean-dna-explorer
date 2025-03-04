import { TableToEnumSchema, TableToSchema } from "@/types/enums";
import { Prisma } from "@prisma/client";
import { getZodType } from "../helpers/utils";

export default function SchemaDisplay() {
	const tables = Object.keys(Prisma.ModelName).map((tableName) => {
		const fields = TableToEnumSchema[tableName.toLowerCase() as keyof typeof TableToEnumSchema]._def.values;
		const result = {} as Record<string, ReturnType<typeof getZodType>>;
		for (const f of fields) {
			const shape = TableToSchema[tableName.toLowerCase() as keyof typeof TableToSchema].shape;
			const type = getZodType(shape[f as keyof typeof shape]);
			if (!type.type) {
				throw new Error(`Could not find type of ${f}.`);
			}
			result[f] = type;
		}

		return result;
	});

	return (
		<div>
			<div className="collapse collapse-arrow bg-base-100 border-base-300 border">
				<input type="checkbox" />
				<div className="collapse-title font-semibold">How do I create an account?</div>
				<div className="collapse-content text-sm overflow-x-auto">
					<table className="table table-zebra">
						{/* head */}
						<thead>
							<tr>
								<th></th>
								<th>Name</th>
								<th>Job</th>
								<th>Favorite Color</th>
							</tr>
						</thead>
						<tbody>
							{/* row 1 */}
							<tr>
								<th>1</th>
								<td>Cy Ganderton</td>
								<td>Quality Control Specialist</td>
								<td>Blue</td>
							</tr>
							{/* row 2 */}
							<tr>
								<th>2</th>
								<td>Hart Hagerty</td>
								<td>Desktop Support Technician</td>
								<td>Purple</td>
							</tr>
							{/* row 3 */}
							<tr>
								<th>3</th>
								<td>Brice Swyre</td>
								<td>Tax Accountant</td>
								<td>Red</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
