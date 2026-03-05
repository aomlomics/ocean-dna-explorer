import Link from "next/link";
import PhyloPicClient from "../../images/PhyloPicClient";
import { Taxonomy } from "@/app/generated/prisma/client";

export default function TaxaGridItem({ item }: { item: Taxonomy }) {
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
					{item.species ? (
						<>
							<p className="text-primary">Species:</p> <p className="wrap-break-word">{item.species}</p>
						</>
					) : item.genus ? (
						<>
							<p className="text-primary">Genus:</p> <p className="wrap-break-word">{item.genus}</p>
						</>
					) : item.family ? (
						<>
							<p className="text-primary">Family:</p> <p className="wrap-break-word">{item.family}</p>
						</>
					) : item.order ? (
						<>
							<p className="text-primary">Order:</p> <p className="wrap-break-word">{item.order}</p>
						</>
					) : item.class ? (
						<>
							<p className="text-primary">Class:</p> <p className="wrap-break-word">{item.class}</p>
						</>
					) : item.phylum ? (
						<>
							<p className="text-primary">Phylum:</p> <p className="wrap-break-word">{item.phylum}</p>
						</>
					) : item.subdivision ? (
						<>
							<p className="text-primary">Subdivision:</p> <p className="wrap-break-word">{item.subdivision}</p>
						</>
					) : item.division ? (
						<>
							<p className="text-primary">Division:</p> <p className="wrap-break-word">{item.division}</p>
						</>
					) : item.supergroup ? (
						<>
							<p className="text-primary">Supergroup:</p> <p className="wrap-break-word">{item.supergroup}</p>
						</>
					) : item.kingdom ? (
						<>
							<p className="text-primary">Kingdom:</p> <p className="wrap-break-word">{item.kingdom}</p>
						</>
					) : item.domain ? (
						<>
							<p className="text-primary">Domain:</p> <p className="wrap-break-word">{item.domain}</p>
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
