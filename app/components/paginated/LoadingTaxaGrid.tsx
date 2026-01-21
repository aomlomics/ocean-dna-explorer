import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingTaxaGrid({ cols = 5 }: { cols?: number }) {
	return (
		<div className="space-y-6 p-6 w-full">
			{/* Pagination Controls */}
			<LoadingPaginationControls />

			<div
				className="grid grid-cols-2 lg:grid-cols-5 gap-4"
				style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
			>
				{new Array(cols ** 2).fill(null).map((_, i) => (
					<div key={i} className="card bg-base-200 aspect-square">
						<div className="card-body p-4 flex items-center justify-center">
							<span className="loading loading-spinner loading-lg bg-primary"></span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
