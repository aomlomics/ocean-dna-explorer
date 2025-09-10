export function getNewEditHistory(
	editId: string,
	editHistory: PrismaJson.EditHistoryType | null,
	changes: PrismaJson.ChangesType
) {
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
			temp[currEditIndex].changes = [...editHistory[currEditIndex].changes, ...changes];
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
