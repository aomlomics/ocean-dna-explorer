import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingTaxaGrid({ cols = 5 }: { cols?: number }) {
	return (
		<div className="space-y-6 p-6 w-full">
			{/* Pagination Controls */}
			<LoadingPaginationControls />

			<div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
				{new Array(cols ** 2).fill(null).map((_, i) => (
					<div key={i} className="card bg-base-200 aspect-square">
						<div className="card-body p-4">
							<div className="tooltip tooltip-primary w-full break-words">
								<div>
									<p className="text-primary"></p> <p className="break-words"></p>
								</div>
							</div>
							<div className="grow"></div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
