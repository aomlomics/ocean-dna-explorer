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
		<div className="bg-base-100 border-base-300 rounded-box p-6 h-full w-full">
			<div className="w-full h-full flex flex-col">
				<div className="grid grid-cols-3 justify-items-center">
					{/* Filters Buttons */}
					<div className="flex items-center gap-5">
						<button disabled className="btn btn-sm btn-error" type="button">
							Clear Filters
						</button>
						<button disabled className="btn btn-sm btn-primary">
							Apply Filters
						</button>

						<label className="input input-sm input-bordered flex items-center gap-2">
							Per Page:
							<input name="take" disabled defaultValue={take} type="number" className="grow max-w-12" />
						</label>
					</div>
					{/* Pagination Controls */}
					<LoadingPaginationControls />

					{/* Column Selection Button */}
					<div className="flex items-center justify-center w-full gap-5">
						<button disabled className="btn btn-sm">
							Columns
						</button>

						<fieldset className="fieldset bg-base-100 border-base-300">
							<label className="label">
								<input type="checkbox" className="checkbox" disabled />
								Hide empty columns
							</label>
						</fieldset>
					</div>
				</div>
				<div className="overflow-auto scrollbar scrollbar-thumb-accent scrollbar-track-base-100 h-full">
					<table className="table table-xs table-pin-rows table-pin-cols">
						{/* Headers */}
						<thead>
							<tr>
								{/* Title Header Cell */}
								<th className="p-0 pr-2 z-40">
									<label className="form-control w-full max-w-xs text-lg">
										<div className="flex justify-between">
											<LoadingText />
										</div>
										{/* Value Filter */}
										<label className="input input-bordered input-xs flex items-center gap-2 w-full">
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
									<td key={i}>
										<label className="form-control w-full max-w-xs text-lg">
											<div className="flex justify-between">
												<LoadingText />
											</div>
											{/* Value Filter */}
											<label className="input input-bordered input-xs flex items-center gap-2 w-full">
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
								<tr key={i} className="border-base-100 border-b-2">
									<th className="whitespace-nowrap text-sm">
										<LoadingText color="primary" />
									</th>

									{new Array(columns - 1).fill(null).map((_, j) => (
										<td
											className={`whitespace-nowrap text-sm bg-base-300 ${j ? "border-base-100 border-l-2" : ""}`}
											key={`${i}${j}`}
										>
											<LoadingText />
										</td>
									))}
									<th>{i + 1 + (page - 1) * take}</th>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
