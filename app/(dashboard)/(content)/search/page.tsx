import Search from "@/app/components/search/Search";
import SearchResults from "@/app/components/search/SearchResults";

export default async function Dashboard() {
	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer" type="checkbox" className="drawer-toggle" />

			{/* Drawer content */}
			<div className="drawer-content flex flex-col p-5">
				{/* Mobile drawer toggle */}
				<div className="lg:hidden">
					<label htmlFor="my-drawer" className="btn btn-primary drawer-button mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							className="inline-block w-5 h-5 stroke-current"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
						Filter Options
					</label>
				</div>

				{/* Search Bar Section */}
				<Search />

				{/* Sample Search Terms */}
				{/* <div className="flex flex-wrap gap-3 mb-8">
					{sampleColumns.map((column, index) => (
						<div key={index} className="badge badge-lg badge-primary gap-2 p-4 cursor-pointer hover:badge-secondary">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								className="inline-block w-4 h-4 stroke-current"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
							{column}
						</div>
					))}
				</div> */}

				{/* Results Section */}
				<SearchResults />
			</div>
		</div>
	);
}
