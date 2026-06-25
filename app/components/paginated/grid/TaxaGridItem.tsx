import Link from "next/link";
import PhyloPicClient from "../../images/PhyloPicClient";
import { Taxonomy } from "@/app/generated/prisma/client";
import { TaxonomicRanks } from "@/types/objects";

export default function TaxaGridItem({ item }: { item: Taxonomy }) {
	const mostSpecificRank = TaxonomicRanks.toReversed().find((rank) => item[rank]);

	return (
		<Link
			href={`/explore/taxonomy/${encodeURIComponent(item.taxonomy)}`}
			key={item.taxonomy}
			className="card bg-base-200 hover:bg-base-300 transition-colors duration-200 aspect-square"
		>
			<div className="card-body p-1 lg:p-2 gap-0">
				<div
					className="tooltip tooltip-primary w-full wrap-break-word before:w-full! before:bg-base-100 before:text-base-content before:border before:border-base-300 mb-1"
					data-tip={item.taxonomy}
				>
					{mostSpecificRank ? (
						<>
							<p className="text-primary">{mostSpecificRank.slice(0, 1).toUpperCase() + mostSpecificRank.slice(1)}:</p>{" "}
							<p className="wrap-break-word">{item[mostSpecificRank]}</p>
						</>
					) : (
						"Error: no taxonomy rank found"
					)}
				</div>

				<div className="grow border-t pt-1">
					<PhyloPicClient taxonomy={item} />
				</div>
			</div>
		</Link>
	);
}
