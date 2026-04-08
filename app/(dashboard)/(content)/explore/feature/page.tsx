import { prisma } from "@/app/helpers/prisma";
import Link from "next/link";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";

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

	const tableConfig: FilterConfig[] = [
		{
			field: "sequenceLength_ODE",
			type: "range",
			gte: minMaxSeqLength._min.sequenceLength_ODE as number,
			lte: minMaxSeqLength._max.sequenceLength_ODE as number
		}
	];

	return (
		<ExplorePage table="feature" tableConfig={tableConfig}>
			<div className="w-full space-y-4">
				<div className="text-base-content/80 space-y-2">
					<p>{TableMetadata.feature.description}</p>
					<p className="text-sm">
						For more detailed information, visit our{" "}
						<Link href="/help" className="link link-primary link-hover">
							Help page
						</Link>
						.
					</p>
				</div>
			</div>
		</ExplorePage>
	);
}
