import { Suspense } from "react";
import ActualTableFilter from "./ActualTableFilter";
import { FilterConfig } from "./filterHelpers";

export default function TableFilter({
	tableConfig,
	sticky = false,
	defaultOpen = false,
	embedded = false
}: {
	tableConfig: FilterConfig[];
	sticky?: boolean;
	defaultOpen?: boolean;
	embedded?: boolean;
}) {
	return (
		<Suspense
			fallback={
				<div
					className={`bg-base-100 rounded-lg border border-base-300 shadow-inner max-w-lg ${sticky ? "sticky top-6 z-30" : ""}`}
				>
					<div className="px-5 py-3 border-b border-base-300 bg-base-200/50">
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

					<div className="divide-y divide-base-300 p-5 pt-3 pb-6 min-h-55"></div>
				</div>
			}
		>
			<ActualTableFilter tableConfig={tableConfig} sticky={sticky} defaultOpen={defaultOpen} embedded={embedded} />
		</Suspense>
	);
}
