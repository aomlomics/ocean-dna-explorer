import Search from "@/app/components/Search";
import { Suspense } from "react";

export default async function Dashboard() {
	const sampleColumns = [
		"Sample Storage Temperature",
		"Filter Material",
		"DNA Concentration",
		"Sample Volume",
		"Storage Duration",
		"Filter Size",
		"Sample Location",
		"Collection Date"
	];

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
				<div className="mb-8">
					<Suspense fallback={null}>
						<Search></Search>
					</Suspense>
				</div>

				{/* Sample Search Terms */}
				<div className="flex flex-wrap gap-3 mb-8">
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
				</div>

				{/* Results Section */}
				<div className="bg-base-200 p-4 rounded-lg">
					<h2 className="text-xl mb-4">
						Showing all <span className="text-primary font-bold">Samples</span> that match your search
					</h2>

					{/* Stats */}
					<div className="stats shadow mb-4 w-full">
						<div className="stat">
							<div className="stat-title">Total Results</div>
							<div className="stat-value">89</div>
							<div className="stat-desc">↗︎ 400 (22%)</div>
						</div>
						<div className="stat">
							<div className="stat-title">Page Views</div>
							<div className="stat-value">2.7k</div>
							<div className="stat-desc">↗︎ 90 (14%)</div>
						</div>
					</div>

					{/* Sample Cards */}
					<div className="grid gap-4">
						{[1, 2, 3].map((item) => (
							<div key={item} className="card bg-base-100 shadow-sm">
								<div className="card-body">
									<h3 className="card-title">Sample {item}</h3>
									<div className="divider"></div>
									<div className="flex flex-wrap gap-2">
										<span className="badge badge-outline">Temperature: 23°C</span>
										<span className="badge badge-outline">pH: 7.4</span>
										<span className="badge badge-outline">Depth: 100m</span>
									</div>
									<div className="card-actions justify-end mt-4">
										<button className="btn btn-primary btn-sm">View Details</button>
										<button className="btn btn-ghost btn-sm">Download</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Pagination */}
					<div className="join grid grid-cols-2 mt-4">
						<button className="join-item btn btn-outline">Previous page</button>
						<button className="join-item btn btn-outline">Next</button>
					</div>
				</div>
			</div>

			{/* Drawer sidebar */}
			<div className="drawer-side z-40">
				<label htmlFor="my-drawer" className="drawer-overlay"></label>
				<aside className="menu bg-base-200 w-80 min-h-full p-4">
					<h2 className="text-xl font-bold mb-4 text-primary">Search Filters</h2>

					{/* Example 1: Dropdown with DaisyUI styling */}
					<div className="form-control w-full mb-4">
						<label className="label">
							<span className="label-text">Example 1: Select Filter</span>
							<span className="label-text-alt">
								<div className="tooltip" data-tip="Choose from available options">
									<button className="btn btn-circle btn-ghost btn-xs">?</button>
								</div>
							</span>
						</label>
						<select className="select select-bordered select-primary w-full" defaultValue={"Pick one"}>
							<option disabled>Pick one</option>
							<option>Option 1</option>
							<option>Option 2</option>
							<option>Option 3</option>
						</select>
					</div>

					{/* Example 2: Range with steps */}
					<div className="form-control mb-4">
						<label className="label">
							<span className="label-text">Example 2: Value Range</span>
							<span className="label-text-alt">0-100</span>
						</label>
						<input type="range" min="0" max="100" className="range range-primary range-xs" step="25" />
						<div className="w-full flex justify-between text-xs px-2">
							<span>|</span>
							<span>|</span>
							<span>|</span>
							<span>|</span>
							<span>|</span>
						</div>
					</div>

					{/* Example 3: Checkboxes with DaisyUI styling */}
					<div className="form-control mb-4">
						<label className="label">
							<span className="label-text">Example 3: Multiple Selection</span>
						</label>
						<div className="flex flex-col gap-2">
							{["Option A", "Option B", "Option C"].map((option) => (
								<div key={option} className="form-control">
									<label className="label cursor-pointer">
										<span className="label-text">{option}</span>
										<input type="checkbox" className="checkbox checkbox-primary" />
									</label>
								</div>
							))}
						</div>
					</div>

					{/* Example 4: Toggle with DaisyUI styling */}
					<div className="form-control mb-4">
						<label className="label cursor-pointer">
							<span className="label-text">Example 4: Toggle Option</span>
							<input type="checkbox" className="toggle toggle-primary" />
						</label>
					</div>

					{/* Example 5: Radio buttons */}
					<div className="form-control mb-4">
						<label className="label">
							<span className="label-text">Example 5: Single Selection</span>
						</label>
						<div className="flex flex-col gap-2">
							{["Radio 1", "Radio 2", "Radio 3"].map((radio) => (
								<div key={radio} className="form-control">
									<label className="label cursor-pointer">
										<span className="label-text">{radio}</span>
										<input type="radio" name="radio-10" className="radio radio-primary" />
									</label>
								</div>
							))}
						</div>
					</div>

					{/* Apply Filters Button */}
					<button className="btn btn-primary w-full mt-4">Apply Filters</button>
				</aside>
			</div>
		</div>
	);
}
