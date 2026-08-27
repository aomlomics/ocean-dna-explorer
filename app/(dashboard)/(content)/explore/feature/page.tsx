import { trustedPrisma } from "@/app/helpers/prisma";
import { FilterConfig } from "@/app/components/explore/filters/filterHelpers";
import ExplorePage from "@/app/components/explore/ExplorePage";
import TableMetadata from "@/types/tableMetadata";
import type { Metadata } from "next";

const tableMeta = TableMetadata.feature;
const title = "Explore " + tableMeta.plural;
export const metadata: Metadata = {
	title,
	description: title + ": " + tableMeta.description
};

export default async function Feature() {
	const minMaxSeqLength = await trustedPrisma.feature.aggregate({
		_min: {
			sequenceLength_ODE: true
		},
		_max: {
			sequenceLength_ODE: true
		}
	});

	const tableConfig: FilterConfig[] = [
		{
			field: "sequenceLength_ODE",
			type: "range",
			gte: minMaxSeqLength._min.sequenceLength_ODE as number,
			lte: minMaxSeqLength._max.sequenceLength_ODE as number
		}
	];

	return <ExplorePage table="feature" tableConfig={tableConfig} />;
}
