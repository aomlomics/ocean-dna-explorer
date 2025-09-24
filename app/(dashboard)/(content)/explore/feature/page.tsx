import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import Table from "@/app/components/paginated/Table";
import Pagination from "@/app/components/paginated/Pagination";
import TableFilter from "@/app/components/explore/filters/TableFilter";

export default async function Feature() {
	const minMaxSeqLength = await prisma.feature.aggregate({
		_min: {
			sequenceLength_ODE: true
		},
		_max: {
			sequenceLength_ODE: true
		}
	});
	if (!minMaxSeqLength) return <>Loading...</>;

	return (
		<ExplorePage table="feature" tableConfig={[
			{
				field: "sequenceLength_ODE",
				type: "range",
				gte: minMaxSeqLength._min.sequenceLength_ODE as number,
				lte: minMaxSeqLength._max.sequenceLength_ODE as number
			}
		]}>
			<div className="space-y-6">
				<div className="space-y-[-1px]">
					<div className="border-b border-base-300">
						<nav className="flex tabs tabs-lifted">
							<ExploreTabButtons />
						</nav>
					</div>
					<div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-6">
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

				<div className="flex justify-between items-center my-4">
					{/* <ExploreSearch table="feature" defaultField="featureid" /> */}
					<h1 className="text-xl font-medium text-base-content">
						Showing <span className="text-primary">Features</span>
					</h1>
				</div>

				<TableFilter
					tableConfig={[
						{
							field: "sequenceLength_ODE",
							type: "range",
							gte: minMaxSeqLength._min.sequenceLength_ODE as number,
							lte: minMaxSeqLength._max.sequenceLength_ODE as number
						}
					]}
				/>
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
