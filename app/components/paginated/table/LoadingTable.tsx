import { SearchIcon } from "../../icons";
import LoadingPaginationControls from "../LoadingPaginationControls";

export default function LoadingTable({
	take = 50,
	page = 1,
	columns = 10,
	hideFilters
}: {
	take?: number;
	page?: number;
	columns?: number;
	hideFilters?: boolean;
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
							<label className="input input-sm input-bordered focus-within:outline-none">
								Per Page:
								<input name="take" defaultValue={take} type="number" disabled />
							</label>
						</div>
					</div>
					{/* Pagination Controls */}
					<LoadingPaginationControls />

					{/* Column Selection Button */}
					<div className="grid grid-cols-3 w-full gap-5 flex-1">
						<div className="dropdown dropdown-end justify-self-end">
							<button className="btn text-nowrap btn-sm" disabled>
								Deep Relations
							</button>
						</div>

						<div className="dropdown dropdown-end justify-self-end">
							<button className="btn text-nowrap btn-sm" disabled>
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
					<table className="table table-sm table-pin-rows table-pin-cols w-max min-w-full">
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
										{!hideFilters ? (
											<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
												<SearchIcon />
												<input type="text" className="grow" disabled />
											</label>
										) : (
											<></>
										)}
									</label>
								</th>

								{new Array(columns - 1).fill(null).map((_, i) => (
									<th key={"head" + i} className="bg-base-100">
										<div className="flex justify-between select-none mb-1">
											<LoadingText />
										</div>
										<label className="form-control w-full max-w-xs text-lg">
											{/* Value Filter */}
											{!hideFilters ? (
												<label className="input input-bordered input-sm flex items-center gap-2 w-full focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:outline-none">
													<SearchIcon />
													<input type="text" className="grow" disabled />
												</label>
											) : (
												<></>
											)}
										</label>
									</th>
								))}
								<th className="w-px"></th>
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

function LoadingText({ width, color }: { width?: string; color?: string }) {
	return (
		<div className="w-full flex">
			{"\u200b"}
			<span
				className={`my-1.25 rounded-3xl opacity-60 ${width || "grow"} ${color ? "bg-" + color : "bg-primary-content"}`}
			></span>
		</div>
	);
}
