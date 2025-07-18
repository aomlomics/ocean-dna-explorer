import ExploreSearch from "@/app/components/explore/ExploreSearch";
import ExploreTabButtons from "@/app/components/explore/ExploreTabButtons";
import TableFilter from "@/app/components/explore/filters/TableFilter";
import Table from "@/app/components/paginated/Table";
import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";

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

	return (
		<div className="grid grid-cols-[20%_80%] gap-6 pt-6">
			<TableFilter
				tableConfig={[
					{
						field: "sequenceLength",
						type: "range",
						gte: minMaxSeqLength._min.sequenceLength as number,
						lte: minMaxSeqLength._max.sequenceLength as number
					}
				]}
			/>
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

				<div className="space-y-6">
					{/* <ExploreSearch table="feature" defaultField="featureid" /> */}
					<h1 className="text-xl font-medium text-base-content col-start-4 col-span-2">
						Showing <span className="text-primary">Features</span>
					</h1>

					<div className="bg-base-100 rounded-lg border border-base-300 p-6">
						<Table table="feature" defaultTake={10} hideEmptyAtStart filterHeadersAtStart />
					</div>
				</div>
			</div>
		</div>
	);
}
