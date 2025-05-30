import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingTable({ error }: { error?: string }) {
	return (
		<div className="w-full h-full flex flex-col">
			<div className="grid grid-cols-3 justify-items-center">
				{/* Filters Buttons */}
				<div className="flex items-center gap-5">
					<button disabled={true} className="btn btn-sm" type="button">
						Clear Filters
					</button>
					<button disabled={true} className="btn btn-sm">
						Apply Filters
					</button>
					<label className="input input-sm input-bordered flex items-center gap-2">
						Per Page:
						<input name="take" disabled={true} type="number" className="grow max-w-12" />
					</label>
				</div>

				<LoadingPaginationControls />

				{/* Column Selection Button */}
				<div className="flex items-center">
					<button disabled={true} className="btn btn-sm">
						Columns
					</button>
				</div>
			</div>
			<div className="flex items-center justify-center grow">
				{error ? <span>{error}</span> : <span className="loading loading-spinner loading-lg"></span>}
			</div>
		</div>
	);
}
