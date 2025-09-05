import LoadingText from "../LoadingText";
import LoadingPaginationControls from "./LoadingPaginationControls";

export default function LoadingTaxaGrid({ cols = 5 }: { cols?: number }) {
	return (
		<div className="space-y-6 p-6 w-full">
			{/* Pagination Controls */}
			<LoadingPaginationControls />

			<div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
				{new Array(cols ** 2).fill(null).map((_, i) => (
					<div key={i} className="card bg-base-200 hover:translate-x-1 transition-transform duration-200 aspect-square">
						<div className="card-body p-4 gap-2">
							<div className="w-full break-words">
								<div>
									<LoadingText color="primary" width={"w-1/4"} />
									<LoadingText width={"w-1/4"} />
								</div>
							</div>
							<div className="grow border-t-1 pt-2">
								<div className="w-full h-full relative flex flex-col justify-center break-words">
									<LoadingText color="primary" width={"w-1/2"} />
									<LoadingText width={"w-1/2"} />
									<div className="flex justify-center h-full w-full">
										<span className="loading loading-spinner w-1/4 h-full"></span>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
