export default function PaginationControls({
	page,
	take,
	count,
	handlePage,
	handlePageHover
}: {
	page: number;
	take: number;
	count: number;
	handlePage: Function;
	handlePageHover: Function;
}) {
	return (
		<div className="w-full flex justify-center">
			<div className="grid grid-cols-3 items-center grow max-w-[600px]">
				<button
					className="btn btn-ghost gap-2 justify-self-end"
					disabled={page <= 1}
					onClick={() => handlePage(-1)}
					onMouseEnter={() => handlePageHover(-1)}
					type="button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>

				<div className="text-base-content text-center grow">
					{Math.min((page - 1) * take + 1, count)}-{Math.min(page * take, count)} of {count}
				</div>

				<button
					className="btn btn-ghost gap-2 justify-self-start"
					disabled={page * take > count}
					onClick={() => handlePage()}
					onMouseEnter={() => handlePageHover()}
					type="button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				</button>
			</div>
		</div>
	);
}
