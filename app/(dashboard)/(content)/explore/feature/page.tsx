import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";

export default async function Feature() {
	const minMaxSeqLength = await prisma.feature.aggregate({
		_min: {
			sequenceLength: true
		},
		_max: {
			sequenceLength: true
		}
	});
	if (!minMaxSeqLength) return <>Loading...</>;

	const tableConfig: FilterConfig[] = [
		{
			field: "sequenceLength",
			type: "range",
			gte: minMaxSeqLength._min.sequenceLength as number,
			lte: minMaxSeqLength._max.sequenceLength as number
		}
	];

	return (
		<ExplorePage table="feature" tableConfig={tableConfig}>
			<div className="px-6 lg:px-0">
				<div className="space-y-4">
					<ExploreTabButtons />
					<div className="bg-base-100 border border-base-300 rounded-lg p-4">
						<p className="mb-2">
							Unique DNA sequences (eg, ASVs) found in samples, typically representing distinct organisms, with their
							consensus taxonomic classification.
						</p>
						<p className="text-sm">
							For more detailed information, visit our{" "}
							<Link href="/help" className="text-primary hover:underline">
								Help page
							</Link>
							.
						</p>
					</div>
				</div>

				<div className="flex justify-between items-center my-4 -mb-1">
					{/* <ExploreSearch table="feature" defaultField="featureid" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Features</span>
					</h1>
					<div className="lg:hidden">
						<label htmlFor="my-drawer" className="btn btn-primary drawer-button">
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
				</div>
					<div className="aspect-5/2 hidden lg:block">
						<div className="rounded-lg border border-base-300 h-full">
							<Table table="feature" defaultTake={25} hideEmptyAtStart filterHeadersAtStart />
						</div>
					</div>
				<div className="lg:hidden">
					<Pagination table="feature" />
				</div>
			</div>
		</ExplorePage>
	);
}
