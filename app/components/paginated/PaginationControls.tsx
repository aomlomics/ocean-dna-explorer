import { Dispatch, SetStateAction } from "react";

export default function PaginationControls({
	page,
	take,
	count,
	setPage,
	sideEffect,
	handlePageHover
}: {
	page: number;
	take: number;
	count: number;
	setPage: Dispatch<SetStateAction<number>>;
	sideEffect?: () => void;
	handlePageHover?: (dir?: 1 | -1) => void;
}) {
	return (
		<div className="w-full flex justify-center flex-1">
			<div className="grid grid-cols-3 items-center grow max-w-150">
				<div className="justify-self-end">
					<button
						className="btn btn-ghost"
						disabled={page === 1}
						onClick={() => {
							if (sideEffect) {
								sideEffect();
							}

							setPage(1);
						}}
						onMouseEnter={handlePageHover ? () => handlePageHover(-1) : undefined}
						type="button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={page === 1 ? "text-base-content/30" : "text-base-content"}
						>
							<path d="M19 19L12.7071 12.7071C12.3166 12.3166 12.3166 11.6834 12.7071 11.2929L19 5" />
							<path d="M11 19L4.70711 12.7071C4.31658 12.3166 4.31658 11.6834 4.70711 11.2929L11 5" />
						</svg>
					</button>
					<button
						className="btn btn-ghost"
						disabled={page === 1}
						onClick={() => {
							if (sideEffect) {
								sideEffect();
							}

							setPage(page - 1);
						}}
						onMouseEnter={handlePageHover ? () => handlePageHover(-1) : undefined}
						type="button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={page === 1 ? "text-base-content/30" : "text-base-content"}
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
				</div>

				<div className="text-base-content text-center grow select-none">
					{Math.min((page - 1) * take + 1, count)}-{Math.min(page * take, count)} of {count}
				</div>

				<div className="justify-self-start">
					<button
						className="btn btn-ghost"
						disabled={page * take >= count}
						onClick={() => {
							if (sideEffect) {
								sideEffect();
							}

							setPage(page + 1);
						}}
						onMouseEnter={handlePageHover ? () => handlePageHover() : undefined}
						type="button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={page * take >= count ? "text-base-content/30" : "text-base-content"}
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
					<button
						className="btn btn-ghost"
						disabled={page * take >= count}
						onClick={() => {
							if (sideEffect) {
								sideEffect();
							}

							setPage(Math.ceil(count / take));
						}}
						onMouseEnter={handlePageHover ? () => handlePageHover() : undefined}
						type="button"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
							className={page * take >= count ? "text-base-content/30" : "text-base-content"}
						>
							<path d="M5.5 5L11.7929 11.2929C12.1834 11.6834 12.1834 12.3166 11.7929 12.7071L5.5 19" />
							<path d="M13.5 5L19.7929 11.2929C20.1834 11.6834 20.1834 12.3166 19.7929 12.7071L13.5 19" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
