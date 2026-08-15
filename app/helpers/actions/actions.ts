import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata from "@/types/tableMetadata";

export function addToHistory(
	table: Uncapitalize<Prisma.ModelName>,
	editId: string,
	editHistory: PrismaJson.EditHistoryType | null,
	changes: PrismaJson.ChangesType
) {
	//check if changes are valid
	for (const cha of changes) {
		if (!TableMetadata[table].enumSchema.options.includes(cha.field)) {
			throw new Error(
				`Invalid Change for editHistory. Field named "${cha.field}" does not exist on table named "${table}".`
			);
		}
	}

	if (editHistory) {
		const currEditIndex = editHistory.findIndex((edit) => edit.id === editId);

		if (currEditIndex === -1) {
			//new edit
			return [
				{
					id: editId,
					dateEdited: new Date(),
					changes
				},
				...editHistory
			];
		} else {
			//group changes together into previously existing edit
			const temp = [...editHistory];
			temp[currEditIndex]!.changes = [...editHistory[currEditIndex]!.changes, ...changes];
			return temp;
		}
	} else {
		//new edit AND new editHistory
		return [
			{
				id: editId,
				dateEdited: new Date(),
				changes
			}
		];
	}
}
