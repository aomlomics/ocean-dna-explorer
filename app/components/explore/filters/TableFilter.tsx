import { Suspense } from "react";
import ActualTableFilter from "./ActualTableFilter";
import { FilterConfig } from "./filterHelpers";

export default function TableFilter({ tableConfig }: { tableConfig: FilterConfig[] }) {
	return (
		<Suspense
			fallback={
				<div className="bg-base-100 rounded-lg border border-base-300 sticky top-6">
					<div className="p-4 border-b border-base-300 bg-base-200/50">
						<div className="flex items-center gap-3">
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
								className="text-primary"
							>
								<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
							</svg>
							<div>
								<h3 className="font-medium text-base-content">Filters</h3>
							</div>
						</div>
					</div>

					<div className="divide-y divide-base-300"></div>
				</div>
			}
		>
			<ActualTableFilter tableConfig={tableConfig} />
		</Suspense>
	);
}
