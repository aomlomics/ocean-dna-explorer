export default function LoadingPaginationControls() {
	return (
		<div className="w-full flex justify-center flex-1">
			<div className="grid grid-cols-3 items-center grow max-w-[600px]">
				<div className="justify-self-end">
					<button className="btn btn-ghost" disabled={true} type="button">
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
							className="text-base-content/30"
						>
							<path d="M19 19L12.7071 12.7071C12.3166 12.3166 12.3166 11.6834 12.7071 11.2929L19 5" />
							<path d="M11 19L4.70711 12.7071C4.31658 12.3166 4.31658 11.6834 4.70711 11.2929L11 5" />
						</svg>
					</button>
					<button className="btn btn-ghost" disabled={true} type="button">
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
							className="text-base-content/30"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
				</div>

				<div className="text-base-content text-center grow">
					<span className="loading loading-spinner"></span>
				</div>

				<div className="justify-self-start">
					<button className="btn btn-ghost" disabled={true} type="button">
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
							className="text-base-content/30"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
					<button className="btn btn-ghost" disabled={true} type="button">
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
							className="text-base-content/30"
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
