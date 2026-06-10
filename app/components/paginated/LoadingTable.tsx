import InfoButton from "../InfoButton";
import LoadingText from "../LoadingText";
import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingTable({
	take = 50,
	page = 1,
	columns = 10,
	error
}: {
	take?: number;
	page?: number;
	columns?: number;
	error?: string;
}) {
	return (
		<div className="bg-base-100 border-base-300 rounded-box h-full w-full p-6">
			<div className="w-full h-full flex flex-col">
				<div className="flex justify-between items-center mb-4">
					{/* Left side: Filters */}
					<div className="flex-1 flex">
						<div className="flex items-center gap-2">
							<button className="btn btn-sm" disabled>
								Clear Filters
							</button>
							<button className="btn btn-sm" disabled>
								Apply Filters
							</button>
							<label className="input input-sm input-bordered">
								Per Page:
								<input name="take" defaultValue={take} type="number" disabled />
							</label>
						</div>
					</div>
					{/* Pagination Controls */}
					<LoadingPaginationControls />

					{/* Column Selection Button */}
					<div className="grid grid-cols-3 w-full gap-5 flex-1">
						<div className="flex gap-2">
							<InfoButton
								infoText="If many rows are displayed per page, selecting these options can cause long load times."
								type="warning"
								dir="tooltip-left"
								className="z-60"
							/>

							<button className="btn btn-sm" disabled>
								Deep Relations
							</button>
						</div>

						<div className="dropdown dropdown-end justify-self-end">
							<button className="btn btn-sm" disabled>
								Columns
							</button>
						</div>

						<fieldset className="fieldset bg-base-100 border-base-300">
							<label className="label select-none cursor-not-allowed">
								<input type="checkbox" className="checkbox" disabled />
								Hide empty columns
							</label>
						</fieldset>
					</div>
				</div>

				<div className="overflow-x-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100 h-full">
					<table className="table table-sm table-pin-rows table-pin-cols">
						{/* Headers */}
						<thead>
							<tr>
								{/* Title Header Cell */}
								<th className="px-3 py-2 z-40 bg-base-100">
									<div className="cursor-pointer select-none flex justify-between mb-1">
										<LoadingText />
									</div>

									<label className="form-control w-full max-w-xs text-lg">
										{/* Value Filter */}
										<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 16"
												fill="currentColor"
												className="h-4 w-4 opacity-70"
											>
												<path
													fillRule="evenodd"
													d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
													clipRule="evenodd"
												/>
											</svg>
											<input type="text" className="grow" disabled />
										</label>
									</label>
								</th>

								{new Array(columns - 1).fill(null).map((_, i) => (
									<td key={"head" + i} className="bg-base-100">
										<div className="flex justify-between select-none mb-1">
											<LoadingText />
										</div>
										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 16 16"
													fill="currentColor"
													className="h-4 w-4 opacity-70"
												>
													<path
														fillRule="evenodd"
														d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
														clipRule="evenodd"
													/>
												</svg>
												<input type="text" className="grow" disabled />
											</label>
										</label>
									</td>
								))}
								<th></th>
							</tr>
						</thead>
						<tbody>
							{/* Value Row */}
							{new Array(take).fill(null).map((_, i) => (
								<tr key={"row" + i} className="h-12 align-middle">
									<th
										className={`whitespace-nowrap text-sm font-bold bg-base-200 border-base-300 py-5 border-r-2 ${
											i ? "border-t-2" : ""
										}`}
									>
										<LoadingText color="primary" />
									</th>

									{new Array(columns - 1).fill(null).map((_, j) => (
										<td
											className={`whitespace-nowrap text-sm border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}
											key={"row" + i + "col" + j}
										>
											<LoadingText />
										</td>
									))}
									<th className={`border-base-300 border-l-2 ${i ? "border-t-2" : ""}`}>{i + 1 + (page - 1) * take}</th>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Bottom Pagination Controls */}
				<div className="flex justify-center mt-4">
					<LoadingPaginationControls />
				</div>
			</div>
		</div>
	);
}
