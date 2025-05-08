import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingPagination() {
	return (
		<div className="space-y-6 p-6">
			<LoadingPaginationControls />

			{/* Project Cards */}
			<div className="grid gap-4">
				{new Array(10).fill(null).map((_, i) => (
					<div key={i} className="card bg-base-200">
						<div className="card-body p-5 text-lg font-medium">{"\u200b"}</div>
					</div>
				))}
			</div>

			<LoadingPaginationControls />
		</div>
	);
}
