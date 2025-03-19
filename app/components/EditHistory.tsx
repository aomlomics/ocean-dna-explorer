export default async function EditHistory({ editHistory }: { editHistory: PrismaJson.EditHistoryType }) {
	return (
		<div className="dropdown dropdown-hover">
			<div tabIndex={0} role="button" className="stat flex justify-between items-center p-0">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="stroke-current text-secondary shrink-0 w-8 h-8"
				>
					<path
						d="M12 7V12L14.5 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
						stroke="#000000"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			<ul
				tabIndex={0}
				className="dropdown-content bg-base-300 rounded-box z-[1] p-2 shadow p-6 flex flex-col gap-2 max-h-[400px] overflow-y-scroll"
			>
				{editHistory.length > 0 ? (
					editHistory.map((edit, i) => (
						<li className="min-w-[450px]" key={i}>
							<div className="text-base text-base-content pb-2">{edit.dateEdited.toString()}</div>
							<div className="flex flex-col gap-2">
								{edit.changes.map((change, i) => (
									<div key={change.field + i} className="pl-8 flex flex-col items-start gap-1">
										<div className="text-sm font-medium text-base-content/70">{change.field}</div>
										<div className="flex">
											<p className="bg-base-200 px-2 py-1 rounded-md">{change.oldValue}</p>{" "}
											<p className="px-2 py-1">🠢</p>{" "}
											<p className="bg-base-200 px-2 py-1 rounded-md">{change.newValue}</p>
										</div>
									</div>
								))}
							</div>
						</li>
					))
				) : (
					<div className="min-w-[100px] flex justify-center">No changes</div>
				)}
			</ul>
		</div>
	);
}
