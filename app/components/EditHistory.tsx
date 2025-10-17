import Link from "next/link";
import { getSubmissionFileName } from "../helpers/utils";

export default async function EditHistory({ editHistory }: { editHistory: PrismaJson.EditHistoryType | null }) {
	return (
		<div className="dropdown dropdown-hover ml-1 z-110">
			<div tabIndex={0} role="button" className="flex items-center gap-2 p-0 ml-1 pb-1.5">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="stroke-current text-primary shrink-0 w-8 h-8"
				>
					<path
						d="M12 7V12L14.5 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<span className="text-base font-medium text-primary -ml-1">Edit History</span>
			</div>

			<ul
				tabIndex={0}
				className="dropdown-content bg-base-200 rounded-box z-[1] shadow p-6 flex flex-col gap-2 max-h-[400px] overflow-y-scroll overflow-x-hidden"
			>
				{editHistory && editHistory.length > 0 ? (
					editHistory.map((edit, i) => (
						<li className={`min-w-[600px] ${i ? "border-t-2 border-primary pt-2" : ""}`} key={i}>
							<div className="text-base text-base-content pb-2 font-bold">
								Changed: <span className="text-primary">{new Date(edit.dateEdited).toLocaleString()}</span>
							</div>
							<div className="flex flex-col gap-2">
								{edit.changes.map((change, j) => (
									<div
										key={change.field + j}
										className={`pl-8 flex flex-col items-start gap-1 mx-10 ${
											j ? "border-t-2 border-base-content/70 pt-2" : ""
										}`}
									>
										<div className="text-sm font-medium text-base-content/70">{change.field}</div>
										<div className="grid grid-cols-[40%_10%_40%] break-all">
											<p
												className={`bg-base-200 px-2 py-1 rounded-md ${
													change.oldValue === "" ? "italic text-base-content/30" : ""
												}`}
											>
												<ChangeValue value={change.oldValue} />
											</p>{" "}
											<p className="px-2 py-1 justify-self-center self-center">🠢</p>{" "}
											<p
												className={`bg-base-200 px-2 py-1 rounded-md ${
													change.newValue === "" ? "italic text-base-content/30" : ""
												}`}
											>
												<ChangeValue value={change.newValue} />
											</p>
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

function ChangeValue({ value }: { value: string }) {
	if (value === "") {
		return "<empty>";
	} else if (URL.canParse(value) && value.startsWith("https://")) {
		return (
			<Link href={value} className="link link-primary link-hover" target="_blank" rel="noreferrer">
				{getSubmissionFileName(value)}
			</Link>
		);
	} else {
		return value;
	}
}
