import LoadingChartCopyButton from "../LoadingChartCopyButton";
import { TREEMAP_DEFAULT_CHILD_RANK, TREEMAP_DEFAULT_PARENT_RANK } from "../../wrappers/TaxonomyVisualize";

export default function LoadingTaxonomyTreemap() {
	return (
		<div className="relative p-6">
			<div className="w-full flex flex-wrap justify-center items-end gap-5 mb-4">
				<fieldset className="fieldset">
					<legend className="fieldset-legend">Large (outer) boxes:</legend>

					<select className="select" disabled>
						<option>{TREEMAP_DEFAULT_PARENT_RANK}</option>
					</select>
				</fieldset>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">Small (inner) boxes:</legend>

					<select className="select" disabled>
						<option>{TREEMAP_DEFAULT_CHILD_RANK}</option>
					</select>
				</fieldset>

				<LoadingChartCopyButton />
			</div>

			<div className="w-full">
				<div className="text-center text-sm font-semibold mb-2">
					Relative Abundance: {TREEMAP_DEFAULT_PARENT_RANK} &gt; {TREEMAP_DEFAULT_CHILD_RANK}
				</div>

				<div className="w-full h-125 grid grid-cols-12 grid-rows-12 gap-px overflow-hidden bg-base-100">
					<div className="col-span-7 row-span-12 bg-error border border-black p-1">
						<div className="h-full flex flex-col">
							<div className="h-5 shrink-0 flex items-center px-1">
								<div className="h-2 w-24 bg-black/20 rounded-sm" />
							</div>

							<div className="flex-1 grid grid-cols-6 grid-rows-12 gap-px min-h-0">
								<div className="col-span-3 row-span-12 bg-error border border-black" />
								<div className="col-span-3 row-span-4 bg-error border border-black" />
								<div className="col-span-3 row-span-3 bg-error border border-black" />
								<div className="col-span-3 row-span-3 bg-error border border-black" />
								<div className="col-span-2 row-span-2 bg-error border border-black" />
								<div className="col-span-1 row-span-2 bg-error border border-black" />
							</div>
						</div>
					</div>

					<div className="col-start-8 col-span-5 row-start-1 row-span-7 bg-warning border border-black p-1">
						<div className="h-full flex flex-col">
							<div className="h-5 shrink-0 flex items-center px-1">
								<div className="h-2 w-28 bg-black/20 rounded-sm" />
							</div>

							<div className="flex-1 grid grid-cols-6 grid-rows-8 gap-px min-h-0">
								<div className="col-span-3 row-span-8 bg-warning border border-black" />
								<div className="col-span-3 row-span-3 bg-warning border border-black" />
								<div className="col-span-3 row-span-3 bg-warning border border-black" />
								<div className="col-span-2 row-span-2 bg-warning border border-black" />
								<div className="col-span-1 row-span-2 bg-warning border border-black" />
							</div>
						</div>
					</div>

					<div className="col-start-8 col-span-3 row-start-8 row-span-5 bg-primary border border-black p-1">
						<div className="h-full flex flex-col">
							<div className="h-5 shrink-0 flex items-center px-1">
								<div className="h-2 w-14 bg-black/20 rounded-sm" />
							</div>

							<div className="flex-1 grid grid-cols-4 grid-rows-6 gap-px min-h-0">
								<div className="col-span-2 row-span-6 bg-primary border border-black" />
								<div className="col-span-2 row-span-2 bg-primary border border-black" />
								<div className="col-span-2 row-span-2 bg-primary border border-black" />
								<div className="col-span-1 row-span-2 bg-primary border border-black" />
								<div className="col-span-1 row-span-2 bg-primary border border-black" />
							</div>
						</div>
					</div>

					<div className="col-start-11 col-span-2 row-start-8 row-span-3 bg-info border border-black p-1">
						<div className="h-full flex flex-col">
							<div className="h-5 shrink-0 flex items-center px-1">
								<div className="h-2 w-20 bg-black/20 rounded-sm" />
							</div>

							<div className="flex-1 grid grid-cols-6 grid-rows-6 gap-px min-h-0">
								<div className="col-span-3 row-span-6 bg-info border border-black" />
								<div className="col-span-3 row-span-2 bg-info border border-black" />
								<div className="col-span-3 row-span-2 bg-info border border-black" />
								<div className="col-span-3 row-span-2 bg-info border border-black" />
							</div>
						</div>
					</div>

					<div className="col-start-11 col-span-2 row-start-11 row-span-2 bg-success border border-black p-1">
						<div className="h-full flex flex-col">
							<div className="h-4 shrink-0 flex items-center px-1">
								<div className="h-2 w-16 bg-black/20 rounded-sm" />
							</div>

							<div className="flex-1 grid grid-cols-4 grid-rows-2 gap-px min-h-0">
								<div className="col-span-2 row-span-2 bg-success border border-black" />
								<div className="bg-success row-span-2 border border-black" />
								<div className="bg-success border border-black" />
								<div className="bg-success border border-black" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="absolute left-0 top-0 w-full h-full bg-black/20 rounded-md flex justify-center items-center">
				<span className="loading loading-spinner loading-xl w-1/6" />
			</div>
		</div>
	);
}
