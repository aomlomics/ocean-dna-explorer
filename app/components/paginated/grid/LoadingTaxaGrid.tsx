import LoadingPaginationControls from "../LoadingPaginationControls";

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
					<div key={i} className="card bg-base-200 aspect-square overflow-hidden">
						<div className="card-body p-2 lg:p-3 gap-2">
							<div className="space-y-2">
								<div className="skeleton h-3 w-16"></div>
								<div className="skeleton h-4 w-3/4"></div>
								<div className="skeleton h-3 w-1/2"></div>
							</div>
							<div className="grow min-h-0 border-t border-base-300 pt-2">
								<div className="skeleton h-full w-full rounded-md"></div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
