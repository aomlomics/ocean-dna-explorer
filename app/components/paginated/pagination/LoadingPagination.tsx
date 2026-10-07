import LoadingPaginationControls from "../LoadingPaginationControls";

export default function LoadingPagination() {
	return (
		<div className="space-y-4">
			<LoadingPaginationControls />

			<div className="flex flex-col gap-2">
				{new Array(6).fill(null).map((_, i) => (
					<div key={i} className="rounded-xl bg-base-200 px-4 py-3">
						<div className="h-4 w-1/2 rounded bg-base-content/10" />
						<div className="mt-2 h-3 w-3/4 rounded bg-base-content/10" />
					</div>
				))}
			</div>

			<LoadingPaginationControls />
		</div>
	);
}
